const { decode } = require('jsonwebtoken');
const config = require('../lib/config');
const findUsersByEmail = require('../lib/findUsersByEmail');
const findUsersByPhone = require('../lib/findUsersByPhone');
const getUser = require('../lib/getUser');
const indexTemplate = require('../templates/index');
const logger = require('../lib/logger');
const stylesheet = require('../lib/stylesheet');
const getIdentityProviderPublicName = require('../lib/idProviders');
const humanizeArray = require('../lib/humanize');
const { resolveLocale } = require('../lib/locale');
const { getSettings } = require('../lib/storage');
const util = require('util');


const decodeToken = token =>
  new Promise((resolve, reject) => {
    try {
      resolve(decode(token));
    } catch (e) {
      reject(e);
    }
  });

const fetchUsersFromToken = ({ sub, phone_number }) =>
findUsersByPhone(phone_number).then(users => ({
    currentUser: users.find(u => u.user_id === sub),
    matchingUsers: users.filter(u => u.user_id !== sub)
  }));

  const getUserFromToken = ({sub}) => {
    return getUser(sub).then( (users) => {
      console.log("it is here", users);
      return users;
    });
  };

module.exports = () => ({
  method: 'GET',
  path: '/',
  config: {
    auth: false
  },
  handler: (req, reply) => {
    console.log("inside the handler");
    const linkingState = req.state['account-linking-admin-state'];
    console.log("Linking state", linkingState);
    if (typeof linkingState !== 'undefined' && linkingState !== '') {
      console.log("Redirecting to adm");
      reply.redirect(`${config('PUBLIC_WT_URL')}/admin`).state('account-linking-admin-state', '');
      return;
    }

    const stylesheetHelper = stylesheet(config('NODE_ENV') === 'production');
    const stylesheetTag = stylesheetHelper.tag('link');
    const customCSSTag = stylesheetHelper.tag(config('CUSTOM_CSS'));

    const dynamicSettings = {};

    if (req.query.locale) dynamicSettings.locale = req.query.locale;
    if (req.query.color) dynamicSettings.color = `#${req.query.color}`;
    if (req.query.title) dynamicSettings.title = req.query.title;
    if (req.query.logoPath) dynamicSettings.logoPath = req.query.logoPath;

    console.log("req.query.child_token", req.query.child_token);

    decodeToken(req.query.child_token)
      .then((token) => {

        fetchUsersFromToken(token)
          .then(({currentUser, matchingUsers }) => {

            // console.log("current user before check", currentUser);

            // if(!currentUser){
            //   var x =  await getUserFromToken(token);
            //   currentUser =  x;
            // }

            // console.log("current user", currentUser);

            getSettings().then((settings) => {
              const userMetadata = (matchingUsers[0] && matchingUsers[0].user_metadata) || {};
              const locale = userMetadata.locale || settings.locale;
              resolveLocale(locale).then((t) => {
                const rawIdentities = matchingUsers.length > 0 ? matchingUsers[0].identities : [];
                const identities = rawIdentities
                  .map(id => id.provider)
                  .map(getIdentityProviderPublicName);
                const humanizedIdentities = humanizeArray(identities, t('or'));

                getUserFromToken(token).then(currentUser => {
                  reply(
                    indexTemplate({
                      dynamicSettings,
                      stylesheetTag,
                      currentUser,
                      matchingUsers,
                      customCSSTag,
                      locale,
                      identities: humanizedIdentities
                    })
                  );
                })

                
              });
            });
          })
          .catch((err) => {
            const state = req.query.state;
            logger.error('An error was encountered: ', err);
            console.log("is this the error is it here?", util.inspect(err, {depth: null}));
            logger.info(
              `Redirecting to failed link to /continue: ${token.iss}continue?state=${
                req.query.state
              }&error=${err}`
            );

            reply.redirect(`${token.iss}continue?state=${state}&error=${err}&msg=${util.inspect(err, {depth: null})}`);
          });
      })
      .catch((err) => {
        logger.error('An invalid token was provided', err);
        console.log('An invalid token was provided', err);

        indexTemplate({
          dynamicSettings,
          stylesheetTag,
          currentUser: null,
          matchingUsers: [],
          customCSSTag
        }).then((template) => {
          reply(template).code(400);
        });
      });
  }
});
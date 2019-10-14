const defaultTemplate = require('./utils/defaultTemplate');
const getStorage = require('../lib/db').get;

const buildAuth0Widget = require('./utils/auth0widget');
const buildExtensionScripts = require('./utils/extensionScripts');
const googlePhone = require("google-libphonenumber");


const VAR_REGEX = /\{\{\s*(.*?)\s*\}\}/g;
const render = (template, locals = {}) => {
  if (!template || typeof template !== 'string') {
    throw new Error('Invalid template provided');
  }

  return template.replace(VAR_REGEX, (match, name) => locals[name] || '');
};

module.exports = ({
  stylesheetTag, customCSSTag, currentUser, matchingUsers, dynamicSettings, identities, locale
}) =>
  Promise.all([buildAuth0Widget(dynamicSettings, identities, locale), getStorage().read()])
    .then(([widget, data]) => {
      const template = data.settings ? data.settings.template : defaultTemplate;

      console.log("it is here");

      currentUser.user_metadata = currentUser.user_metadata || {};
      currentUser.user_metadata.mobileNumber = currentUser.user_metadata.mobileNumber || "";

      if(currentUser.user_metadata.mobileNumber !== ""){

      const phoneUtil = googlePhone.PhoneNumberUtil.getInstance();
      const PNF = googlePhone.PhoneNumberFormat;
      var number = phoneUtil.parseAndKeepRawInput(
        currentUser.user_metadata.mobileNumber,
        "ZA"
      );

      var formattedNumber = phoneUtil
        .format(number, PNF.NATIONAL)
        .split(" ")
        .join("");
  
      console.log(
        "Number format update " +
          currentUser.user_metadata.mobileNumber +
          " to " +
          formattedNumber
      );

      currentUser.user_metadata.mobileNumber = formattedNumber;
    }

      return render(template, {
        ExtensionCSS: stylesheetTag,
        EmbeededCss: "buildExtensionCSS",
        CustomCSS: customCSSTag,
        Auth0Widget: widget,
        ExtensionScripts: buildExtensionScripts(currentUser, matchingUsers)
      });
    });

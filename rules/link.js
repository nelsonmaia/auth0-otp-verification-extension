/**
 *  This file is meant to be included as a string template
 */
module.exports = ({ extensionURL = '', username = 'Unknown', clientID = '', clientSecret = '' }) => {
  const template = `function (user, context, callback) {
  /**
   * This rule has been automatically generated by
   * ${username} - Auth0 -  at ${new Date().toISOString()}
   */
  var request = require('request@2.56.0');
  var queryString = require('querystring');
  var Promise = require('native-or-bluebird@1.2.0');
  var jwt = require('jsonwebtoken@7.1.9');
  var CONTINUE_PROTOCOL = 'redirect-callback';
  var LOG_TAG = '[OTP-VERIFICATION]: ';
  console.log(LOG_TAG, 'Entered Account Link Rule');
  // 'query' can be undefined when using '/oauth/token' to log in
  context.request.query = context.request.query || {};
  var config = {
    endpoints: {
      linking: '${extensionURL.replace(/\/$/g, '')}',
      userApi: auth0.baseUrl + '/users',
      usersByEmailApi: auth0.baseUrl + '/users-by-email'
    },
    token: {
      clientId: '${clientID}',
      clientSecret: '${clientSecret}',
      issuer: auth0.domain
    }
  };
  // If the user does not have an e-mail account, TEST MY RULE
  // just continue the authentication flow.
  // See auth0-extensions/auth0-account-link-extension#33
  // 
   console.log(LOG_TAG, 'Verifying user email', user.email);
  // if (user.email === undefined) {
  //   return callback(null, user, context);
  // }

  createStrategy().then(callbackWithSuccess).catch(callbackWithFailure);

  function createStrategy() {
    if (shouldLink()) { 
      return linkAccounts();
    } else if (shouldPrompt()) {
      return promptUser();

    }

    return continueAuth();

    function shouldLink() {
       console.log(LOG_TAG, 'Should Link', !!context.request.query.link_account_token);
       console.log(LOG_TAG, context.request.query.link_account_token );
      return !!context.request.query.link_account_token;
    }

    function shouldPrompt() {
      
      console.log(LOG_TAG, '!insideRedirect()', !insideRedirect());
      console.log(LOG_TAG, '!redirectingToContinue()', !redirectingToContinue());
      
      
      var should = !insideRedirect() && !redirectingToContinue() ;//&& firstLogin();
       console.log(LOG_TAG, 'Should Prompt', should);
      
      return should;

      // Check if we're inside a redirect
      // in order to avoid a redirect loop
      // TODO: May no longer be necessary
      function insideRedirect() {
        return context.request.query.redirect_uri &&
          context.request.query.redirect_uri.indexOf(config.endpoints.linking) !== -1;
      }

      // Check if this is the first login of the user
      // since merging already active accounts can be a
      // destructive action
      function firstLogin() {
        return context.stats.loginsCount <= 1;
      }

      // Check if we're coming back from a redirect
      // in order to avoid a redirect loop. User will
      // be sent to /continue at this point. We need
      // to assign them to their primary user if so.
      function redirectingToContinue() {
        return context.protocol === CONTINUE_PROTOCOL;
      }
    }
  }

  function verifyToken(token, secret) {
    return new Promise(function(resolve, reject) {
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          return reject(err);
        }

        return resolve(decoded);
      });
    });
  }

  function linkAccounts() {
    var secondAccountToken = context.request.query.link_account_token;

    return verifyToken(secondAccountToken, config.token.clientSecret)
      .then(function(decodedToken) {
        // Redirect early if tokens are mismatched
        // TODO
        // if (user.email !== decodedToken.email) {
        //   console.error(LOG_TAG, 'User: ', decodedToken.email, 'tried to link to account ', user.email);
        //   context.redirect = {
        //     url: buildRedirectUrl(secondAccountToken, context.request.query, 'accountMismatch')
        //   };

        //   return user;
        // }

        //var linkUri = config.endpoints.userApi+'/'+user.user_id+'/identities';
        var linkUri = config.endpoints.userApi+'/'+decodedToken.sub+'/identities';
        var headers = {
          Authorization: 'Bearer ' + auth0.accessToken,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        };

        return apiCall({
          method: 'GET',
          //url: config.endpoints.userApi+'/'+decodedToken.sub+'?fields=identities',
          url: config.endpoints.userApi+'/'+user.user_id+'?fields=identities',
          headers: headers
        })
          .then(function(secondaryUser) {
            var provider = secondaryUser &&
              secondaryUser.identities &&
              secondaryUser.identities[0] &&
              secondaryUser.identities[0].provider;

            return apiCall({
              method: 'POST',
              url: linkUri,
              headers,
              json: { user_id: user.user_id, provider: provider }
            });
          })
          .then(function(_) {
            // TODO: Ask about this
            console.info(LOG_TAG, 'Successfully linked accounts for user: ', user.email);
            context.primaryUser = decodedToken.sub;
            return _;
          });
      });
  }

  function continueAuth() {
    return Promise.resolve();
  }

  function promptUser() {
    return searchUsersWithSameEmail().then(function transformUsers(users) {
      
console.log("users found", users);


      return users.filter(function(u) {
        return u.user_id !== user.user_id;
      }).map(function(user) {
        return {
          userId: user.user_id,
          email: user.email,
          picture: user.picture,
          connections: user.identities.map(function(identity) {
            return identity.connection;
          })
        };
      });
    }).then(function redirectToExtension(targetUsers) {
      console.log("target users before function", targetUsers);
      console.log("context.query", context.request.query);
      if (targetUsers.length > 0) {
        context.redirect = {
          // url: buildRedirectUrl(createToken(config.token), targetUsers)
           url: buildRedirectUrl(createToken(config.token), context.request.query)
        };
      }
    });
  }

  function callbackWithSuccess(_) {
     console.log(LOG_TAG, 'Callback With Success');
    callback(null, user, context);

    return _;
  }

  function callbackWithFailure(err) {
     console.log(LOG_TAG, 'Callback with failure');
    console.error(LOG_TAG, err.message, err.stack);

    callback(err, user, context);
  }

  function createToken(tokenInfo, targetUsers) {

    console.log("tokenInfo", tokenInfo);
    var options = {
      expiresIn: '5m',
      audience: tokenInfo.clientId,
      issuer: qualifyDomain(tokenInfo.issuer)
    };

    console.log("target users", targetUsers);

    var userSub = {
      sub: user.user_id,
      email: user.email,
      base: auth0.baseUrl
    };

    console.log("user sub", userSub);

    return jwt.sign(userSub, tokenInfo.clientSecret, options);
  }

  function searchUsersWithSameEmail() {
    return apiCall({
      method: 'GET',
      url: config.endpoints.usersByEmailApi,
      qs: {q: 'phone_number:"+447468341388"', search_engine: 'v3'}
    });
  }

  // Consider moving this logic out of the rule and into the extension
  function buildRedirectUrl(token, q, errorType) {
    
    console.log("Build Redirect URL", q.original_state);
    
    var params = {
      child_token: token,
      audience: q.audience,
      client_id: q.client_id,
      redirect_uri: q.redirect_uri,
      scope: q.scope,
      response_type: q.response_type,
      auth0Client: q.auth0Client,
      original_state: q.original_state || q.state,
      nonce: q.nonce,
      error_type: errorType
    };

    return config.endpoints.linking + '?' + queryString.encode(params);
  }

  function qualifyDomain(domain) {
    return 'https://'+domain+'/';
  }

  function apiCall(options) {
    return new Promise(function(resolve, reject) {
      var reqOptions = Object.assign({
        url: options.url,
        headers: {
          Authorization: 'Bearer ' + auth0.accessToken,
          Accept: 'application/json'
        },
        json: true
      }, options);

      request(reqOptions, function handleResponse(err, response, body) {
        if (err) {
          reject(err);
        } else if (response.statusCode < 200 || response.statusCode >= 300) {
          console.error(LOG_TAG, 'API call failed: ', body);
          reject(new Error(body));
        } else {
          resolve(response.body);
        }
      });
    });
  }
}`;

  return template;
};
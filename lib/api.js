const { managementApi } = require('auth0-extension-tools');
const request = require('request');
const config = require('./config');
const logger = require('../lib/logger');
const util = require('util');

// Memoized because config unavailable at this point
const urlHelper = {
  base: undefined,
  getBaseUrl() {
    if (!this.base) {
      this.base = `https://${config('AUTH0_DOMAIN')}/api/v2`;
    }

    return this.base;
  },
  endpoint(path) {
    return `${this.getBaseUrl()}/${path}`;
  }
};

const getToken = () => {
  let accessTokenCached = managementApi.getAccessTokenCached(
    config('AUTH0_DOMAIN'),
    config('AUTH0_CLIENT_ID'),
    config('AUTH0_CLIENT_SECRET')
  );

  console.log("OTP Verification - lib/api/api.js", "accessTokenCached", accessTokenCached);

  return accessTokenCached;
};

const apiCall = ({ path, ...options } = {}) =>
  getToken().then(
    token => 
      new Promise((resolve, reject) => {

        logger.info("CUSTOM EXTENSION - The token is " + token);
        console.log("CUSTOM EXTENSION - The token is " + token);

        console.log("options", JSON.stringify(options));
        console.log("path", path);

        request(
          {
            url: urlHelper.endpoint(path),
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            },
            json: true,
            ...options
          },
          (err, response, body) => {
            if (err) {
              logger.error("error is " + err);
              console.error("error is " + err);
              reject(err);
            } else if (response.statusCode < 200 || response.statusCode >= 300) {
              logger.error('API call failed: ', response.statusCode, body);
              console.error('API call failed: ', response.statusCode, body);
              reject(new Error(body));
            } else {
              logger.info("The response is " + response.body);
              console.info("The response is " + response.body);
              console.info("The response is " + response);
              console.info("The response is " +  util.inspect(response.body, {depth: null}));
              resolve(response.body);
            }
          }
        );
      })
  ).catch( err => {
    console.error("OTP Verification - lib/api/api.js", err);
  });

module.exports = apiCall;

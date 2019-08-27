const { managementApi } = require('auth0-extension-tools');
const request = require('request');
const config = require('./config');
const logger = require('../lib/logger');

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

const getToken = () =>
  managementApi.getAccessTokenCached(
    config('AUTH0_DOMAIN'),
    config('AUTH0_CLIENT_ID'),
    config('AUTH0_CLIENT_SECRET')
  );

const apiCall = ({ path, ...options } = {}) =>
  getToken().then(
    token =>
      new Promise((resolve, reject) => {

        logger.info("CUSTOM EXTENSION - The token is " + token);

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
              reject(err);
            } else if (response.statusCode < 200 || response.statusCode >= 300) {
              logger.error('API call failed: ', response.status, body);
              reject(new Error(body));
            } else {
              logger.info("The response is " + response.body);

              resolve(response.body);
            }
          }
        );
      })
  );

module.exports = apiCall;

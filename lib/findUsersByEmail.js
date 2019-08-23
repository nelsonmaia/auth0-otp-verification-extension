const apiCall = require('./api');

const findUsersByEmail = email =>
 apiCall({
  method: 'GET',
  url: config.endpoints.usersByEmailApi,
  qs: {q: 'phone_number:"+447468341388"', search_engine: 'v3'}
});

  // apiCall({
  //   path: 'users-by-email',
  //   qs: { email }
  // });

module.exports = findUsersByEmail;

const apiCall = require('./api');

const findUsersByEmail = email =>

 console.log("============ it is here ============");

 apiCall({
  path: 'users-by-email',
  qs: {q: 'phone_number:"+447468341388"', search_engine: 'v3'}
});

  // apiCall({
  //   path: 'users-by-email',
  //   qs: { email }
  // });

module.exports = findUsersByEmail;

const apiCall = require('./api');
const logger = require('./logger');

const findUsersByEmail = (phone_number, email) =>
  // apiCall({
  //   path: 'users-by-email',
  //   qs: { email }
  apiCall({
    path: 'users',
    qs: { q: `phone_number:"${phone_number}" AND email:"${email}"`, search_engine: 'v3' }
  });





module.exports = findUsersByEmail;
const apiCall = require('./api');
const logger = require('./logger');

const findUsersByPhone = phone_number =>
  // apiCall({
  //   path: 'users-by-email',
  //   qs: { email }
    apiCall({
        path: 'users',
        qs: {q: `phone_number:"${phone_number}"`, search_engine: 'v3'}
      });
    
  

   

module.exports = findUsersByPhone;
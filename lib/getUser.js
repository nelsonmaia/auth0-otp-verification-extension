const apiCall = require('./api');
const logger = require('./logger');

const getUser = userId =>
  apiCall({
    path: `users/${userId}`
    // apiCall({
    //     path: 'users',
    //     qs: {q: 'phone_number:"+447468341388"', search_engine: 'v3'}
      });
    
  

   

module.exports = getUser;
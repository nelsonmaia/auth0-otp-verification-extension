const apiCall = require('./api');
const logger = require('./logger'); 


const findUsersByEmail = email =>
  // apiCall({
  //   path: 'users-by-email',
  //   qs: { email }
  // });
     logger.info("it is inside the findusers");
     console.log("its in inside");


   apiCall({
    path: 'users-by-email',
    qs: {q: 'phone_number:"+447468341388"', search_engine: 'v3'}
  });

module.exports = findUsersByEmail;
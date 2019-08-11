/*
* Helpers for various tasks
*
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container
const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
    if(typeof(str)=== 'string' && str.trim().length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Takes in an string and return a json object or false
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e){
        return {};
    }
}

// Export the modules

module.exports = helpers;
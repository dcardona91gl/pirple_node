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

// Create a string of random allphanumeric caracters of a gven length

helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        // Define all the possible character that could got into a string
        const possibleCaracters = 'abcdefghijklmnopqrtsuvwxyz0123456789';
        // Start the final string
        let str = '';
        while(str.length < strLength){
            str += possibleCaracters.charAt(Math.floor(Math.random() * possibleCaracters.length));
        };
        return str;
    } else {
        return false;
    }
};
// Export the modules

module.exports = helpers;
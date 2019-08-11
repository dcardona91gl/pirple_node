/*
* Request handlers
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define all the handlers
const handlers = {};

handlers.ping = (data,callback) => {callback(200)};
handlers.notFound = (data,callback) => {callback(404)};

handlers.users = (data, callback) => {
    const allowedMethods = ['post', 'get', 'put', 'delete'];
    if(allowedMethods.includes(data.method)){
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users sub methods
handlers._users = {};

// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
    // Check al the required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' ? data.payload.tosAgreement : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // Users phone cannot exist
        _data.read('users', phone, (err, data)=>{
            if(err){
                //Hash teh pasword
                const hashedPassword = helpers.hash(password);
                if(hashedPassword) {
                    // Create user object
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    // Store the user
                    _data.create('users', phone, userObject, (err)=>{
                        if(!err){
                            callback(200);
                        }else{
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could no hash the user password'});
                }
            }else{
                // User already exists
                callback(400, {'Error': 'A user with that phone number already exists'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Required data: phone
// Optional data: none
// @TODO Only let authenticated users acces their object, Don't let them access anyone elses
handlers._users.get = (data, callback) => {
    // Check thath the phone number provided is valid
    let phone = data.queryStringObject.phone;
    phone = typeof(phone) === 'string' && phone.trim().length == 10 ? phone.trim() : false;

    if(phone){
        //Lookup the user
        _data.read('users', phone, (err, data)=>{
            if(!err && data){
                //Remove the hash password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404, {'Error': 'The requested user does not exists'});
            }
        })
    }else{
        callback(400, {'Error': 'missing required field'});
    }
};

handlers._users.put = (data, callback) => {

};

handlers._users.delete = (data, callback) => {

};
// Export the handlers

module.exports = handlers;

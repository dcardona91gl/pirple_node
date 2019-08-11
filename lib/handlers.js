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

// Required dta: phone
// Optional data: firstname, lastName, password (at least one most be specified)
// @TODO Only let an authenticated user update their own object, Dont't let them update eny one elses
handlers._users.put = (data, callback) => {
    // Check for the required field
    let phone = data.payload.phone;
    phone = typeof(phone) === 'string' && phone.trim().length == 10 ? phone.trim() : false;

    // Check for the optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid

    if(phone) {
        // Error if nothing is sent to update
        if(firstName || lastName || password){
            //Lookup the user
            _data.read('users', phone, (err, userData)=>{
                if(!err && userData){
                    // Update the fields necessary
                    if(firstName)
                        userData.firstName = firstName;

                    if(lastName)
                        userData.lastName = lastName;

                    if(password)
                        userData.hashedPassword = helpers.hash(password);

                        //Store the new updates
                        _data.update('users', phone, userData, (err)=>{
                            if(!err){
                                callback(200);
                            } else {
                                callback(500, {"Error": "Could not update the user"});
                            }
                        });

                }else{
                    callback(400, {"Error": "Specified user does not exist"});
                }
            });
        }else{
            callback(400, {"Error": "Missing fields to update"});
        }
    } else {
        callback(400, {"Error": "Missing parameters"});
    }

};

// Required field: phone
// @TODO Only let an authenticated user delete their object, dont let them delete anybody elses
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback) => {
    
    // Check thath the phone number provided is valid
    let phone = data.queryStringObject.phone;
    phone = typeof(phone) === 'string' && phone.trim().length == 10 ? phone.trim() : false;

    if(phone){
        //Lookup the user
        _data.read('users', phone, (err, data)=>{
            if(!err && data){
                _data.delete('users', phone, err =>{
                    !err ? callback(200) : callback(500, {"Error": "Could not delete the specified user"});
                })
            } else {
                callback(400, {'Error': 'The could not find the specified user'});
            }
        })
    }else{
        callback(400, {'Error': 'missing required field'});
    }
};
// Export the handlers

module.exports = handlers;

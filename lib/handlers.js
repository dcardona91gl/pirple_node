/*
* Request handlers
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define all the handlers
const handlers = {};

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
                        !err ? callback(200) : callback(500, {'Error': 'Could not create the new user'});
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

handlers._users.get = (data, callback) => {
    // Check thath the phone number provided is valid
    let phone = data.queryStringObject.phone;
    phone = typeof(phone) === 'string' && phone.trim().length == 10 ? phone.trim() : false;

    if(phone){
        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        //Verify that the given token is valid for phone number

        handlers._tokens.verifyToken(token, phone, tokenIsValid =>{
            if(tokenIsvalid){
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
                callback(403, {"Error": "Missing or invalid token"});
            }
        });
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
                            !err ? callback(200) : callback(500, {"Error": "Could not update the user"});
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
        });
    }else{
        callback(400, {'Error': 'missing required field'});
    }
};


// Tokens

handlers.tokens = (data, callback) => {
    ['post', 'get', 'put', 'delete'].includes(data.method) ? handlers._tokens[data.method](data, callback) : callback(405);
};

// Container for all the tokens
handlers._tokens = {};

//Tokens - post
// required data: phone - password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    // Check al the required fields are filled out
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone && password) {
        // lookup the user thath matches that phone number
        _data.read('users', phone, (err, userData)=>{
            if(!err && userData){
                // Hash the sent password, and compare it with the password stored in the user object
                const hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword ){
                    // if valid, create a new token witha random name, set expiration date 1 hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        "phone": phone,
                        "id": tokenId,
                        "expires": expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, err => {
                        !err ? callback(200, tokenObject) : callback(500, {"Error": "Culd not create a new token"});
                    });
                }else{
                    callback(400, {"Error" : "Wrong password"});
                }

            }else{
                callback(400, {"Error": "Could not find the specified user"});
            }
        });
    }else{
        callback(400, {"Error": "Missing required fields"});
    }
};


//Tokens - get
//Required data: id
//Optional data: none
handlers._tokens.get = (data, callback) => {
    // Check that the sent id is valid

    // Check thath the phone number provided is valid
    let id = data.queryStringObject.id;
    id = typeof(id) === 'string' && id.trim().length == 20 ? id.trim() : false;

    if(id){
        //Lookup the token
        _data.read('tokens', id, (err, tokenData)=>{
            !err && tokenData ? callback(200, tokenData) : callback(404);
        })
    }else{
        callback(400, {'Error': 'Missing required field'});
    }
};

//Tokens - put
// Required fields: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' ? data.payload.extend : false;
    if(id && extend){
        // Lookup the token
        _data.read('tokens',  id, (err, tokenData)=>{
          if(!err && tokenData)  {
            // Make sure the token isnt already expired
            if(tokenData.expires >= Date.now()){
                // Set the expiration an hour from now
                tokenData.expires = Date.now() + 1000 * 60 * 60;

                //Store the new updates
                _data.update('tokens', id, tokenData, (err)=>{
                    if(!err) {
                        callback(200, tokenData);
                    } else {
                        callback(500, {"Error": "Error updating the token"});
                    }
                });
            }else{
                callback(400, {"Error": "The token has expired"})
            }
          } else {
              callback(400, {"Error": "Specified token doesnt exists"});
          }
        });
    } else {
        callback(400, {'Error': 'Missing or invalid parameters'});
    }
};


//Tokens - delete
// req: id
// Op: none
handlers._tokens.delete = (data, callback) => {
    // Check thath the id is valid
    let id = data.queryStringObject.id;
    id = typeof(id) === 'string' && id.trim().length == 20 ? id.trim() : false;

    if(id){
        //Lookup the user
        _data.read('tokens', id, (err, data)=>{
            if(!err && data){
                _data.delete('tokens', id, err =>{
                    !err ? callback(200) : callback(500, {"Error": "Could not delete the token"});
                })
            } else {
                callback(400, {'Error': 'Could not find the token'});
            }
        });
    }else{
        callback(400, {'Error': 'Missing required field'});
    }
};

// Verify if  GIVEN ID IS CURRENTLY VALID FOR A GIVEN USER
handlers._tokens.verifyToken = (id, phone, callback)=>{
  _data.read('tokens', id, (err, tokenData) => {
    !err && tokenData ?
        callback(tokenData.phone == phone && tokenData.expires >= Date.now())
    :
        callback(false);
  });
};

handlers.ping = (data,callback) => {callback(200)};
handlers.notFound = (data,callback) => {callback(404)};

// Export the handlers

module.exports = handlers;

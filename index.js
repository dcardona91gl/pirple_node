/*
 * Primary file for API
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

 // Instanciating the http server
const httpServer = http.createServer(function(req,res){
  unifiedServer(req, res);
});
// Start the server
httpServer.listen(config.httpPort,function(){
  console.log(`the server is up and running on port ${config.httpPort}`);
});

//HTTPS server option
const httpsServerOptios = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};


//Instantiate the https server
const httpsServer = https.createServer(httpsServerOptios,function(req,res){
  unifiedServer(req, res);
});

// Start the https server
httpsServer.listen(config.httpsPort,function(){
  console.log(`The server is up and running on port ${config.httpsPort}`);
});

// All the server logic for both http and https

const unifiedServer = (req, res) => {
  // Parse the url
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

  // Get the payload,if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function(data) {
      buffer += decoder.write(data);
  });
  req.on('end', function() {
      buffer += decoder.end();

      // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
      const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

      // Construct the data object to send to the handler
      const data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : parsedUrl.query,
        'method' : req.method.toLowerCase(),
        'headers' : req.headers,
        'payload' : buffer
      };

      // Route the request to the handler specified in the router
      chosenHandler(data,function(statusCode,payload){

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof(payload) == 'object'? payload : {};

        // Convert the payload to a string
        const payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log("Returning this response: ",statusCode,payloadString);

      });

  });
}
// Define all the handlers
const handlers = {
  'ping': (data,callback) => {callback(200)},
  'notFound': (data,callback) => {callback(404)}
};

// Define the request router
const router = {
  'ping': handlers.ping
};

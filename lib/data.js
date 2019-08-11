/*
* Starting and editing data
*
*/

// dependencies

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for this module

let lib = {};

// Define the base directory of the data folder

lib.baseDir = path.join(__dirname,'/../.data/');
// Write data to a file
lib.create = (dir, file, data, callback) => {
  //open the file for writting
  fs.open(`${lib.baseDir}${dir}/${file}.json`,'wx', (err, fileDescriptor)=>{
    if(!err && fileDescriptor){
        // Convert data tos tring
        const stringData = JSON.stringify(data);

        //Write to file and close it
        fs.writeFile(fileDescriptor, stringData, (err)=> {
            if(!err){
                fs.close(fileDescriptor, (err)=>{
                    if(!err){
                        callback(false);
                    }else{
                        callback('Error closing new file');
                    }
                })
            }else{
                callback('Error writting to new file');
            }
        })
    } else {
        callback('Could not create new file, it may already exists');
    }
  })
}


// Read data from a file

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err, data)=>{
        if(!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    })
};


// Update data inside a file

lib.update = (dir, file, data, callback) => {
    //Open the file for writting
    fs.open(`${lib.baseDir}${dir}/${file}.json`,'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor){
            const stringData = JSON.stringify(data);

            //Truncate the file

            fs.truncate(fileDescriptor, (err)=>{
                if(!err){
                    // Write to the file and close it
                    fs.writeFile(fileDescriptor,stringData, (err)=>{
                        if(!err){
                            fs.close(fileDescriptor, (err)=> {
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('There was an aerro closing the file');
                                }
                            });
                        }else{
                            callback('Error writing to existing file');
                        }
                    })
                }else{
                    callback('Error truncating file');
                }
            })
        } else {
            callback('Could not open the file for updating, it may not exists yet');
        }
    })
};

// Delete a file

lib.delete = (dir, file, callback) => {
    // Unlink the file from the filesystem
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err)=>{
        if(!err){
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

// Export the odule
module.exports = lib;
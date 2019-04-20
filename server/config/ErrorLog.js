const FS = require("fs");
const _ = require("lodash");

const errorLog = (receivedError) => {
  FS.readFile("server/public/errorlogs.json", (fileError, fetchedErrors) => {
    var date = new Date();
    var errorDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    var newError = {
      errorDate,
      error: receivedError
    };
      
    if (fileError) {
      var errorLogs = [];
      errorLogs.push(newError);
       
      return FS.writeFile("server/public/errorlogs.json", JSON.stringify(errorLogs), (error) => {
        if (error) return console.log("An error occured while writing new error to file");
      });
    }
          
    if (fetchedErrors) {
      var errorLogs = JSON.parse(fetchedErrors);

      if(errorLogs.length > 0){
        errorLogs.push(newError); 
        return FS.writeFile("server/public/errorlogs.json", JSON.stringify(errorLogs), (error) => {
          if (error) return console.log("An error occured while writing new error to file");
        });  
      } 
    }  
  });
};

module.exports = errorLog;
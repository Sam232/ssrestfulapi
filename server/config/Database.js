const Mongoose = require("mongoose");
const ErrorLog = require("./ErrorLog");

const database = () => {
  if (process.env.NODE_ENV === "production") {
    return Mongoose.connect("mongodb://support:hellohello1@ds145146.mlab.com:45146/heroku_qmq4xlzl", {
      useNewUrlParser: true
    }, (error) => {
      if (error) {
        return ErrorLog(error);
      }
      //remove after development
      console.log("Connected to MongoDB Database Server");
    });
  }
  
  Mongoose.connect("mongodb://localhost:27017/supportsystem", {
    useNewUrlParser: true
  }, (error) => {
    if (error) {
      return ErrorLog(error);
    }
    //remove after development
    console.log("Connected to MongoDB Database Server ");
  });
};

module.exports = database;

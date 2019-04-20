const jwt = require("jsonwebtoken");
const AdminPD = require("../database/models/AdminPD");
const UserPD = require("../database/models/UserPD");
const UserLogin = require("../database/models/UserLogin");
const TokenBlackList = require("../database/models/TokenBlackList");
const ErrorLog = require("./ErrorLog");

const verifyToken = {
  protectAdminRoute: (req, res, next) => {
    var bearer = req.headers["authorization"];
    var token = bearer.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        errorMsg: "Token Is Required"
      });
    }

    jwt.verify(token, "adminToken", (error, authData) => {
      if (error) {
        if (error.name == "TokenExpiredError") {
          return res.status(404).json({
            errorMsg: "Login Session Expired, Login Again"
          });
        }
        if (error.name == "JsonWebTokenError") {
          return res.status(404).json({
            errorMsg: "Invalid Signature"
          });
        }
        if (error.message == "invalid token") {
          return res.status(400).json({
            errorMsg: "Valid Token Required"
          });
        }
        if (error.message == "jwt malformed") {
          return res.status(400).json({
            errorMsg: "Valid Token Required"
          });
        }
      }

      var _id = authData.personalDetails._id;

      AdminPD.findOne({
        _id,
        userType: "Admin"
      })
        .then((personalDetails) => {
          if (personalDetails) {
            return TokenBlackList.findOne({
              token
            })
              .then(fetchedToken => {
                if (fetchedToken) {
                  return res.status(401).json({
                    errorMsg: "You are not authorised to access this endpoint"
                  });
                }
                req.body.token = token;
                next();
              })
              .catch((error) => {
                if (error) {
                  ErrorLog(error);
                  return res.status(500).json({
                    error,
                    errorMsg: "An error occured while verifying your credentials"
                  });
                }
              });
          }
          res.status(401).json({
            errorMsg: "You are not authorised to access this endpoint"
          });
        })
        .catch((error) => {
          if (error) {
            ErrorLog(error);
            return res.status(500).json({
              error,
              errorMsg: "An error occured while verifying your credentials"
            });
          }
        });
    });
  },
  protectUserRoute: (req, res, next) => {
    var bearer = req.headers["authorization"];
    var token = bearer.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        errorMsg: "Token Is Required"
      });
    }

    jwt.verify(token, "userToken", (error, authData) => {
      if (error) {
        if (error.name == "TokenExpiredError") {
          return res.status(404).json({
            errorMsg: "Login Session Expired, Login Again"
          });
        }
        if (error.name == "JsonWebTokenError") {
          return res.status(404).json({
            errorMsg: "Invalid Signature"
          });
        }
        if (error.message == "invalid token") {
          return res.status(400).json({
            errorMsg: "Valid Token Required"
          });
        }
        if (error.message == "jwt malformed") {
          return res.status(400).json({
            errorMsg: "Valid Token Required"
          });
        }
      }
      
      var _id = authData.personalDetails._id;
    
      UserPD.findOne({
        _id,
        usertype: "User"
      })
        .then((personalDetails) => {
          if (personalDetails) {
            return TokenBlackList.findOne({
              token
            })
              .then(fetchedToken => {
                if (fetchedToken) {
                  return res.status(401).json({
                    errorMsg: "You are not authorised to access this endpoint"
                  });
                }
                req.body.token = token;
                next();
              })
              .catch((error) => {
                if (error) {
                  ErrorLog(error);
                  return res.status(500).json({
                    error,
                    errorMsg: "An error occured while verifying your credentials"
                  });
                }
              });
          }
          res.status(401).json({
            errorMsg: "You are not authorised to access this endpoint"
          });
        })
        .catch((error) => {
          if (error) {
            ErrorLog(error);
            return res.status(500).json({
              error,
              errorMsg: "An error occured while verifying your credentials"
            });
          }
        });
    });
  },
  protectPasswordReset: (req, res, next) => {
    var token = req.headers["authorization"].split(" ")[1];

    if (!token) {
      return res.status(400).json({
        errorMsg: "Token Is Required"
      });
    }

    jwt.verify(token, "resetPasswordToken", (error, authData) => {
      if (error) {
        if (error.name == "TokenExpiredError") {
          return res.status(404).json({
            errorMsg: "Login Session Expired, Login Again"
          });
        }
        if (error.name == "JsonWebTokenError") {
          return res.status(404).json({
            errorMsg: "Invalid Signature"
          });
        }
        if (error.message == "invalid token") {
          return res.status(400).json({
            errorMsg: "Valid Token Required"
          });
        }
        if (error.message == "jwt malformed") {
          return res.status(400).json({
            errorMsg: "Valid Token Required"
          });
        }
      }

      var emailAddress = authData.emailAddress;

      UserLogin.findOne({
        emailAddress
      })
        .then(fetchedLoginDetails => {
          if (fetchedLoginDetails) {
            req.body.emailAddress = emailAddress;
            return next();
          }
          res.status(401).json({
            errorMsg: "You are not allowed to update to the password"
          });
        })
        .catch((error) => {
          if (error) {
            ErrorLog(error);
            return res.status(500).json({
              error,
              errorMsg: "An error occured while verifying your credentials"
            });
          }
        });
    });
  }
};

module.exports = verifyToken;
const router = require("express").Router();
const { ObjectID } = require("mongodb");
const emailValidator = require("email-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protectAdminRoute } = require("../config/VerifyToken");
const AdminPD = require("../database/models/AdminPD");
const AdminLogin = require("../database/models/AdminLogin");
const TokenBlackList = require("../database/models/TokenBlackList");
const SupportMsg = require("../database/models/SupportMsg");
const Response = require("../database/models/Response");
const FAQ = require("../database/models/FAQ");
const UserPD = require("../database/models/UserPD");
const sendEmail = require("../config/Email");

//Update Personal Details
router.put("/update/personal-details/:id", protectAdminRoute, (req, res) => {
  var adminPd = {
    _id: req.params.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailAddress: req.body.emailAddress,
    loggedInEmail: req.body.loggedInEmail
  };

  if (!ObjectID.isValid(adminPd._id)) {
    return res.status(400).json({
      errorMsg: "Valid AdminID is required"
    });
  }

  if (!adminPd.firstName) {
    return res.status(400).json({
      errorMsg: "First name is required"
    });
  }

  if (!adminPd.lastName) {
    return res.status(400).json({
      errorMsg: "Last name is required"
    });
  }

  if (!emailValidator.validate(adminPd.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  AdminPD.findById(adminPd._id)
    .then((personalDetails) => {
      if (personalDetails) {
        return AdminPD.findByIdAndUpdate(adminPd._id, {
          $set: {
            firstName: adminPd.firstName,
            lastName: adminPd.lastName,
            emailAddress: adminPd.emailAddress
          }
        }, {
            new: true
          })
          .then((updatedPersonalDetails) => {
            if (updatedPersonalDetails) {
              return AdminLogin.findOneAndUpdate({
                emailAddress: adminPd.loggedInEmail
              }, {
                  $set: {
                    emailAddress: updatedPersonalDetails.emailAddress
                  }
                }, {
                  new: true
                })
                .then(updatedLoginDetails => {
                  if (updatedLoginDetails) {
                    return res.status(200).json({
                      updatedPersonalDetails,
                      updateState: "Successful"
                    });
                  }
                  res.status(500).json({
                    errorMsg: "Unable to complete update, try again"
                  });
                })
                .catch((error) => {
                  if (error) {
                    return res.status(500).json({
                      errorMsg: "Unable to complete update, try again"
                    });
                  }
                })
            }
            res.status(500).json({
              errorMsg: "Unable to update personal details, try again"
            });
          })
          .catch((error) => {
            if (error) {
              return res.status(500).json({
                errorMsg: "Unable to update personal details, try again"
              });
            }
          });
      }
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});

//Update Login Details
router.put("/update/login-details/:id", protectAdminRoute, (req, res) => {
  const _id = req.params.id;
  const adminLoginDetails = {
    emailAddress: req.body.emailAddress,
    newPassword: req.body.newPassword,
    oldPassword: req.body.oldPassword
  };

  if (!ObjectID.isValid(_id)) {
    return res.status(400).json({
      errorMsg: "Valid AdminID is required"
    });
  }

  if (!emailValidator.validate(adminLoginDetails.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  if (!adminLoginDetails.newPassword) {
    return res.status(400).json({
      errorMsg: "New password is required"
    });
  }

  if (adminLoginDetails.newPassword.length <= 7) {
    return res.status(400).json({
      errorMsg: "The length of new password must be greater than 7"
    });
  }

  if (!/[^a-zA-Z0-9]/.test(adminLoginDetails.newPassword)) {
    return res.status(400).json({
      errorMsg:
        "The New Password Must Contain Alphabets And A Symbol. Numbers Can Be Included But It Is Optional"
    });
  }

  if (!adminLoginDetails.oldPassword) {
    return res.status(400).json({
      errorMsg: "Old password is required"
    });
  }

  if (adminLoginDetails.newPassword == adminLoginDetails.oldPassword) {
    return res.status(400).json({
      errorMsg: "Old password and new password must not match"
    });
  }

  AdminPD.findById(_id)
    .then((personalDetails) => {
      if (personalDetails) {
        return AdminLogin.findOne({
          emailAddress: adminLoginDetails.emailAddress
        })
          .then(loginDetails => {
            if (loginDetails) {
              return bcrypt.compare(adminLoginDetails.oldPassword, loginDetails.Password)
                .then(response => {
                  if (response) {
                    return bcrypt.hash(adminLoginDetails.newPassword, 10)
                      .then(hashedPassword => {
                        if (hashedPassword) {
                          return AdminLogin.findOneAndUpdate({
                            emailAddress: adminLoginDetails.emailAddress
                          }, {
                              $set: {
                                password: hashedPassword
                              }
                            }, {
                              new: true
                            })
                            .then(updatedLoginDetails => {
                              if (updatedLoginDetails) {
                                return res.status(200).json({
                                  updatedLoginDetails,
                                  updateState: "Successful"
                                });
                              }
                              res.status(500).json({
                                errorMsg: "Unable to update login details, try again"
                              });
                            })
                            .catch((error) => {
                              if (error) {
                                return res.status(500).json({
                                  errorMsg: "Unable to update the login details, try again"
                                });
                              }
                            });
                        }
                        res.status(500).json({
                          errorMsg: "An error occured while updating login details, try again"
                        });
                      })
                      .catch((error) => {
                        if (error) {
                          return res.status(500).json({
                            errorMsg: "An error occured, try again"
                          });
                        }
                      });
                  }
                  res.status(401).json({
                    errorMsg: "Old password is incorrect"
                  });
                })
                .catch((error) => {
                  if (error) {
                    return res.status(500).json({
                      errorMsg: "An error occured, try again"
                    });
                  }
                });
            }
            res.status(401).json({
              errorMsg: "Provided email address does not exist"
            });
          })
          .catch((error) => {
            if (error) {
              return res.status(500).json({
                errorMsg: "An error occured, try again"
              });
            }
          });
      }
      res.status(401).json({
        errorMsg: "Provided personal details ID does not exist"
      });
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});

//Login
router.post("/login", (req, res) => {
  const loginDetails = {
    emailAddress: req.body.email,
    password: req.body.password
  };

  if (!emailValidator.validate(loginDetails.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  if (!loginDetails.password) {
    return res.status(400).json({
      errorMsg: "Password is required"
    });
  }
  
  AdminLogin.findOne({
    emailAddress: loginDetails.emailAddress
  }).populate("adminPdId")
    .then(fetchedLoginDetails => {
      if (fetchedLoginDetails) {
        return bcrypt.compare(loginDetails.password, fetchedLoginDetails.password)
          .then(response => {
            if (response) {
              const personalDetails = fetchedLoginDetails.adminPdId;
              return jwt.sign({
                personalDetails
              }, "adminToken", {
                  expiresIn: "24h"
                }, (error, token) => {
                  if (error) {
                    return res.status(500).json({
                      errorMsg: "An error occured, try again"
                    });
                  }
                  res.status(200).json({
                    personalDetails,
                    token
                  });
                });
            }
            res.status(401).json({
              errorMsg: "Incorrect email/password provided"
            });
          })
          .catch((error) => {
            if (error) {
              return res.status(500).json({
                errorMsg: "An error occured, try again"
              });
            }
          });
      }
      res.status(401).json({
        errorMsg: "Incorrect email/password provided"
      });
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});

//Logout
router.post("/logout", protectAdminRoute, (req, res) => {
  var token = req.body.token;

  new TokenBlackList({
    token
  })
    .save()
    .then(response => {
      if (response) {
        return res.status(200).json({
          msg: "Logout Successful"
        });
      }

      res.status(500).json({
        errorMsg: "An error occured, try again"
      });
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});

//View Received User Support
router.get("/view/received/user-support", protectAdminRoute, (req, res) => {
  SupportMsg.find({})
    .then(fetchedUserSupport => {
      if (fetchedUserSupport) {
        if (fetchedUserSupport.length > 0) {
          return res.status(200).json({
            fetchedUserSupport,
            fetchState: "Successful"
          });
        }
        res.status(200).json({
          fetchedUserSupport,
          msg: "No User Support Messages Received",
          fetchState: "Unsuccessful"
        });
      }
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});

//Submit Response
router.post("/submit/response/:id", protectAdminRoute, (req, res) => {
  const userSupportMsg = {
    adminPdId: req.params.id,
    supportMsgId: req.body.supportMsgId,
    response: req.body.response,
    private: req.body.private
  };

  if (!ObjectID.isValid(userSupportMsg.adminPdId)) {
    return res.status(400).json({
      errorMsg: "Valid AdminID is required"
    });
  }

  new Response(userSupportMsg)
    .save()
    .then(newSupportMsg => {
      if (newSupportMsg) {
        return SupportMsg.findById(newSupportMsg.supportMsgId)
          .populate("userPdId")
          .then(fetchedSupport => {
            if (fetchedSupport.userPdId.emailAddress) {
              return SupportMsg.findByIdAndUpdate(newSupportMsg.supportMsgId, {
                $set: {
                  status: "answered"
                }
              }, {
                new: true
              })
                .then(response => {
                  if(response){
                    var userEmail = fetchedSupport.userPdId.emailAddress;
                    var subject = "Response to support message";
                    var html = `
                      <div>
                        <div style="background-image: https://images.unsplash.com/photo-1526948531399-320e7e40f0ca?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1500&q=80;width:100%;height:450px;position:relative;">
                          <h2 style="text-align:center;position:absolute;margin:100px">User Support Response</h2>
                        <div>
                        <h4 style="text-align:center">We've responsed to your user support message. Please login to your dashboard to view our response.</h4>
                        <p style="text-align:center">Thank you for using support system.</p>
                      </div>
                    `;

                    return sendEmail(userEmail, subject, html)
                      .then(response => {
                        if (response) {
                          if(!fetchedSupport.private){
                            return UserPD.find({})
                            .then(usersPd => {
                              if(usersPd.length > 0){
                                return usersPd.map(userPD => {
                                  if(userPD.emailAddress !== userEmail){
                                    var subject = "Daily user support";
                                    var html = `
                                      <div>
                                        <div style="background-image: https://images.unsplash.com/photo-1526948531399-320e7e40f0ca?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1500&q=80;width:100%;height:450px;position:relative;">
                                          <h2 style="text-align:center;position:absolute;margin:100px">User Support</h2>
                                        <div>
                                        <h4 style="text-align:center">We've responsed to a user support message. Please go to the home page to view the our response. This might be a great help to you.</h4>
                                        <p style="text-align:center">Thank you for using support system.</p>
                                      </div>
                                    `;

                                    return sendEmail(userPD.emailAddress, subject, html)
                                    .then(response => {
                                      if (response) {
                                        return res.status(200).json({
                                          msg: "Response submitted. This user and other users have been notified through email",
                                          responseState: "Successful"
                                        });  
                                      }
                                    })
                                    .catch((error) => {
                                      if (error) {
                                        return res.status(500).json({
                                          errorMsg: "Response submitted but there was an error notifying the user through email"
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            })
                            .catch((error) => {
                              if (error) {
                                return res.status(500).json({
                                  errorMsg: "An error occured while notifying other users about the response to the new user support"
                                });
                              }
                            }); 
                          }         
                          res.status(200).json({
                            msg: "Response submitted and the user was notified through email",
                            responseState: "Successful"
                          });                                  
                        }
                      })
                      .catch((error) => {
                        if (error) {
                          return res.status(500).json({
                            errorMsg: "Response submitted but there was an error notifying the user through email"
                          });
                        }
                      });
                  }
                  Response.findByIdAndDelete(newSupportMsg._id)
                    .then(removedResponse => {
                      if(removedResponse){
                        return res.status(500).json({
                          errorMsg: "An error occured, try again"
                        });
                      }
                      res.status(500).json({
                        errorMsg: "An error occured, try again"
                      });
                    })
                    .catch((error) => {
                      if (error) {
                        return res.status(500).json({
                          errorMsg: "An error occured, try again"
                        });
                      }
                    });
                })
                .catch((error) => {
                  if (error) {
                    return res.status(500).json({
                      errorMsg: "An error occured, try again"
                    });
                  }
                });             
            }
            res.status(500).json({
              errorMsg: "An error occured, try again"
            });
          })
          .catch((error) => {
            if (error) {
              return Response.findByIdAndDelete(newSupportMsg._id)
              .then(removedResponse => {
                if(removedResponse){
                  return res.status(500).json({
                    errorMsg: "An error occured, try again"
                  });
                }
                res.status(500).json({
                  errorMsg: "An error occured, try again"
                });
              })
              .catch((error) => {
                if (error) {
                  return res.status(500).json({
                    errorMsg: "An error occured, try again"
                  });
                }
              });
            }
          });
      }
      res.status(500).json({
        errorMsg: "An error occured, try again"
      });
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "Unable to add new response, try again"
        });
      }
    });
});

//Add FAQs
router.post("/add/faqs", protectAdminRoute, (req, res) => {
  const newFaqs = {
    adminPdId: req.body.adminId,
    question: req.body.question,
    answer: req.body.answer
  };

  FAQ.findOne({
    question: newFaqs.question,
    answer: newFaqs.answer
  })
    .then(fetchedFaqs => {
      if (fetchedFaqs) {
        return res.status(200).json({
          msg: "FAQs already exist",
          faqAddState: "Unsuccessful"
        });
      }

      new FAQ(newFaqs)
        .save()
        .then(addedFaqs => {
          if (addedFaqs) {
            return res.status(200).json({
              msg: "New FAQs added",
              faqAddState: "Successful"
            });
          }
          res.status(500).json({
            msg: "An error occured while adding new FAQ, try again",
            faqAddState: "Unsuccessful"
          });
        })
        .catch((error) => {
          if (error) {
            return res.status(500).json({
              errorMsg: "An error occured while adding new FAQ, try again"
            });
          }
        });
    })
    .catch((error) => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});


module.exports = router;
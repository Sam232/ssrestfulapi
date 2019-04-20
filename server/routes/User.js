const router = require("express").Router();
const { ObjectID } = require("mongodb");
const emailValidator = require("email-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protectUserRoute, protectPasswordReset } = require("../config/VerifyToken");
const UserPD = require("../database/models/UserPD");
const UserLogin = require("../database/models/UserLogin");
const TokenBlackList = require("../database/models/TokenBlackList");
const SupportMsg = require("../database/models/SupportMsg");
const Response = require("../database/models/Response");
const FAQ = require("../database/models/FAQ");
const sendEmail = require("../config/Email");
const ErrorLog = require("../config/ErrorLog");

//Register
router.post("/register/", (req, res) => {
  var userDetails = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailAddress: req.body.emailAddress,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  };

  if (!userDetails.firstName) {
    return res.status(400).json({
      errorMsg: "First name is required"
    });
  }

  if (!userDetails.lastName) {
    return res.status(400).json({
      errorMsg: "Last name is required"
    });
  }

  if (!emailValidator.validate(userDetails.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  if (userDetails.password.length <= 7) {
    return res.status(400).json({
      errorMsg: "Password length should be greater than 7"
    });
  }

  if (!/[^a-zA-Z0-9]/.test(userDetails.password)) {
    return res.status(400).json({
      errorMsg:
        "The Password Must Contain Alphabets And A Symbol. Numbers Can Be Included But It Is Optional"
    });
  }

  if (userDetails.confirmPassword.length <= 7) {
    return res.status(400).json({
      errorMsg: "Confirm Password length should be greater than 7"
    });
  }

  if (userDetails.password !== userDetails.confirmPassword) {
    return res.status(400).json({
      errorMsg: "Password and confirm password must match"
    })
  }

  UserPD.findOne({
    emailAddress: userDetails.emailAddress
  })
    .then(personalDetails => {
      if (personalDetails) {
        return res.status(409).json({
          errorMsg: "Email address already exist"
        });
      }

      new UserPD({
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        emailAddress: userDetails.emailAddress
      })
        .save()
        .then(newPersonalDetails => {
          if (newPersonalDetails) {
            return bcrypt.hash(userDetails.password, 10)
              .then(hashedPassword => {
                if (hashedPassword) {
                  return new UserLogin({
                    userPdId: newPersonalDetails._id,
                    emailAddress: newPersonalDetails.emailAddress,
                    password: hashedPassword
                  })
                    .save()
                    .then(newLoginDetails => {
                      if (newLoginDetails) {
                        var userEmail = newLoginDetails.emailAddress;
                        var subject = "Activate support system account";
                        var html = `
                          <div>
                            <div style="background-image:url(https://lh3.googleusercontent.com/LMjhxNHcTmUjejBKdxVBpZzOY82InmoFyXh221nJoAnutIa6cOmYKlPfZm9NMwFHP0DW=w412-h220-rw);background-size:cover;width:100%;height:250px;position:relative;text-align:center;">
                              <h2 style="position:absolute;color:#FFFFFF;padding-top:100px">Activate Account</h2>
                            <div>
                            <h4 style="text-align:center">Thank you for registering an account with Support System. Please click on the below link to activate your account.</h4>
                            <h4 style="text-align:center"><a href="http://localhost:3000/activate-account/${newLoginDetails._id}">Activate Account</a></h4>
                          </div>
                        `;

                        return sendEmail(userEmail, subject, html)
                          .then(response => {
                            if (response) {
                              return res.status(200).json({
                                msg: "Your new account has been created and an email has also been sent to your inbox, please check to activate your account",
                                addState: "Successful"
                              });
                            }
                          })
                          .catch(error => {
                            if (error) {
                              return UserPD.findOneAndRemove({
                                emailAddress: newPersonalDetails.emailAddress
                              })
                                .then(removedPersonalDetails => {
                                  if (removedPersonalDetails) {
                                    return res.status(500).json({
                                      addState: "Unsuccessful",
                                      errorMsg: "An error occured while completing your registration, register again"
                                    });
                                  }
                                  res.status(500).json({
                                    addState: "Unsuccessful",
                                    errorMsg: "An error occured, please contact the support team"
                                  });
                                })
                                .catch(error => {
                                  if (error) {
                                    return res.status(500).json({
                                      addState: "Unsuccessful",
                                      errorMsg: "An error occured, please contact the support team"
                                    });
                                  }
                                });
                            }
                          });
                      }

                      UserPD.findOneAndRemove({
                        emailAddress: newPersonalDetails.emailAddress
                      })
                        .then(removedPersonalDetails => {
                          if (removedPersonalDetails) {
                            return res.status(500).json({
                              addState: "Unsuccessful",
                              errorMsg: "An error occured while completing your registration, register again"
                            });
                          }
                          res.status(500).json({
                            addState: "Unsuccessful",
                            errorMsg: "An error occured, please contact the support team"
                          });
                        })
                        .catch(error => {
                          if (error) {
                            return res.status(500).json({
                              addState: "Unsuccessful",
                              errorMsg: "An error occured, please contact the support team"
                            });
                          }
                        });
                    })
                    .catch(error => {
                      if (error) {
                        return UserPD.findOneAndRemove({
                          emailAddress: newPersonalDetails.emailAddress
                        })
                          .then(removedPersonalDetails => {
                            if (removedPersonalDetails) {
                              return res.status(500).json({
                                addState: "Unsuccessful",
                                errorMsg: "An error occured while completing your registration, register again"
                              });
                            }
                            res.status(500).json({
                              addState: "Unsuccessful",
                              errorMsg: "An error occured, please contact the support team"
                            });
                          })
                          .catch(error => {
                            if (error) {
                              return res.status(500).json({
                                addState: "Unsuccessful",
                                errorMsg: "An error occured, please contact the support team"
                              });
                            }
                          });
                      }
                    });
                }
                UserPD.findOneAndRemove({
                  emailAddress: newPersonalDetails.emailAddress
                })
                  .then(removedPersonalDetails => {
                    if (removedPersonalDetails) {
                      return res.status(500).json({
                        addState: "Unsuccessful",
                        errorMsg: "An error occured while completing your registration, try again"
                      });
                    }
                    res.status(500).json({
                      addState: "Unsuccessful",
                      errorMsg: "An error occured, please contact the support team"
                    });
                  })
                  .catch((error) => {
                    if (error) {
                      return res.status(500).json({
                        addState: "Unsuccessful",
                        errorMsg: "An error occured, please contact the support team"
                      });
                    }
                  });
              })
              .catch(error => {
                if (error) {
                  return UserPD.findOneAndRemove({
                    emailAddress: newPersonalDetails.emailAddress
                  })
                    .then(removedPersonalDetails => {
                      if (removedPersonalDetails) {
                        return res.status(500).json({
                          addState: "Unsuccessful",
                          errorMsg: "An error occured while completing your registration, try again"
                        });
                      }
                      res.status(500).json({
                        addState: "Unsuccessful",
                        errorMsg: "An error occured, please contact the support team"
                      });
                    })
                    .catch((error) => {
                      if (error) {
                        return res.status(500).json({
                          addState: "Unsuccessful",
                          errorMsg: "An error occured, please contact the support team"
                        });
                      }
                    });
                }
              })
          }
          res.status(500).json({
            errorMsg: "Unable to complete registration, try again"
          });
        })
        .catch(error => {
          if (error) {
            return res.status(500).json({
              errorMsg: "Unable to complete registration, try again"
            });
          }
        });

    })
    .catch(error => {
      if (error) {
        return res.status(500).json({
          errorMsg: "An error occured, try again"
        });
      }
    });
});

//Activate Account
router.put("/activate/new-account/:id", (req, res) => {
  const loginId = req.params.id;

  if (!ObjectID.isValid(loginId)) {
    return res.status(400).json({
      errorMsg: "Valid LoginID is required"
    });
  }
 
  UserLogin.findById(loginId)
    .then(loginDetails => {
      if (loginDetails) {
        return UserLogin.findByIdAndUpdate(loginId, {
          $set: {
            activated: true
          }
        }, {
            new: true
          })
          .then(updatedLoginDetails => {
            if (updatedLoginDetails) {
              return res.status(200).json({
                msg: "Account activated successfully",
                updateState: "Successful"
              });
            }
            res.status(500).json({
              msg: "Unable to activate account, try again",
              updateState: "Unsuccessful"
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
        errorMsg: "Provided LoginID does not exist"
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

  UserLogin.findOne({
    emailAddress: loginDetails.emailAddress
  }).populate("userPdId")
    .then(fetchedLoginDetails => {
      if (fetchedLoginDetails) {
        return bcrypt.compare(loginDetails.password, fetchedLoginDetails.password)
          .then(response => {
            if (response) {
              const personalDetails = fetchedLoginDetails.userPdId;
              return jwt.sign({
                personalDetails
              }, "userToken", {
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
router.post("/logout", protectUserRoute, (req, res) => {
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

//Update Personal Details
router.put("/update/personal-details/:id", protectUserRoute, (req, res) => {
  var userPd = {
    _id: req.params.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailAddress: req.body.emailAddress,
    loggedInEmail: req.body.loggedInEmail
  };

  if (!ObjectID.isValid(userPd._id)) {
    return res.status(400).json({
      errorMsg: "Valid UserID is required"
    });
  }

  if (!userPd.firstName) {
    return res.status(400).json({
      errorMsg: "First name is required"
    });
  }

  if (!userPd.lastName) {
    return res.status(400).json({
      errorMsg: "Last name is required"
    });
  }

  if (!emailValidator.validate(userPd.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  UserPD.findById(userPd._id)
    .then((personalDetails) => {
      if (personalDetails) {
        return UserPD.findByIdAndUpdate(userPd._id, {
          $set: {
            firstName: userPd.firstName,
            lastName: userPd.lastName,
            emailAddress: userPd.emailAddress
          }
        }, {
            new: true
          })
          .then((updatedPersonalDetails) => {
            if (updatedPersonalDetails) {
              return UserLogin.findOneAndUpdate({
                emailAddress: userPd.loggedInEmail
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
router.put("/update/login-details/:id", protectUserRoute, (req, res) => {
  const _id = req.params.id;
  const userLoginDetails = {
    emailAddress: req.body.emailAddress,
    newPassword: req.body.newPassword,
    oldPassword: req.body.oldPassword
  };

  if (!ObjectID.isValid(_id)) {
    return res.status(400).json({
      errorMsg: "Valid AdminID is required"
    });
  }

  if (!emailValidator.validate(userLoginDetails.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  if (!userLoginDetails.newPassword) {
    return res.status(400).json({
      errorMsg: "New password is required"
    });
  }

  if (userLoginDetails.newPassword.length <= 7) {
    return res.status(400).json({
      errorMsg: "The length of new password must be greater than 7"
    });
  }

  if (!/[^a-zA-Z0-9]/.test(userLoginDetails.newPassword)) {
    return res.status(400).json({
      errorMsg:
        "The New Password Must Contain Alphabets And A Symbol. Numbers Can Be Included But It Is Optional"
    });
  }

  if (!userLoginDetails.oldPassword) {
    return res.status(400).json({
      errorMsg: "Old password is required"
    });
  }

  if (userLoginDetails.newPassword == userLoginDetails.oldPassword) {
    return res.status(400).json({
      errorMsg: "Old password and new password must not match"
    });
  }

  UserPD.findById(_id)
    .then((personalDetails) => {
      if (personalDetails) {
        return UserLogin.findOne({
          emailAddress: userLoginDetails.emailAddress
        })
          .then(loginDetails => {
            if (loginDetails) {
              return bcrypt.compare(userLoginDetails.oldPassword, loginDetails.password)
                .then(response => {
                  if (response) {
                    return bcrypt.hash(userLoginDetails.newPassword, 10)
                      .then(hashedPassword => {
                        if (hashedPassword) {
                          return UserLogin.findOneAndUpdate({
                            emailAddress: userLoginDetails.emailAddress
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

//Send Reset Password Link
router.post("/send/reset/password-link", (req, res) => {
  var emailAddress = req.body.emailAddress;

  if (!emailValidator.validate(emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  UserLogin.findOne({
    emailAddress
  })
    .then(fetchedLoginDetails => {
      if (fetchedLoginDetails) {
        return jwt.sign({
          emailAddress
        }, "resetPasswordToken", {
            expiresIn: "300000"
          }, (error, token) => {
            if (error) {
              return res.status(500).json({
                errorMsg: "An error occured, try again"
              });
            }

            var subject = "Reset Password Request";
            var html = `
            <div>
              <div style="background-image: https://images.unsplash.com/photo-1522251670181-320150ad6dab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=766&q=80;width:100%;height:450px;position:relative;">
                <h2 style="text-align:center;position:absolute;margin:100px">Password Reset Request</h2>
              <div>
              <h4 style="text-align:center">You have requested to reset your account password on Support System. If you are the one who made the request, please click on the reset password link below or ignore it if you were not the one who made the request.Please note that, the link will expire after 5 minutes.</h4>
              <a href="http://localhost:3000/reset-password/${token}" style="text-align:center">Activate Account</a>
            </div>
          `;

            sendEmail(emailAddress, subject, html)
              .then(response => {
                if (response) {
                  return res.status(200).json({
                    msg: "A password reset link has been sent to your inbox",
                    responseState: "Successful"
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
});

//Reset Password
router.put("/reset-password", protectPasswordReset, (req, res) => {
  const loginDetails = {
    emailAddress: req.body.emailAddress,
    newPassword: req.body.newPassword,
    confirmNewPassword: req.body.confirmNewPassword
  };

  if (!emailValidator.validate(loginDetails.emailAddress)) {
    return res.status(400).json({
      errorMsg: "Valid email address is required"
    });
  }

  if (loginDetails.newPassword.length <= 7) {
    return res.status(400).json({
      errorMsg: "Length of new password length must be greater than 7"
    });
  }

  if (loginDetails.confirmNewPassword.length <= 7) {
    return res.status(400).json({
      errorMsg: "Length of confirm new password must be greater than 7"
    });
  }

  if (!/[^a-zA-Z0-9]/.test(loginDetails.newPassword)) {
    return res.status(400).json({
      errorMsg:
        "The New Password Must Contain Alphabets And A Symbol. Numbers Can Be Included But It Is Optional"
    });
  }

  if (loginDetails.newPassword !== userDetails.confirmPassword) {
    return res.status(400).json({
      errorMsg: "New password and confirm password must match"
    });
  }

  bcrypt.hash(loginDetails.newPassword, 10)
    .then(hashedPassword => {
      if (hashedPassword) {
        return UserLogin.findOneAndUpdate({
          emailAddress: loginDetails.emailAddress
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
                msg: "Password updated successfully, please login",
                updateState: "Successful"
              });
            }
            res.status(500).json({
              errorMsg: "Unable to update password, try again"
            });
          })
          .catch((error) => {
            if (error) {
              return res.status(500).json({
                errorMsg: "Unable to update password, try again"
              });
            }
          });
      }
      res.status(500).json({
        errorMsg: "An error occured while updating the password, try again"
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

//Submit user support message
router.post("/submit/user-support/", protectUserRoute, (req, res) => {
  const newUserSupport = {
    userPdId: req.body.userId,
    subject: req.body.subject,
    body: req.body.body,
    private: req.body.private
  };

  SupportMsg.findOne({
    subject: newUserSupport.subject
  })
    .then(fetchedSupportMsg => {
      if (fetchedSupportMsg) {
        if (fetchedSupportMsg.status == "answered" && fetchedSupportMsg.private !== true) {
          return res.status(200).json({
            msg: "This user support has already been answered, please check answered responses for your answer."
          });
        }
        else if (fetchedSupportMsg.status == "pending" && fetchedSupportMsg.private !== true) {
          return res.status(200).json({
            msg: "This user support has already been asked, we will notify you through email when it is answered."
          });
        }
      }

      new SupportMsg(newUserSupport)
        .save()
        .then(addedSupportMsg => {
          if (addedSupportMsg) {
            return res.status(200).json({
              msg: "User support submitted successfully",
              addState: "Successful"
            });
          }
          res.status(500).json({
            errorMsg: "An error occured while submitting user support message, try again",
            addState: "Unsuccessful"
          });
        })
        .catch((error) => {
          if (error) {
            return res.status(500).json({
              errorMsg: "An error occured while submitting user support message, try again"
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

//View Response To User Support Msg
router.get("/view/user-support-response/:id", protectUserRoute, (req, res) => {
  var userSupportId = req.params.id;

  if (!ObjectID.isValid(userSupportId)) {
    return res.status(400).json({
      errorMsg: "Valid UserID is required"
    });
  }

  Response.findOne({
    supportMsgId: userSupportId
  })
    .populate("adminPdId")
    .populate("supportMsgId")
    .then(fetchedResponse => {
      if (fetchedResponse) {
        return res.status(200).json({
          fetchedResponse,
          fetchState: "successful"
        });
      }
      res.status(404).json({
        errorMsg: `No response exists for the user support with the ID ${userSupportId}`
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

//Read Responses To My Submitted User Support Message
router.get("/read/user-support/responses/:id", protectUserRoute, (req, res) => {
  var userId = req.params.id;

  if (!ObjectID.isValid(userId)) {
    return res.status(400).json({
      errorMsg: "Valid UserID is required"
    });
  }

  UserPD.findById(userId)
    .then(userDetails => {
      if (userDetails) {
        return SupportMsg.find({
          userPdId: userId
        })
          .then(fetchedSupportMsgs => {
            if (fetchedSupportMsgs.length > 0) {
              return res.status(200).json({
                fetchedSupportMsgs,
                fetchState: "Successful"
              });
            }
            res.status(200).json({
              fetchedSupportMsgs: [],
              msg: "No user support submitted",
              fetchState: "Successful"
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
        errorMsg: "Provided UserID does not exist"
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

//Read FAQs
router.get("/read/faqs", (req, res) => {
  FAQ.find({})
    .then(fetchedFaqs => {
      if (fetchedFaqs.lenght > 0) {
        return res.status(200).json({
          fetchedFaqs,
          fetchState: "Successful"
        });
      }
      res.status(200).json({
        fetchedFaqs: [],
        msg: "No FAQs added yet",
        fetchState: "Unsuccessful"
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

//Read User Support Responses That Are Public
router.get("/read-public/user-support", (req, res) => {
  Response.find({})
    .populate("supportMsgId")
    .then(fetchedResponse => {
      if (fetchedResponse.lenght > 0) {
        var publicResponses = fetchedResponse.filter(response => response.supportMsgId.private == false);

        if (publicResponses.length > 0) {
          return res.status(200).json({
            publicResponses,
            fetchState: "Successful"
          });
        }
        else {
          return res.status(200).json({
            publicResponses: [],
            msg: "No public user support responses found",
            fetchState: "Unsuccessful"
          });
        }
      }
      res.status(200).json({
        publicResponses: [],
        msg: "No user support has been answered yet",
        fetchState: "Unsuccessful"
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
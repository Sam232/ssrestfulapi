const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var AdminLoginSchema = new Schema({
  adminPdId: {
    type: Schema.Types.ObjectId,
    ref: "AdminPD",
    required: true
  },
  emailAddress: {
    type: Schema.Types.String,
    required: true
  },
  password: {
    type: Schema.Types.String,
    required: true
  }
}); 

module.exports =  Mongoose.model("AdminLogin", AdminLoginSchema, "AdminLogins");
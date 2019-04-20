const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var AdminPDSchema = new Schema({
  firstName: {
    type: Schema.Types.String,
    required: true
  },
  lastName: {
    type: Schema.Types.String,
    required: true,
  },
  emailAddress: {
    type: Schema.Types.String,
    required: true
  },
  userType: {
    type: Schema.Types.String,
    default: "Admin"
  }
});

module.exports = Mongoose.model("AdminPD", AdminPDSchema, "AdminPDs");
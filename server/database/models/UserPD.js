const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var UserPDSchema = new Schema({
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
  usertype: {
    type: Schema.Types.String,
    default: "User"
  }
});

module.exports = Mongoose.model("UserPD", UserPDSchema);
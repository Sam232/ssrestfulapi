const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var UserLoginSchema = new Schema({
  userPdId: {
    type: Schema.Types.ObjectId,
    ref: "UserPD",
    required: true
  },
  emailAddress: {
    type: Schema.Types.String,
    required: true
  },
  password: {
    type: Schema.Types.String,
    required: true
  },
  activated: {
    type: Schema.Types.Boolean,
    required: true,
    default: false
  }
});

module.exports = Mongoose.model("UserLogin", UserLoginSchema);
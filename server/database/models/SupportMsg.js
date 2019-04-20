const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var SupportMsgSchema = new Schema({
  userPdId: {
    type: Schema.Types.ObjectId,
    ref: "UserPD",
    required: true
  },
  subject: {
    type: Schema.Types.String,
    required: true
  },
  body: {
    type: Schema.Types.String,
    required: true
  },
  status: {
    type: Schema.Types.String,
    default: "pending"
  },
  private: {
    type: Schema.Types.Boolean,
    default: false
  }
});

module.exports = Mongoose.model("SupportMsg", SupportMsgSchema);
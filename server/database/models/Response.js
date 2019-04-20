const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var ResponseSchema = new Schema({
  adminPdId: {
    type: Schema.Types.ObjectId,
    ref: "AdminPD",
    required: true
  },
  supportMsgId: {
    type: Schema.Types.ObjectId,
    ref: "SupportMsg",
    required: true
  },
  response: {
    type: Schema.Types.String,
    required: true
  }
});

module.exports = Mongoose.model("Response", ResponseSchema);
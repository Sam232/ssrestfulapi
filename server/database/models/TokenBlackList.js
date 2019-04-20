const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var TokenBlackListSchema = new Schema({
  token: {
    type: Schema.Types.String,
    required: true
  }
});

module.exports = Mongoose.model("TokenBlackList", TokenBlackListSchema);


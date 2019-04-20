const Mongoose = require("mongoose");

var Schema = Mongoose.Schema;

var FAQSchema = new Schema({
  adminPdId: {
    type: Schema.Types.ObjectId,
    ref: "AdminPD",
    required: true
  },
  question: {
    type: Schema.Types.String,
    required: true
  },
  answer: {
    type: Schema.Types.String,
    required: true,
  }
});

module.exports = Mongoose.model("FAQ", FAQSchema);
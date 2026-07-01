const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  month: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    default: "unpaid" // unpaid | paid
  },

  dueDate: {
    type: Date
  },

  paidAt: {
    type: Date
  }
});

module.exports = mongoose.model("Fee", feeSchema);
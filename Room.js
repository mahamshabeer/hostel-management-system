const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({

  roomNumber: {
    type: String,
    required: true
  },

  capacity: {
    type: Number,
    required: true
  },

  occupiedSeats: {
    type: Number,
    default: 0
  },

  genderAllowed: {
    type: String,
    enum: ["Male", "Female"],
    required: true
  },

  status: {
    type: String,
    default: "available"
  },

  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
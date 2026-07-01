const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

  // USER REFERENCE
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // COMPLAINT MESSAGE
  message: {
    type: String,
    required: true
  },

  // AI CATEGORY
  category: {
    type: String,
    default: "Other"
  },

  // AI PRIORITY
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },

  // STATUS CONTROLLED
  status: {
    type: String,
    enum: ["pending", "solved"],
    default: "pending"
  },

  date: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
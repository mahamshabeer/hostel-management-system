const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  message: String,

  type: {
    type: String,
    default: "system"
  },

  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ✅ THIS IS REQUIRED (MOST IMPORTANT)
module.exports = mongoose.model("Notification", notificationSchema);
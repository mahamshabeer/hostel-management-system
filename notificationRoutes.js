const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const checkRole = require("../middleware/auth");

// ADD NOTIFICATION
router.post("/add", async (req, res) => {
  try {

    const { userId, message, type } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message required"
      });
    }

    const notification = await Notification.create({
      userId: userId || null,
      message,
      type: type || "system"
    });

    res.json({
      message: "Notification sent",
      data: notification
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error sending notification"
    });
  }

});

router.get("/:userId", async (req, res) => {

  try {

    const data = await Notification.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({
      message: "Error fetching notifications"
    });
  }

});

router.put("/:id/read", async (req, res) => {

  try {

    await Notification.findByIdAndUpdate(req.params.id, {
      read: true
    });

    res.json({ message: "Marked as read" });

  } catch (err) {

    res.status(500).json({
      message: "Error updating notification"
    });
  }

});

// GET ALL
router.get("/all", checkRole("admin"), async (req, res) => {
  const data = await Notification.find().sort({ createdAt: -1 });
  res.json(data);
});

module.exports = router;
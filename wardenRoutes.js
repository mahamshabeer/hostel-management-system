const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");
const Request = require("../models/Request");
const Notification = require("../models/Notification");

// ================= APPROVE
router.post("/approve-request", async (req, res) => {

  try {

    const { requestId } = req.body;

    const request = await Request.findById(requestId);

if (!request) {
  return res.status(404).json({ message: "Not found" });
}

// NOW SAFE
const user = await User.findById(request.userId);

if (user.room) {
  return res.status(400).json({
    message: "Student already has a room assigned"
  });
}

    const room = await Room.findById(request.roomId);

    if (!room) return res.status(404).json({ message: "Room not found" });

   // if (room.students.length >= room.capacity) {
   //   return res.status(400).json({ message: "Room full" });
   // }

    const alreadyExists = room.students.some(
  s => s.toString() === request.userId.toString()
);

if (!alreadyExists) {
  room.students.push(request.userId);
}
    await room.save();

    await User.findByIdAndUpdate(request.userId, {
      room: request.roomId
    });

    request.status = "approved";
    await request.save();

    await Notification.create({
  message: `${request.studentName} request approved`
});

    res.json({ message: "Approved ✔" });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// ================= REJECT
router.post("/reject-request", async (req, res) => {

  try {

    const { requestId } = req.body;

    const request = await Request.findById(requestId);

request.status = "rejected";

await request.save();

    await Notification.create({
  message: `${request.studentName} request rejected`
});

    res.json({ message: "Rejected ❌" });

  } catch (err) {

    console.log(err);

    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
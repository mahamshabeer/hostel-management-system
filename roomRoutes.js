const express = require("express");
const router = express.Router();

const Room = require("../models/Room");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Request = require("../models/Request");

const checkRole = require("../middleware/auth");

// ======================
//ADD ROOM
router.post("/add", async (req, res) => {
  try {

    const { roomNumber, capacity, gender } = req.body;

    const existing = await Room.findOne({ roomNumber });

    if (existing) {
      return res.status(400).json({
        message: "Room already exists"
      });
    }

    const room = new Room({
  roomNumber,
  capacity,
  genderAllowed: gender
});

    await room.save();

    res.json({ message: "Room added successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error adding room" });
  }
});

// ======================
// GET ALL ROOMS
// ======================
router.get("/", async (req, res) => {
  try {

    const rooms = await Room.find()
      .populate("students");

    res.json(rooms);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Error fetching rooms"
    });
  }
});

// ======================
// ASSIGN ROOM
// ======================
router.post("/assign", async (req, res) => {

  try {

    const { userId, roomId } = req.body;

    if (!userId || !roomId) {
  return res.status(400).json({ message: "Missing data" });
}
    const oldRoom = await Room.findOne({ students: userId });

if (oldRoom) {
  oldRoom.students = oldRoom.students.filter(
    id => id.toString() !== userId
  );

  oldRoom.occupiedSeats = oldRoom.students.length;

  if (oldRoom.students.length < oldRoom.capacity) {
    oldRoom.status = "available";
  }

  await oldRoom.save();
}

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    // CHECK CAPACITY
    if (room.students.length >= room.capacity) {
      return res.status(400).json({
        message: "Room is full"
      });
    }

    // PREVENT DUPLICATE
    if (room.students.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({
        message: "User already assigned"
      });
    }

    // ASSIGN
    room.students.push(userId);

room.occupiedSeats = room.students.length;

if (room.students.length >= room.capacity) {

  room.status = "full";

} else {

  room.status = "available";

}

await room.save();

// 🔔 AUTO NOTIFICATION HERE
const Notification = require("../models/Notification");

await Notification.create({
  userId,
  message: `You have been assigned Room ${room.roomNumber}`,
  type: "room"
});


    // UPDATE STATUS
    if (room.students.length >= room.capacity) {
      room.status = "full";
    }


     // UPDATE USER
    await User.findByIdAndUpdate(userId, {
      room: roomId,
      requestRoom: false,
      requestedRoom: null
    });

    const Request = require("../models/Request");

await Request.updateMany(
  { userId, status: "pending" },
  { status: "approved" }
);

    res.json({
      message: "Room assigned successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Error assigning room"
    });
  }
});

// ======================
// DELETE ROOM
// ======================
router.delete("/:id", checkRole("admin"), async (req, res) => {
  try {

    await Room.findByIdAndDelete(req.params.id);

    res.json({
      message: "Room deleted successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Delete error"
    });
  }
});

router.post("/auto-assign/:userId", async (req, res) => {

  try {

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // FIND BEST ROOM
    const rooms = await Room.find({
  genderAllowed: user.gender,
  status: "available"
});

const room = rooms.find(r => r.occupiedSeats < r.capacity);

    if (!room) {
      return res.status(400).json({
        message: "No room available"
      });
    }

    // ASSIGN STUDENT
    room.students.push(user._id);

    room.occupiedSeats = room.students.length;

    if (room.students.length >= room.capacity) {
      room.status = "full";
    }

    await room.save();

    // UPDATE USER
    user.room = room._id;

    await user.save();

    const Request = require("../models/Request");

await Request.updateMany(
  { userId: user._id, status: "pending" },
  { status: "approved" }
);

    // NOTIFICATION
    await Notification.create({
      userId: user._id,
      message: `AI assigned you Room ${room.roomNumber}`,
      type: "room"
    });

    res.json({
      message: "Room auto-assigned successfully",
      room
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Auto assignment failed"
    });
  }
});

module.exports = router;
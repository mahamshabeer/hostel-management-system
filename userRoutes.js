const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");

// ====================== GET ALL USERS
router.get("/", async (req, res) => {
  try {
    const users = await User.find().populate("room");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ====================== GET USER
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("room");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ====================== ADD USER
router.post("/add", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User added" });
  } catch (err) {
    res.status(500).json({ message: "Add failed" });
  }
});

// ====================== DELETE USER
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// UPDATE USER
router.put("/:id", async (req, res) => {

  try {

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "User updated successfully ✔",
      user: updatedUser
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Error updating user"
    });
  }
});

module.exports = router;
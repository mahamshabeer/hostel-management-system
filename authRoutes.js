const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");


// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {

    const { name, email, password, role, phone, gender } = req.body;

   if (!email || !password || !name) {
  return res.status(400).json({ message: "All fields required" });
}

const existingUser = await User.findOne({
  email: email.trim()
});

if (existingUser) {
  return res.status(400).json({
    message: "User already exists"
  });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
  name: name.trim(),
  email: email.trim(),
  password: hashedPassword,
  role: role || "student",
  phone: phone || "",
  gender
});

    await user.save();

    res.json({
      message: "Signup successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error in signup" });
  }
});


// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
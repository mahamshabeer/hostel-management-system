const express = require("express");
const router = express.Router();
const Request = require("../models/Request");

// ======================
// GET ALL REQUESTS
// ======================
router.get("/", async (req, res) => {
  try {

    const data = await Request.find()
      .populate("roomId", "roomNumber capacity")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.set("Cache-Control", "no-store");

    res.json(data);

  } catch (err) {
    console.log("REQUEST FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching requests" });
  }
});


// ======================
// CREATE REQUEST
// ======================
router.post("/", async (req, res) => {
  try {

    const { studentName, userId, roomId } = req.body;

    if (!studentName || !userId || !roomId) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const newRequest = await Request.create({
      studentName,
      userId,
      roomId,
      status: "pending"
    });

    res.json(newRequest);

  } catch (err) {
    console.log("REQUEST CREATE ERROR:", err);
    res.status(500).json({ message: "Error creating request" });
  }
});


// ======================
// ❌ CANCEL REQUEST (STUDENT)
// ======================
router.delete("/:id", async (req, res) => {
  try {

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    // ❗ only pending requests can be cancelled
    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Only pending requests can be cancelled"
      });
    }

    await Request.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Request cancelled successfully"
    });

  } catch (err) {
    console.log("CANCEL REQUEST ERROR:", err);

    res.status(500).json({
      message: "Error cancelling request"
    });
  }
});

module.exports = router;
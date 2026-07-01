const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

const checkRole = require("../middleware/auth");

function detectCategory(text) {
  text = text.toLowerCase();

  // Utilities (very common hostel issues)
  if (
    text.includes("electric") ||
    text.includes("light") ||
    text.includes("fan") ||
    text.includes("ac") ||
    text.includes("power") ||
    text.includes("socket")
  ) {
    return "Utilities";
  }

  // Water issues
  if (
    text.includes("water") ||
    text.includes("tap") ||
    text.includes("drain") ||
    text.includes("washroom")
  ) {
    return "Water/Sanitation";
  }

  // Food / Mess
  if (
    text.includes("food") ||
    text.includes("mess") ||
    text.includes("meal") ||
    text.includes("kitchen")
  ) {
    return "Food";
  }

  // Cleanliness
  if (
    text.includes("clean") ||
    text.includes("dirty") ||
    text.includes("trash")
  ) {
    return "Cleanliness";
  }

  // Security
  if (
    text.includes("security") ||
    text.includes("theft") ||
    text.includes("lost")
  ) {
    return "Security";
  }

  return "Other";
}

function detectPriority(text) {
  text = text.toLowerCase();

  if (
  text.includes("urgent") ||
  text.includes("no water") ||
  text.includes("no electricity") ||
  text.includes("broken") ||
  text.includes("emergency") ||
  text.includes("fire") ||
  text.includes("danger")
)

  
   {
    return "High";
  }

  if (
    text.includes("issue") ||
    text.includes("problem") ||
    text.includes("not working")
  ) {
    return "Medium";
  }

  return "Low";
}


// ======================
// ADD COMPLAINT (STUDENT)
// ======================
router.post("/add", checkRole("student"), async (req, res) => {

  try {

    const userId =
      req.headers.userid || req.body.userId;

    const message =
      req.body.message;

    if (!userId || !message) {

      return res.status(400).json({
        message: "userId and message required"
      });

    }

    const category = detectCategory(message);
    const priority = detectPriority(message);
    const isUrgent = priority === "High";

const complaint = await Complaint.create({
  userId,
  message,
  status: "pending",
  category,
  priority
});

if (priority === "High") {
  await Notification.create({
    userId,
    message: `🚨 High priority complaint submitted: ${category}`,
    type: "complaint"
  });
}

    res.json({

      success: true,
      data: complaint

    });

  }

  catch (err) {

    console.log("ADD COMPLAINT ERROR:", err);

    res.status(500).json({
      message: "Error submitting complaint"
    });

  }

});

router.get("/stats/ai", async (req, res) => {

  try {

    const complaints = await Complaint.find();

    const high = complaints.filter(c => c.priority === "High").length;
    const medium = complaints.filter(c => c.priority === "Medium").length;
    const low = complaints.filter(c => c.priority === "Low").length;

    const categories = {};

    complaints.forEach(c => {
      categories[c.category] = (categories[c.category] || 0) + 1;
    });

    res.json({
      total: complaints.length,
      high,
      medium,
      low,
      categories
    });

  } catch (err) {
    res.status(500).json({ message: "Stats error" });
  }
});

// ======================
// GET MY COMPLAINTS
// ======================

router.get("/my/:userId", async (req, res) => {

  try {

    const complaints = await Complaint.find({

      userId: req.params.userId

    })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

    res.json(complaints);

  }

  catch (err) {

    console.log("MY COMPLAINT ERROR:", err);

    res.status(500).json({
      message: "Error fetching my complaints"
    });

  }

});



// ======================
// GET ALL COMPLAINTS
// ======================
router.get("/", async (req, res) => {
  try {

    let filter = {};

    // ✅ FILTERING
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status.toLowerCase();
    }

    const complaints = await Complaint.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.set("Cache-Control", "no-store");

    res.json(complaints);

  } catch (err) {

    console.log("FETCH COMPLAINT ERROR:", err);

    res.status(500).json({
      message: "Error fetching complaints"
    });
  }
});

// ======================
// UPDATE COMPLAINT STATUS (ADMIN)
// ======================
router.put("/:id", async (req, res) => {

  try {

    const role = req.headers.role;

    // 🔐 ROLE CHECK
    if (role !== "admin" && role !== "warden") {
      return res.status(403).json({
        message: "Only admin or warden can update complaint"
      });
    }

    const { status } = req.body;

    const allowed = ["pending", "solved"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email");
    
    await Notification.create({
  userId: updated.userId._id,
  message: `Your complaint has been marked as ${status}`,
  type: "complaint"
});


    res.json(updated);

  } catch (err) {

    console.log("UPDATE ERROR:", err);

    res.status(500).json({
      message: "Complaint update failed"
    });
  }

});

// ======================
// ❌ CANCEL COMPLAINT
router.delete("/:id", async (req, res) => {

  try {

    const role = req.headers.role;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    // 🔐 ADMIN / WARDEN FIRST CHECK
    if (role === "admin" || role === "warden") {

      await Complaint.findByIdAndDelete(req.params.id);

      return res.json({
        success: true,
        message: "Complaint deleted by admin/warden"
      });
    }

    // 👨‍🎓 STUDENT RULE
    if (complaint.status !== "pending") {
      return res.status(400).json({
        message: "Only pending complaints can be cancelled"
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Complaint cancelled successfully"
    });

  } catch (err) {

    console.log("DELETE ERROR:", err);

    res.status(500).json({
      message: "Delete failed"
    });
  }
});

module.exports = router;
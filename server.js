const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();

// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ====================== ROUTES
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/rooms", require("./routes/roomRoutes"));
app.use("/complaints", require("./routes/complaintRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.get("/notifications", async (req, res) => {
  const Notification = require("./models/Notification");

  const data = await Notification.find().sort({ date: -1 });

  res.json(data);
});
app.use("/requests", require("./routes/requestRoutes"));
app.use("/warden", require("./routes/wardenRoutes"));
app.use("/fees", require("./routes/feeRoutes"));
app.use("/feedback", require("./routes/feedbackRoutes"));

// ====================== MODELS
const User = require("./models/User");
const Room = require("./models/Room");
const Complaint = require("./models/Complaint");
const Request = require("./models/Request");
const Fee = require("./models/Fee");


// ====================== CREATE REQUEST
app.post("/send-request", async (req, res) => {

  try {

    console.log("BODY RECEIVED:", req.body);

    const { studentName, userId, roomId } = req.body;

    // ======================
    // 🔥 MISSING DATA CHECK
    // ======================
    if (!studentName || !userId || !roomId) {
      return res.status(400).json({
        message: "Missing data",
        debug: req.body
      });
    }

    const User = require("./models/User");
    const Room = require("./models/Room");
    const Request = require("./models/Request");

    // ======================
    // 🔥 USER CHECK (NEW)
    // ======================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // ❌ BLOCK IF USER ALREADY HAS ROOM
    if (user.room) {
      return res.status(400).json({
        message: "You already have a room"
      });
    }

    // ======================
    // 🔥 ROOM CHECK
    // ======================
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    // ❌ ROOM FULL CHECK
    if (room.students.length >= room.capacity) {
      return res.status(400).json({
        message: "Room is not available"
      });
    }

    // ======================
    // 🔥 DUPLICATE REQUEST BLOCK (NEW)
    // ======================
    const existingRequest = await Request.findOne({
      userId,
      roomId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Request already pending"
      });
    }

    // ======================
    // CREATE REQUEST
    // ======================
    const newRequest = await Request.create({
      studentName,
      userId,
      roomId,
      status: "pending"
    });

    res.json({
      message: "Request Sent ✔",
      request: newRequest
    });

  } catch (err) {

    console.log("ERROR:", err);

    res.status(500).json({
      message: "Error creating request"
    });
  }

});
// ====================== ADMIN REQUEST LIST
app.get("/admin/requests", async (req, res) => {
  try {
    const data = await Request.find()
      .populate("roomId")
      .populate("userId")
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Error fetching requests" });
  }
});

// ====================== STUDENT REQUESTS
app.get("/student/requests/:userId", async (req, res) => {
  try {
    const data = await Request.find({ userId: req.params.userId })
      .populate("roomId");

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Error fetching student requests" });
  }
});

// ====================== CANCEL REQUEST
app.delete("/requests/:id", async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: "Cancelled" });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

app.get("/stats/complaints", async (req, res) => {
  try {

    const data = await Complaint.find();

    const total = data.length;

    const pending = data.filter(
      c => c.status?.toLowerCase() === "pending"
    ).length;

    const solved = data.filter(
      c => c.status?.toLowerCase() === "solved"
    ).length;

    res.json({ total, pending, solved });

  } catch (err) {
    res.status(500).json({ message: "Stats error" });
  }
});

app.get("/complaints", async (req, res) => {
  try {

    let filter = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = new RegExp(`^${req.query.status}$`, "i"); 
      // case-insensitive match
    }

    const complaints = await Complaint.find(filter);
    res.json(complaints);

  } catch (error) {
    res.status(500).send("Error fetching complaints");
  }
});

// ==================================================================
// ✅ ✅ ADDED: WARDEN APPROVE REQUEST (FIX)
// ==================================================================
app.post("/warden/approve-request", async (req, res) => {
  try {

    const Request = require("./models/Request");
    const Notification = require("./models/Notification");

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        message: "requestId missing"
      });
    }

    // GET REQUEST + USER
    const request = await Request.findById(requestId)
      .populate("userId");

      const Room = require("./models/Room");

const room = await Room.findById(request.roomId);

// ✅ CHECK AGAIN
if (room.students.length >= room.capacity) {

  return res.status(400).json({
    message: "Room is already full"
  });

}

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    // UPDATE STATUS
    request.status = "approved";
    await request.save();

    // CREATE NOTIFICATION
    await Notification.create({
  userId: request.userId,
  message: "Your room request has been approved",
  type: "room"
});

    res.json({
      message: "Approved successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Approve failed"
    });
  }
});

// ==================================================================
// ✅ ✅ ADDED: WARDEN REJECT REQUEST (FIX)
// ==================================================================
app.post("/warden/reject-request", async (req, res) => {
  try {

    const Request = require("./models/Request");
    const Notification = require("./models/Notification");

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        message: "requestId missing"
      });
    }

    // GET REQUEST + USER
    const request = await Request.findById(requestId)
      .populate("userId");

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    // UPDATE STATUS
    request.status = "rejected";
    await request.save();

    // CREATE NOTIFICATION
    await Notification.create({
  userId: request.userId,
  message: "Your room request has been rejected",
  type: "room"
});

    res.json({
      message: "Rejected successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Reject failed"
    });
  }
});

// 👇 FEE ROUTE)
app.get("/fees/stats", async (req, res) => {

  const Fee = require("./models/Fee");

  const data = await Fee.find();

  const total = data.length;
  const paid = data.filter(f => f.status === "paid").length;
  const unpaid = data.filter(f => f.status === "unpaid").length;

  res.json({ total, paid, unpaid });
});

// ====================== GET SINGLE USER (PROFILE)
app.get("/users/:id", async (req, res) => {
  try {
    const User = require("./models/User");

    const user = await User.findById(req.params.id).populate("room");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ====================== UPATE USER (PROFILE)

app.put("/users/update/:id", upload.single("profilePic"), async (req, res) => {


  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const User = require("./models/User");

  const user = await User.findById(req.params.id);

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      city: req.body.city,
      address: req.body.address,
      emergency: req.body.emergency,

      profilePic: req.file
        ? "/uploads/" + req.file.filename
        : user.profilePic
    },
    { new: true }
  );

  res.json(updatedUser);
});

// 👇 HERE YOUR AI RANKING

app.get("/ai/ranking", async (req, res) => {

  const Feedback = require("./models/Feedback");
  const data = await Feedback.find();

  let positive = 0;
  let negative = 0;

  data.forEach(f => {
    if (f.sentiment === "positive") positive++;
    if (f.sentiment === "negative") negative++;
  });

  const total = data.length;

  const score = total === 0
    ? 0
    : (positive / total) * 100;

  // 👇 HERE ADD YOUR AI LOGIC (IMPORTANT PLACE)
  let status = "Good 👍";
  let reason = "Most students are satisfied";
  let warning = "No major issues";

  const positiveRatio = total === 0 ? 0 : (positive / total);

  if (total === 0) {
    status = "No Data";
    reason = "No feedback available yet";
    warning = "Collect feedback first";
  }

  else if (positiveRatio >= 0.7) {
    status = "Excellent";
    reason = "Most students are happy with hostel";
    warning = "Keep maintaining quality";
  }

  else if (positiveRatio >= 0.4) {
    status = "Average";
    reason = "Mixed student feedback";
    warning = "Improve food and cleanliness";
  }

  else {
    status = "Poor";
    reason = "Most students are unhappy";
    warning = "Immediate improvement needed";
  }

  // 👇 FINAL RESPONSE
  res.json({
    totalFeedback: total,
    positive,
    negative,
    score: score.toFixed(2),
    status,
    reason,
    warning
  });

});



app.get("/feedbacks", async (req, res) => {

  try {

    const Feedback = require("./models/Feedback");

    const { userId } = req.query;

    let query = {};

    // 👇 IMPORTANT FIX
    if (userId) {
      query.userId = userId;
    }

    const feedbacks = await Feedback.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(feedbacks);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error loading feedbacks" });
  }

});

//MONTHLY FEEDBACK

app.get("/feedback/monthly", async (req, res) => {

  const Feedback = require("./models/Feedback");

  const data = await Feedback.find();

  let monthly = {
    Jan: 0, Feb: 0, Mar: 0, Apr: 0,
    May: 0, Jun: 0, Jul: 0,
    Aug: 0, Sep: 0, Oct: 0,
    Nov: 0, Dec: 0
  };

  data.forEach(f => {

    const monthIndex = new Date(f.createdAt).getMonth();

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    monthly[monthNames[monthIndex]]++;

  });

  res.json(monthly);

});

// ====================== DB
mongoose.connect("mongodb://127.0.0.1:27017/hostelDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err));

app.listen(3000, () => console.log("Server running"));
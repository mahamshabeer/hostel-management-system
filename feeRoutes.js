const express = require("express");
const router = express.Router();
const Fee = require("../models/Fee");

// CREATE FEE (WARDEN)
router.post("/add", async (req, res) => {
  try {

    const fee = await Fee.create(req.body);

    res.json({
      message: "Fee added successfully ✔",
      fee
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error adding fee" });
  }
});

// GET ALL FEES
router.get("/", async (req, res) => {
  const fees = await Fee.find().populate("userId");
  res.json(fees);
});

// MARK AS PAID
router.put("/pay/:id", async (req, res) => {

  const role = req.body?.role
  ? req.body.role.toLowerCase()
  : "";

if (role !== "warden") {

  return res.status(403).json({
    message: "Only warden can mark fee as paid"
  });

}

  
  const fee = await Fee.findByIdAndUpdate(
    req.params.id,
    {
      status: "paid",
      paidAt: new Date()
    },
    { new: true }
  );

  await Notification.create({
  userId: fee.userId,
  message: `Your fee has been marked as PAID ✔`,
  type: "fee"
});

  res.json(fee);
});

// UNPAID ONLY
router.get("/unpaid", async (req, res) => {
  const fees = await Fee.find({ status: "unpaid" }).populate("userId");
  res.json(fees);
});

router.get("/stats", async (req, res) => {

  const Fee = require("../models/Fee");

  const fees = await Fee.find();

  res.json({
    total: fees.length,
    paid: fees.filter(f => f.status === "paid").length,
    unpaid: fees.filter(f => f.status === "unpaid").length
  });

});

router.get("/admin/stats", async (req, res) => {

  try {

    const fees = await Fee.find();

    const totalCollection = fees
      .filter(f => f.status === "paid")
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const pendingCollection = fees
      .filter(f => f.status === "unpaid")
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const totalPaid = fees.filter(f => f.status === "paid").length;

    const totalUnpaid = fees.filter(f => f.status === "unpaid").length;

    res.json({
      totalCollection,
      pendingCollection,
      totalPaid,
      totalUnpaid
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Stats error"
    });

  }

});

module.exports = router;
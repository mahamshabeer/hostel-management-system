const express = require("express");
const router = express.Router();
const Sentiment = require("sentiment");
const Feedback = require("../models/Feedback");

const sentiment = new Sentiment();

// ADD FEEDBACK
router.post("/add", async (req, res) => {
  try {

    const { userId, comment } = req.body;

    const result = sentiment.analyze(comment);

    let sentimentType = "neutral";

    if (result.score > 0) sentimentType = "positive";
    if (result.score < 0) sentimentType = "negative";

    const feedback = await Feedback.create({
      userId,
      comment,
      sentiment: sentimentType
    });

    res.json(feedback);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
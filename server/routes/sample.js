const express = require("express");
const router = express.Router();

// Cached sample used for (a) the one-click demo fallback (FR-2) and
// (b) the silent resilience fallback if a live API call fails or times out (FR-9).
const SAMPLE = {
  transcript:
    "Ok so, um, I need to email the professor about the extension, that's probably the most " +
    "urgent thing. And Sarah's supposed to send the slides by Thursday, I should ping her if she " +
    "forgets. Oh, and I should also book the room for next week's presentation, that's not super " +
    "urgent but I shouldn't forget it either. Also I was thinking the lecture today was pretty " +
    "interesting, the part about neural networks. Anyway I really need to finish the budget review " +
    "by Friday, that one's high priority.",
  tasks: [
    { task: "Email the professor about the extension", owner: "You", deadline: "Not specified", priority: "high" },
    { task: "Send the slides", owner: "Sarah", deadline: "Thursday", priority: "medium" },
    { task: "Book the room for next week's presentation", owner: "You", deadline: "Next week", priority: "low" },
    { task: "Finish the budget review", owner: "You", deadline: "Friday", priority: "high" },
  ],
};

router.get("/", (req, res) => {
  res.json(SAMPLE);
});

module.exports = router;

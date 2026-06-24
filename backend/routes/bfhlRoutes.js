const express = require("express");
const { processHierarchy } = require("../utils/graphProcessor");

const router = express.Router();

// GET /bfhl — standard BFHL health/operation check
router.get("/", (req, res) => {
  res.json({ operation_code: 1 });
});

// POST /bfhl — process hierarchy edge list
router.post("/", (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        is_success: false,
        error: 'Invalid request format. Expected { "data": [...] }',
      });
    }

    const result = processHierarchy(data);

    res.json({
      is_success: true,
      user_id: process.env.BFHL_USER_ID || "user_ddmmyyyy",
      email_id: process.env.BFHL_EMAIL || "user@example.com",
      college_roll_number: process.env.BFHL_ROLL_NUMBER || "NA",
      ...result,
    });
  } catch (error) {
    console.error("Error processing /bfhl:", error);
    res.status(500).json({
      is_success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;

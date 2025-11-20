const express = require('express');
const router = express.Router();
const { generateWeeklyReport } = require('../services/reportService');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/reports/weekly
// @desc    Generate and send weekly report
// @access  Private (Director, Admin)
router.post('/weekly', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const result = await generateWeeklyReport();
    res.json({
      success: true,
      message: 'Weekly report generated and sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


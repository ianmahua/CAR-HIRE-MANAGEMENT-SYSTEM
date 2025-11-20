const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Private (Admin, Director)
router.get('/', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { type, status, start_date, end_date } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }

    const transactions = await Transaction.find(query)
      .populate('related_rental_ref')
      .populate('related_owner_ref')
      .populate('related_user_ref')
      .sort({ date: -1 })
      .limit(100);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary
// @access  Private (Admin, Director)
router.get('/summary', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
    const endDate = end_date ? new Date(end_date) : new Date();

    const summary = await Transaction.getSummaryByType(startDate, endDate);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


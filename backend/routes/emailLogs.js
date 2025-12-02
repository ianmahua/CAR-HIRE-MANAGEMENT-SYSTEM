const express = require('express');
const router = express.Router();
const EmailLog = require('../models/EmailLog');

// GET /api/email-logs - List email logs with filters + pagination
router.get('/', async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (type) query.email_type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.sent_at = {};
      if (startDate) query.sent_at.$gte = new Date(startDate);
      if (endDate) query.sent_at.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { recipient_email: { $regex: search, $options: 'i' } },
        { recipient_name: { $regex: search, $options: 'i' } }
      ];
    }

    const numericLimit = parseInt(limit, 10) || 50;
    const numericPage = parseInt(page, 10) || 1;
    const skip = (numericPage - 1) * numericLimit;

    const logs = await EmailLog.find(query)
      .sort({ sent_at: -1 })
      .skip(skip)
      .limit(numericLimit)
      .populate('rental_id', 'rental_id booking_id');

    const total = await EmailLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs'
    });
  }
});

// GET /api/email-logs/stats - Basic email statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const todayCount = await EmailLog.countDocuments({ sent_at: { $gte: today } });
    const weekCount = await EmailLog.countDocuments({ sent_at: { $gte: thisWeek } });
    const monthCount = await EmailLog.countDocuments({ sent_at: { $gte: thisMonth } });
    const failedCount = await EmailLog.countDocuments({ status: 'failed' });
    const byType = await EmailLog.aggregate([
      { $group: { _id: '$email_type', count: { $sum: 1 } } }
    ]);

    const total = await EmailLog.countDocuments({});
    const successful = await EmailLog.countDocuments({ status: 'sent' });

    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '100.0';

    res.json({
      success: true,
      stats: {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        failed: failedCount,
        successRate,
        byType
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;



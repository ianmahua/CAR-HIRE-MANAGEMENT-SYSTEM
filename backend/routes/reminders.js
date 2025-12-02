const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReturnReminder,
  sendReminder,
  getRemindersForRental
} = require('../services/reminderService');
const Reminder = require('../models/Reminder');

// @route   POST /api/reminders/create
// @desc    Create return date reminder
// @access  Private (Admin, Director)
router.post('/create', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { rental_id, days_before } = req.body;

    const reminder = await createReturnReminder(rental_id, days_before || 1);

    res.json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/reminders/:id/send
// @desc    Send reminder manually
// @access  Private (Admin, Director)
router.post('/:id/send', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const result = await sendReminder(req.params.id);

    res.json({
      success: result.success,
      message: result.success ? 'Reminder sent successfully' : 'Failed to send reminder',
      data: result
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reminders/rental/:rental_id
// @desc    Get reminders for a rental
// @access  Private
router.get('/rental/:rental_id', protect, async (req, res) => {
  try {
    const reminders = await getRemindersForRental(req.params.rental_id);

    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reminders
// @desc    Get all reminders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, reminder_type, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (reminder_type) query.reminder_type = reminder_type;
    if (startDate || endDate) {
      query.reminder_date = {};
      if (startDate) query.reminder_date.$gte = new Date(startDate);
      if (endDate) query.reminder_date.$lte = new Date(endDate);
    }

    const reminders = await Reminder.find(query)
      .populate('rental_ref', 'rental_id start_date end_date')
      .populate('customer_ref', 'name phone email')
      .populate('vehicle_ref', 'make model license_plate')
      .sort({ reminder_date: 1 })
      .limit(100);

    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;









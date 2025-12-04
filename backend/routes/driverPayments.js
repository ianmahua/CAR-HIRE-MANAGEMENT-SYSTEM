const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createDriverPayment,
  updateDriverPayment,
  getPendingDriverPayments
} = require('../services/paymentService');
const DriverPayment = require('../models/DriverPayment');

// @route   GET /api/driver-payments
// @desc    Get driver payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = {};

    // Directors and Admins can see all, Drivers can only see their own
    if (req.user.role === 'Driver') {
      query.driver_ref = req.user._id;
    }

    if (req.query.payment_status) {
      query.payment_status = req.query.payment_status;
    }

    const payments = await DriverPayment.find(query)
      .populate('driver_ref', 'name email phone_msisdn')
      .populate('rental_ref', 'rental_id start_date end_date')
      .populate('paid_by', 'name email')
      .sort({ due_date: 1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get driver payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/driver-payments/pending
// @desc    Get pending driver payments
// @access  Private (Director, Admin)
router.get('/pending', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const payments = await getPendingDriverPayments();

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get pending driver payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/driver-payments
// @desc    Create driver payment
// @access  Private (Director, Admin)
router.post('/', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const { driver_id, rental_id, amount } = req.body;

    const payment = await createDriverPayment(driver_id, rental_id, amount);

    res.json({
      success: true,
      message: 'Driver payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Create driver payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/driver-payments/:id
// @desc    Update driver payment status
// @access  Private (Director, Admin)
router.put('/:id', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      paid_by: req.user._id
    };

    const payment = await updateDriverPayment(req.params.id, paymentData);

    res.json({
      success: true,
      message: 'Driver payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Update driver payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;












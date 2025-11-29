const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createVehicleOwnerPayment,
  updateVehicleOwnerPayment,
  getPendingOwnerPayments,
  sendOwnerPaymentReminder
} = require('../services/paymentService');
const VehicleOwnerPayment = require('../models/VehicleOwnerPayment');

// @route   GET /api/owner-payments
// @desc    Get vehicle owner payments
// @access  Private (Director, Admin)
router.get('/', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const query = {};

    if (req.query.payment_status) {
      query.payment_status = req.query.payment_status;
    }
    if (req.query.owner_ref) {
      query.owner_ref = req.query.owner_ref;
    }
    if (req.query.vehicle_ref) {
      query.vehicle_ref = req.query.vehicle_ref;
    }

    const payments = await VehicleOwnerPayment.find(query)
      .populate('owner_ref', 'name contact_details')
      .populate('vehicle_ref', 'make model license_plate')
      .populate('rental_ref', 'rental_id')
      .populate('paid_by', 'name email')
      .sort({ due_date: 1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get owner payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/owner-payments/pending
// @desc    Get pending vehicle owner payments
// @access  Private (Director, Admin)
router.get('/pending', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const payments = await getPendingOwnerPayments();

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get pending owner payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/owner-payments
// @desc    Create vehicle owner payment
// @access  Private (Director, Admin)
router.post('/', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const { owner_id, vehicle_id, rental_id, amount } = req.body;

    const payment = await createVehicleOwnerPayment(owner_id, vehicle_id, rental_id, amount);

    res.json({
      success: true,
      message: 'Owner payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Create owner payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/owner-payments/:id
// @desc    Update vehicle owner payment status
// @access  Private (Director, Admin)
router.put('/:id', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      paid_by: req.user._id
    };

    const payment = await updateVehicleOwnerPayment(req.params.id, paymentData);

    res.json({
      success: true,
      message: 'Owner payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Update owner payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/owner-payments/:id/send-reminder
// @desc    Send payment reminder to vehicle owner
// @access  Private (Director, Admin)
router.post('/:id/send-reminder', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const { days_before } = req.body;

    const result = await sendOwnerPaymentReminder(req.params.id, days_before || 2);

    res.json({
      success: result.success,
      message: result.success ? 'Reminder sent successfully' : result.message,
      data: result
    });
  } catch (error) {
    console.error('Send owner payment reminder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;








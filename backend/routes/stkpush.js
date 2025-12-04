const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { initiateSTKPush, handleSTKCallback, getSTKPushHistory } = require('../services/stkPushService');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');

// @route   POST /api/stkpush/request
// @desc    Request payment via STK Push (Driver)
// @access  Private (Driver)
router.post('/request', protect, async (req, res) => {
  try {
    // Only drivers can request STK push
    if (req.user.role !== 'Driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can request STK push payments'
      });
    }

    const { customer_id, amount, rental_id, vehicle_id } = req.body;

    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const stkPushData = {
      customer_ref: customer_id,
      vehicle_ref: vehicle_id,
      rental_ref: rental_id,
      driver_ref: req.user._id,
      amount: parseFloat(amount),
      phone_number: customer.phone
    };

    const result = await initiateSTKPush(stkPushData);

    if (result.success) {
      res.json({
        success: true,
        message: 'STK Push initiated successfully',
        data: {
          checkoutRequestID: result.checkoutRequestID,
          merchantRequestID: result.merchantRequestID,
          stkPushLog: result.stkPushLog
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initiate STK Push',
        error: result.error
      });
    }
  } catch (error) {
    console.error('STK Push request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/stkpush/callback
// @desc    Handle STK Push callback from M-Pesa
// @access  Public (called by M-Pesa)
router.post('/callback', async (req, res) => {
  try {
    const result = await handleSTKCallback(req.body);
    
    // Always return success to M-Pesa
    res.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully'
    });
  } catch (error) {
    console.error('STK Push callback error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: 'Callback processing failed'
    });
  }
});

// @route   GET /api/stkpush/history
// @desc    Get STK Push history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const filters = {};

    // Drivers can only see their own STK pushes
    if (req.user.role === 'Driver') {
      filters.driver_ref = req.user._id;
    }

    if (req.query.customer_ref) filters.customer_ref = req.query.customer_ref;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    const history = await getSTKPushHistory(filters);

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get STK Push history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;












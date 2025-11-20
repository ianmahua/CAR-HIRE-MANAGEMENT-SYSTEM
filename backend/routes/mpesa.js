const express = require('express');
const router = express.Router();
const mpesaService = require('../services/mpesaService');
const Transaction = require('../models/Transaction');
const Rental = require('../models/Rental');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/mpesa/stk-push
// @desc    Initiate STK Push payment
// @access  Private (Admin)
router.post('/stk-push', protect, authorize('Admin'), async (req, res) => {
  try {
    const { phone_number, amount, rental_id, description } = req.body;

    const rental = await Rental.findById(rental_id);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    const accountReference = rental.rental_id;
    const result = await mpesaService.initiateSTKPush(
      phone_number,
      amount,
      accountReference,
      description || `Payment for rental ${rental.rental_id}`
    );

    // Create pending transaction
    await Transaction.create({
      type: 'C2B',
      amount: amount,
      related_rental_ref: rental_id,
      source_destination_ref: phone_number,
      account_reference: accountReference,
      status: 'Pending',
      description: description
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/mpesa/b2c
// @desc    Send B2C payment
// @access  Private (Admin)
router.post('/b2c', protect, authorize('Admin'), async (req, res) => {
  try {
    const { phone_number, amount, remarks, occasion, owner_id, user_id } = req.body;

    const result = await mpesaService.sendB2C(phone_number, amount, remarks, occasion);

    // Create transaction record
    const transactionData = {
      type: owner_id ? 'B2C Owner Payout' : 'B2C Driver Salary',
      amount: amount,
      source_destination_ref: phone_number,
      status: 'Pending',
      description: remarks
    };

    if (owner_id) transactionData.related_owner_ref = owner_id;
    if (user_id) transactionData.related_user_ref = user_id;

    await Transaction.create(transactionData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/mpesa/callback
// @desc    Handle M-Pesa callback
// @access  Public (webhook)
router.post('/callback', async (req, res) => {
  try {
    const result = await mpesaService.handleCallback(req.body);

    if (result.success) {
      // Update transaction status
      const transaction = await Transaction.findOne({
        account_reference: req.body.Body?.stkCallback?.CheckoutRequestID
      });

      if (transaction) {
        transaction.status = 'Confirmed';
        transaction.mpesa_receipt_number = result.mpesaReceiptNumber;
        transaction.mpesa_transaction_id = result.mpesaReceiptNumber;
        await transaction.save();

        // Update rental payment status
        if (transaction.related_rental_ref) {
          const rental = await Rental.findById(transaction.related_rental_ref);
          if (rental) {
            rental.payment_status = 'Paid';
            await rental.save();
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


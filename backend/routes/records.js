const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MessageLog = require('../models/MessageLog');
const Reminder = require('../models/Reminder');
const STKPushLog = require('../models/STKPushLog');
const DriverPayment = require('../models/DriverPayment');
const VehicleOwnerPayment = require('../models/VehicleOwnerPayment');
const Rental = require('../models/Rental');
const Contract = require('../models/Contract');
const Transaction = require('../models/Transaction');

// @route   GET /api/records/search
// @desc    Search all system records
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query, type, startDate, endDate } = req.query;
    const results = {
      messages: [],
      reminders: [],
      stkPushes: [],
      driverPayments: [],
      ownerPayments: [],
      rentals: [],
      contracts: [],
      transactions: []
    };

    const searchQuery = {};
    if (startDate || endDate) {
      searchQuery.created_at = {};
      if (startDate) searchQuery.created_at.$gte = new Date(startDate);
      if (endDate) searchQuery.created_at.$lte = new Date(endDate);
    }

    // Search messages
    if (!type || type === 'messages') {
      if (query) {
        searchQuery.$or = [
          { recipient_name: { $regex: query, $options: 'i' } },
          { subject: { $regex: query, $options: 'i' } },
          { message_type: { $regex: query, $options: 'i' } }
        ];
      }
      results.messages = await MessageLog.find(searchQuery)
        .populate('recipient_ref', 'name')
        .populate('rental_ref', 'rental_id')
        .populate('vehicle_ref', 'make model license_plate')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search reminders
    if (!type || type === 'reminders') {
      if (query) {
        searchQuery.$or = [
          { reminder_type: { $regex: query, $options: 'i' } }
        ];
      }
      results.reminders = await Reminder.find(searchQuery)
        .populate('rental_ref', 'rental_id')
        .populate('customer_ref', 'name')
        .populate('vehicle_ref', 'make model license_plate')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search STK pushes
    if (!type || type === 'stkPushes') {
      if (query) {
        searchQuery.$or = [
          { mpesa_receipt_number: { $regex: query, $options: 'i' } },
          { result_desc: { $regex: query, $options: 'i' } }
        ];
      }
      results.stkPushes = await STKPushLog.find(searchQuery)
        .populate('customer_ref', 'name phone')
        .populate('driver_ref', 'name')
        .populate('vehicle_ref', 'make model license_plate')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search driver payments
    if (!type || type === 'driverPayments') {
      if (query) {
        searchQuery.$or = [
          { payment_reference: { $regex: query, $options: 'i' } }
        ];
      }
      results.driverPayments = await DriverPayment.find(searchQuery)
        .populate('driver_ref', 'name email')
        .populate('rental_ref', 'rental_id')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search owner payments
    if (!type || type === 'ownerPayments') {
      if (query) {
        searchQuery.$or = [
          { payment_reference: { $regex: query, $options: 'i' } }
        ];
      }
      results.ownerPayments = await VehicleOwnerPayment.find(searchQuery)
        .populate('owner_ref', 'name')
        .populate('vehicle_ref', 'make model license_plate')
        .populate('rental_ref', 'rental_id')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search rentals
    if (!type || type === 'rentals') {
      if (query) {
        searchQuery.$or = [
          { rental_id: { $regex: query, $options: 'i' } },
          { destination: { $regex: query, $options: 'i' } }
        ];
      }
      results.rentals = await Rental.find(searchQuery)
        .populate('customer_ref', 'name')
        .populate('vehicle_ref', 'make model license_plate')
        .populate('driver_assigned', 'name')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search contracts
    if (!type || type === 'contracts') {
      if (query) {
        searchQuery.$or = [
          { contract_id: { $regex: query, $options: 'i' } }
        ];
      }
      results.contracts = await Contract.find(searchQuery)
        .populate('rental_ref', 'rental_id')
        .sort({ created_at: -1 })
        .limit(50);
    }

    // Search transactions
    if (!type || type === 'transactions') {
      if (query) {
        searchQuery.$or = [
          { transaction_id: { $regex: query, $options: 'i' } },
          { reference: { $regex: query, $options: 'i' } }
        ];
      }
      results.transactions = await Transaction.find(searchQuery)
        .populate('rental_ref', 'rental_id')
        .sort({ created_at: -1 })
        .limit(50);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search records error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/records/export
// @desc    Export records to CSV/PDF
// @access  Private (Director, Admin)
router.get('/export', protect, authorize('Director', 'Admin'), async (req, res) => {
  try {
    const { type, format, startDate, endDate } = req.query;

    // This is a placeholder - implement actual CSV/PDF export
    res.json({
      success: true,
      message: 'Export feature coming soon',
      type,
      format
    });
  } catch (error) {
    console.error('Export records error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;












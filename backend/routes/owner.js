const express = require('express');
const router = express.Router();
const VehicleOwner = require('../models/VehicleOwner');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');
const financialService = require('../services/financialService');
const { protect } = require('../middleware/auth');

// @route   GET /api/owner/vehicles
// @desc    Get owner's vehicles and performance
// @access  Private (Owner)
router.get('/vehicles', protect, async (req, res) => {
  try {
    // Find owner by user ID (assuming owner user has matching phone/email)
    const owner = await VehicleOwner.findOne({
      $or: [
        { 'contact_details.phone': req.user.phone_msisdn },
        { 'contact_details.email': req.user.email }
      ]
    }).populate('linked_vehicles');

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    // Get performance data for each vehicle
    const vehicles = await Promise.all(
      owner.linked_vehicles.map(async (vehicleId) => {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return null;

        const performance = await financialService.getVehiclePerformance(vehicleId);
        const rentals = await Rental.find({
          vehicle_ref: vehicleId,
          payment_status: 'Paid'
        }).sort({ start_date: -1 }).limit(10);

        return {
          vehicle: vehicle,
          performance: performance,
          recent_rentals: rentals
        };
      })
    );

    res.json({
      success: true,
      data: {
        owner: owner,
        vehicles: vehicles.filter(v => v !== null)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/owner/payouts
// @desc    Get owner payout history
// @access  Private (Owner)
router.get('/payouts', protect, async (req, res) => {
  try {
    const owner = await VehicleOwner.findOne({
      $or: [
        { 'contact_details.phone': req.user.phone_msisdn },
        { 'contact_details.email': req.user.email }
      ]
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    const payouts = await Transaction.find({
      related_owner_ref: owner._id,
      type: 'B2C Owner Payout'
    }).sort({ date: -1 });

    const nextPayout = await financialService.calculateOwnerPayout(owner._id);

    res.json({
      success: true,
      data: {
        payout_history: payouts,
        next_payout: nextPayout,
        total_earnings: owner.total_earnings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


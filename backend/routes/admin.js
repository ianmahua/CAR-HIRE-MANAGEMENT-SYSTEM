const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');
const VehicleOwner = require('../models/VehicleOwner');
const financialService = require('../services/financialService');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', protect, authorize('Admin'), async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ availability_status: 'In-Fleet' });
    const rentedVehicles = await Vehicle.countDocuments({ availability_status: 'Rented' });
    const activeRentals = await Rental.countDocuments({ rental_status: 'Active' });
    const pendingPayments = await Transaction.countDocuments({ status: 'Pending', type: 'C2B' });

    const utilization = await financialService.calculateFleetUtilizationRate();

    res.json({
      success: true,
      data: {
        total_vehicles: totalVehicles,
        available_vehicles: availableVehicles,
        rented_vehicles: rentedVehicles,
        active_rentals: activeRentals,
        pending_payments: pendingPayments,
        utilization_rate: utilization.utilization_rate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/payout-queue
// @desc    Get pending payout queue
// @access  Private (Admin)
router.get('/payout-queue', protect, authorize('Admin'), async (req, res) => {
  try {
    const today = new Date();
    const owners = await VehicleOwner.find({
      contract_status: 'Active',
      payout_due_day: { $lte: today.getDate() }
    });

    const payoutQueue = await Promise.all(
      owners.map(async (owner) => {
        const payout = await financialService.calculateOwnerPayout(owner._id);
        return payout;
      })
    );

    res.json({
      success: true,
      data: payoutQueue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');
const VehicleOwner = require('../models/VehicleOwner');
const financialService = require('../services/financialService');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get comprehensive admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', protect, authorize('Admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Vehicle Statistics
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ availability_status: 'Parking' });
    const rentedVehicles = await Vehicle.countDocuments({ availability_status: 'Rented Out' });
    const utilization = await financialService.calculateFleetUtilizationRate();

    // Revenue Today
    const revenueToday = await Rental.aggregate([
      {
        $match: {
          created_at: { $gte: today, $lte: endOfDay },
          rental_status: { $in: ['Active', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_fee_gross' }
        }
      }
    ]);

    // Revenue This Month
    const revenueThisMonth = await Rental.aggregate([
      {
        $match: {
          created_at: { $gte: startOfMonth },
          rental_status: { $in: ['Active', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_fee_gross' }
        }
      }
    ]);

    // Active Rentals with full details
    const activeRentals = await Rental.find({ rental_status: 'Active' })
      .populate('vehicle_ref', 'license_plate make model')
      .populate('customer_ref', 'name phone_msisdn')
      .populate('dispatched_by', 'name role')
      .sort({ dispatch_date: -1, start_date: -1 })
      .lean();

    const formattedActiveRentals = activeRentals.map(rental => ({
      rental_id: rental.rental_id,
      license_plate: rental.vehicle_ref?.license_plate || 'N/A',
      vehicle_name: `${rental.vehicle_ref?.make || ''} ${rental.vehicle_ref?.model || ''}`.trim(),
      customer_name: rental.customer_ref?.name || 'Unknown',
      customer_phone: rental.customer_ref?.phone_msisdn || 'N/A',
      dispatch_date: rental.dispatch_date || rental.start_date || rental.actual_start_date,
      dispatched_by: rental.dispatched_by?.name || 'System',
      dispatched_by_role: rental.dispatched_by?.role || 'Admin',
      return_date: rental.end_date,
      total_amount: rental.total_fee_gross || 0
    }));

    // Pending Payments (Extended rentals)
    const pendingPayments = await Rental.find({
      rental_status: 'Active',
      is_extended: true,
      extension_payment_status: 'Pending'
    })
      .populate('vehicle_ref', 'license_plate')
      .populate('customer_ref', 'name phone_msisdn')
      .lean();

    const formattedPendingPayments = pendingPayments.map(payment => ({
      rental_id: payment.rental_id,
      customer_name: payment.customer_ref?.name || 'Unknown',
      customer_phone: payment.customer_ref?.phone_msisdn || 'N/A',
      license_plate: payment.vehicle_ref?.license_plate || 'N/A',
      amount_due: payment.extension_amount || 0,
      extension_days: payment.extension_days || 0,
      original_return_date: payment.end_date
    }));

    // Upcoming Returns (Next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingReturns = await Rental.find({
      rental_status: 'Active',
      end_date: { $gte: today, $lte: nextWeek }
    })
      .populate('vehicle_ref', 'license_plate make model')
      .populate('customer_ref', 'name')
      .populate('receiving_by', 'name role')
      .sort({ end_date: 1 })
      .lean();

    const formattedUpcomingReturns = upcomingReturns.map(returnItem => {
      const returnDate = new Date(returnItem.end_date);
      const isToday = returnDate.toDateString() === today.toDateString();

      return {
        rental_id: returnItem.rental_id,
        license_plate: returnItem.vehicle_ref?.license_plate || 'N/A',
        vehicle_name: `${returnItem.vehicle_ref?.make || ''} ${returnItem.vehicle_ref?.model || ''}`.trim(),
        customer_name: returnItem.customer_ref?.name || 'Unknown',
        return_date: returnItem.end_date,
        return_time: returnItem.return_time || null,
        receiving_by: returnItem.receiving_by?.name || 'Not assigned',
        receiving_by_role: returnItem.receiving_by?.role || null,
        is_today: isToday
      };
    });

    res.json({
      success: true,
      stats: {
        totalVehicles,
        availableVehicles,
        rentedVehicles,
        utilizationRate: utilization.utilization_rate || 0,
        revenueToday: revenueToday[0]?.total || 0,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        activeBookings: formattedActiveRentals,
        pendingPayments: formattedPendingPayments,
        upcomingReturns: formattedUpcomingReturns
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
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


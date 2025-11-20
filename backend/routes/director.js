const express = require('express');
const router = express.Router();
const financialService = require('../services/financialService');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/director/dashboard
// @desc    Get director dashboard with KPIs
// @access  Private (Director)
router.get('/dashboard', protect, authorize('Director'), async (req, res) => {
  try {
    const month = req.query.month ? new Date(req.query.month) : new Date();

    // Financial metrics
    const netIncome = await financialService.calculateMonthlyNetIncome(month);
    const utilization = await financialService.calculateFleetUtilizationRate();
    const racd = await financialService.calculateRACD(month);

    // Vehicle performance by category
    const vehicles = await Vehicle.find({ availability_status: { $in: ['In-Fleet', 'Rented'] } });
    const economyVehicles = vehicles.filter(v => v.category === 'Economy');
    const executiveVehicles = vehicles.filter(v => v.category === 'Executive');

    // Driver performance matrix
    const rentals = await Rental.find({
      start_date: { $gte: new Date(month.getFullYear(), month.getMonth(), 1) }
    })
      .populate('driver_assigned', 'name')
      .populate('vehicle_ref', 'model make license_plate')
      .populate('customer_ref', 'name');

    const driverPerformance = rentals
      .filter(r => r.driver_assigned)
      .map(r => ({
        driver_name: r.driver_assigned.name,
        vehicle: `${r.vehicle_ref.make} ${r.vehicle_ref.model} (${r.vehicle_ref.license_plate})`,
        customer: r.customer_ref.name,
        rental_id: r.rental_id,
        date: r.start_date
      }));

    // On-time return rate
    const completedRentals = await Rental.find({
      rental_status: 'Completed',
      start_date: { $gte: new Date(month.getFullYear(), month.getMonth(), 1) }
    });

    const onTimeReturns = completedRentals.filter(r => {
      if (!r.actual_end_date || !r.end_date) return false;
      return new Date(r.actual_end_date) <= new Date(r.end_date);
    }).length;

    const onTimeReturnRate = completedRentals.length > 0
      ? ((onTimeReturns / completedRentals.length) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        financial_health: {
          net_income: netIncome,
          gross_profit_margin: netIncome.gross_profit_margin,
          net_profit_margin: netIncome.net_profit_margin,
          racd: racd.racd
        },
        fleet_efficiency: {
          utilization_rate: utilization.utilization_rate,
          total_fleet: utilization.total_fleet,
          rented_vehicles: utilization.rented_vehicles,
          economy_count: economyVehicles.length,
          executive_count: executiveVehicles.length
        },
        operational_insights: {
          driver_performance: driverPerformance,
          on_time_return_rate: parseFloat(onTimeReturnRate),
          total_completed_rentals: completedRentals.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/director/vehicle-performance
// @desc    Get vehicle performance metrics
// @access  Private (Director)
router.get('/vehicle-performance', protect, authorize('Director'), async (req, res) => {
  try {
    const { vehicle_id, month } = req.query;
    const targetMonth = month ? new Date(month) : new Date();

    if (vehicle_id) {
      const performance = await financialService.getVehiclePerformance(vehicle_id, targetMonth);
      return res.json({
        success: true,
        data: performance
      });
    }

    // Get all vehicles performance
    const vehicles = await Vehicle.find({ availability_status: { $in: ['In-Fleet', 'Rented'] } });
    const performances = await Promise.all(
      vehicles.map(v => financialService.getVehiclePerformance(v._id, targetMonth))
    );

    res.json({
      success: true,
      data: performances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


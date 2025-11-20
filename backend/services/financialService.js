const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');
const VehicleOwner = require('../models/VehicleOwner');
const User = require('../models/User');
const moment = require('moment');

class FinancialService {
  // Calculate Gross Car Contribution Margin (GCCM)
  async calculateGCCM(vehicleId, month = new Date()) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    await vehicle.updateMTDFinancials();
    
    return {
      vehicle_id: vehicle.vehicle_id,
      monthly_revenue: vehicle.monthly_revenue_mtd,
      maintenance_cost: vehicle.current_servicing_cost_mtd,
      gccm: vehicle.getGrossContributionMargin()
    };
  }

  // Calculate owner payout
  async calculateOwnerPayout(ownerId, month = new Date()) {
    const owner = await VehicleOwner.findById(ownerId).populate('linked_vehicles');
    if (!owner) throw new Error('Owner not found');

    const startOfMonth = moment(month).startOf('month').toDate();
    const endOfMonth = moment(month).endOf('month').toDate();

    let totalRevenue = 0;

    // Calculate revenue for each linked vehicle
    for (const vehicleId of owner.linked_vehicles) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) continue;

      const rentals = await Rental.find({
        vehicle_ref: vehicleId,
        start_date: { $gte: startOfMonth, $lte: endOfMonth },
        payment_status: 'Paid'
      });

      const vehicleRevenue = rentals.reduce((sum, rental) => {
        return sum + (rental.total_fee_gross || 0);
      }, 0);

      totalRevenue += vehicleRevenue;
    }

    // Calculate payout based on owner's rate structure
    const payoutAmount = owner.calculatePayout(totalRevenue);

    return {
      owner_id: owner.owner_id,
      owner_name: owner.name,
      total_monthly_revenue: totalRevenue,
      payout_rate_type: owner.payout_rate.type,
      payout_rate_value: owner.payout_rate.value,
      calculated_payout: payoutAmount,
      payout_due_day: owner.payout_due_day
    };
  }

  // Calculate monthly net income
  async calculateMonthlyNetIncome(month = new Date()) {
    const startOfMonth = moment(month).startOf('month').toDate();
    const endOfMonth = moment(month).endOf('month').toDate();

    // Total revenue from all rentals
    const allRentals = await Rental.find({
      start_date: { $gte: startOfMonth, $lte: endOfMonth },
      payment_status: 'Paid'
    });

    const totalRevenue = allRentals.reduce((sum, rental) => {
      // For External Brokerage, only count commission
      if (rental.hire_type === 'External Brokerage Rental') {
        return sum + (rental.broker_commission_amount || 0);
      }
      return sum + (rental.total_fee_gross || 0);
    }, 0);

    // Owner payouts
    const ownerPayouts = await Transaction.find({
      type: 'B2C Owner Payout',
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Confirmed'
    });

    const totalOwnerPayouts = ownerPayouts.reduce((sum, txn) => sum + txn.amount, 0);

    // Driver salaries/commissions
    const driverPayments = await Transaction.find({
      type: 'B2C Driver Salary',
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Confirmed'
    });

    const totalDriverPayments = driverPayments.reduce((sum, txn) => sum + txn.amount, 0);

    // Broker commissions
    const brokerCommissions = await Transaction.find({
      type: 'Broker Commission',
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Confirmed'
    });

    const totalBrokerCommissions = brokerCommissions.reduce((sum, txn) => sum + txn.amount, 0);

    // Maintenance and servicing costs
    const maintenanceCosts = await Transaction.find({
      type: 'Cost Allocation',
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Confirmed'
    });

    const totalMaintenanceCosts = maintenanceCosts.reduce((sum, txn) => sum + txn.amount, 0);

    // Calculate net income
    const netIncome = totalRevenue - totalOwnerPayouts - totalDriverPayments - totalBrokerCommissions - totalMaintenanceCosts;

    return {
      month: moment(month).format('YYYY-MM'),
      total_revenue: totalRevenue,
      owner_payouts: totalOwnerPayouts,
      driver_payments: totalDriverPayments,
      broker_commissions: totalBrokerCommissions,
      maintenance_costs: totalMaintenanceCosts,
      net_income: netIncome,
      gross_profit_margin: totalRevenue > 0 ? ((totalRevenue - totalMaintenanceCosts) / totalRevenue * 100).toFixed(2) : 0,
      net_profit_margin: totalRevenue > 0 ? (netIncome / totalRevenue * 100).toFixed(2) : 0
    };
  }

  // Calculate Fleet Utilization Rate (FUR)
  async calculateFleetUtilizationRate(date = new Date()) {
    const totalFleet = await Vehicle.countDocuments({
      availability_status: { $in: ['In-Fleet', 'Rented'] }
    });

    const rentedVehicles = await Vehicle.countDocuments({
      availability_status: 'Rented'
    });

    const utilizationRate = totalFleet > 0 ? (rentedVehicles / totalFleet * 100).toFixed(2) : 0;

    return {
      date: moment(date).format('YYYY-MM-DD'),
      total_fleet: totalFleet,
      rented_vehicles: rentedVehicles,
      utilization_rate: parseFloat(utilizationRate)
    };
  }

  // Calculate Revenue Per Available Car-Day (RACD)
  async calculateRACD(month = new Date()) {
    const startOfMonth = moment(month).startOf('month').toDate();
    const endOfMonth = moment(month).endOf('month').toDate();
    const daysInMonth = moment(month).daysInMonth();

    const vehicles = await Vehicle.find({
      availability_status: { $in: ['In-Fleet', 'Rented'] }
    });

    const totalRevenue = await Rental.aggregate([
      {
        $match: {
          start_date: { $gte: startOfMonth, $lte: endOfMonth },
          payment_status: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_fee_gross' }
        }
      }
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const availableCarDays = vehicles.length * daysInMonth;
    const racd = availableCarDays > 0 ? (revenue / availableCarDays).toFixed(2) : 0;

    return {
      month: moment(month).format('YYYY-MM'),
      total_revenue: revenue,
      available_car_days: availableCarDays,
      racd: parseFloat(racd)
    };
  }

  // Get vehicle performance metrics
  async getVehiclePerformance(vehicleId, month = new Date()) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const startOfMonth = moment(month).startOf('month').toDate();
    const endOfMonth = moment(month).endOf('month').toDate();

    const rentals = await Rental.find({
      vehicle_ref: vehicleId,
      start_date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const hiredDays = rentals.reduce((sum, rental) => {
      const actualDays = rental.actual_end_date && rental.actual_start_date
        ? moment(rental.actual_end_date).diff(moment(rental.actual_start_date), 'days')
        : rental.duration_days;
      return sum + actualDays;
    }, 0);

    const revenue = rentals
      .filter(r => r.payment_status === 'Paid')
      .reduce((sum, rental) => sum + (rental.total_fee_gross || 0), 0);

    await vehicle.updateMTDFinancials();
    const maintenanceCost = vehicle.current_servicing_cost_mtd;
    const gccm = vehicle.getGrossContributionMargin();

    return {
      vehicle_id: vehicle.vehicle_id,
      vehicle_model: `${vehicle.make} ${vehicle.model}`,
      month: moment(month).format('YYYY-MM'),
      hired_days: hiredDays,
      revenue: revenue,
      maintenance_cost: maintenanceCost,
      gccm: gccm,
      utilization_rate: (hiredDays / moment(month).daysInMonth() * 100).toFixed(2)
    };
  }
}

module.exports = new FinancialService();


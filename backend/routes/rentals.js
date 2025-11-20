const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/rentals
// @desc    Get all rentals
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, payment_status, hire_type, start_date, end_date } = req.query;
    const query = {};

    if (status) query.rental_status = status;
    if (payment_status) query.payment_status = payment_status;
    if (hire_type) query.hire_type = hire_type;
    if (start_date || end_date) {
      query.start_date = {};
      if (start_date) query.start_date.$gte = new Date(start_date);
      if (end_date) query.start_date.$lte = new Date(end_date);
    }

    // Drivers can only see their own rentals
    if (req.user.role === 'Driver') {
      query.driver_assigned = req.user._id;
    }

    const rentals = await Rental.find(query)
      .populate('vehicle_ref')
      .populate('customer_ref')
      .populate('driver_assigned', 'name phone_msisdn')
      .populate('broker_ref')
      .sort({ booking_date: -1 });

    res.json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/rentals/:id
// @desc    Get single rental
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('vehicle_ref')
      .populate('customer_ref')
      .populate('driver_assigned')
      .populate('broker_ref')
      .populate('contract_ref');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Drivers can only see their own rentals
    if (req.user.role === 'Driver' && rental.driver_assigned?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this rental'
      });
    }

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals
// @desc    Create new rental
// @access  Private (Admin)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { vehicle_ref, customer_ref, start_date, end_date, destination, hire_type, broker_ref, broker_commission_rate } = req.body;

    // Check vehicle availability
    const vehicle = await Vehicle.findById(vehicle_ref);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.availability_status !== 'In-Fleet') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for rental'
      });
    }

    // Calculate duration and total fee
    const start = new Date(start_date);
    const end = new Date(end_date);
    const duration_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total_fee_gross = vehicle.daily_rate * duration_days;

    // Create rental
    const rentalData = {
      vehicle_ref,
      customer_ref,
      start_date: start,
      end_date: end,
      duration_days,
      destination,
      total_fee_gross,
      hire_type: hire_type || 'Direct Client',
      broker_ref,
      broker_commission_rate: broker_commission_rate || 0
    };

    const rental = await Rental.create(rentalData);

    // Calculate broker commission
    rental.calculateBrokerCommission();
    await rental.save();

    // Update vehicle status
    vehicle.availability_status = 'Rented';
    await vehicle.save();

    // Update customer history
    const customer = await Customer.findById(customer_ref);
    if (customer) {
      await customer.addRentalToHistory({
        rental_id: rental._id,
        rental_date: rental.booking_date,
        vehicle_model: `${vehicle.make} ${vehicle.model}`,
        duration_days: rental.duration_days,
        total_fee: rental.total_fee_gross
      });
    }

    res.status(201).json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/rentals/:id
// @desc    Update rental
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const rental = await Rental.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/handover
// @desc    Record vehicle handover (delivery or pickup)
// @access  Private (Driver, Admin)
router.post('/:id/handover', protect, async (req, res) => {
  try {
    const { type, ...handoverData } = req.body; // type: 'delivery' or 'pickup'
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Drivers can only update their assigned rentals
    if (req.user.role === 'Driver' && rental.driver_assigned?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental'
      });
    }

    if (type === 'delivery') {
      rental.handover_data.delivery = {
        ...handoverData,
        date: new Date(),
        driver_id: req.user._id
      };
      rental.actual_start_date = new Date();
      rental.rental_status = 'Active';
    } else if (type === 'pickup') {
      rental.handover_data.pickup = {
        ...handoverData,
        date: new Date(),
        driver_id: req.user._id
      };
      rental.actual_end_date = new Date();
      rental.rental_status = 'Completed';

      // Update vehicle status
      const vehicle = await Vehicle.findById(rental.vehicle_ref);
      if (vehicle) {
        vehicle.availability_status = 'In-Fleet';
        vehicle.last_odometer_reading = handoverData.odometer_reading;
        await vehicle.save();
      }
    }

    await rental.save();

    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


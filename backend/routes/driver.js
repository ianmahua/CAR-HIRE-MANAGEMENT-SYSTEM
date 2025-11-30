const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const { protect } = require('../middleware/auth');

// GET driver notifications
router.get('/notifications/driver', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);

    const returnsToday = await Rental.find({ 
      rental_status: 'Active', 
      end_date: { $gte: today, $lt: tomorrow } 
    }).populate('vehicle_ref customer_ref');

    const overdueReturns = await Rental.find({ 
      rental_status: 'Active', 
      end_date: { $lt: today } 
    }).populate('vehicle_ref customer_ref');

    const upcomingBookings = await Rental.find({ 
      rental_status: 'Pending', 
      start_date: { $gte: today, $lt: twoDaysLater } 
    }).populate('vehicle_ref customer_ref');

    const notifications = [
      ...returnsToday.map(b => ({ 
        type: 'return_today', 
        priority: 'high', 
        message: `${b.vehicle_ref?.license_plate} return due today`, 
        booking: b 
      })),
      ...overdueReturns.map(b => ({ 
        type: 'overdue', 
        priority: 'urgent', 
        message: `${b.vehicle_ref?.license_plate} is overdue`, 
        booking: b 
      })),
      ...upcomingBookings.map(b => ({ 
        type: 'reminder', 
        priority: 'medium', 
        message: `Upcoming booking for ${b.customer_ref?.name}`, 
        booking: b 
      }))
    ];

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Process return or extension
router.post('/bookings/:bookingId/return-extend', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, extension_days, payment_status, notes } = req.body;

    const rental = await Rental.findOne({ rental_id: bookingId }).populate('vehicle_ref');
    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (action === 'return') {
      rental.rental_status = 'Completed';
      rental.actual_end_date = new Date();
      await rental.save();
      
      // Update vehicle status
      if (rental.vehicle_ref) {
        rental.vehicle_ref.availability_status = 'Parking';
        await rental.vehicle_ref.save();
      }
      
      res.json({ success: true, message: 'Vehicle returned successfully' });
    } else if (action === 'extend') {
      const currentEndDate = new Date(rental.end_date);
      currentEndDate.setDate(currentEndDate.getDate() + parseInt(extension_days));
      rental.end_date = currentEndDate;
      rental.is_extended = true;
      rental.extension_days = (rental.extension_days || 0) + parseInt(extension_days);
      rental.extension_payment_status = payment_status || 'Paid';
      rental.duration_days = rental.duration_days + parseInt(extension_days);
      await rental.save();
      res.json({ success: true, message: 'Rental extended successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Return/Extension error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// Create future booking
router.post('/bookings/future', protect, async (req, res) => {
  try {
    const { vehicle_id, customer_id, start_date, end_date, notes } = req.body;

    const vehicle = await Vehicle.findOne({ vehicle_id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const customer = await Customer.findOne({ customer_id });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const totalAmount = vehicle.daily_rate * days;

    const newRental = new Rental({
      vehicle_ref: vehicle._id,
      customer_ref: customer._id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      duration_days: days,
      total_fee_gross: totalAmount,
      rental_status: 'Pending',
      payment_status: 'Awaiting',
      destination: notes || 'TBD',
      driver_assigned: req.user._id
    });

    await newRental.save();
    res.json({ success: true, message: 'Future booking created', booking: newRental });
  } catch (error) {
    console.error('Future booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Hire out a car
router.post('/bookings/hire-out', protect, async (req, res) => {
  try {
    const { vehicle_id, customer_name, customer_phone, customer_email, start_date, end_date, notes } = req.body;

    // Find or create customer
    let customer = await Customer.findOne({ phone: customer_phone });
    if (!customer) {
      // Generate a temporary ID number if not provided
      const tempIdNumber = 'TEMP' + Date.now();
      customer = new Customer({
        customer_id: 'CUST' + Date.now(),
        name: customer_name,
        phone: customer_phone,
        ID_number: tempIdNumber,
        email: customer_email || ''
      });
      await customer.save();
    }

    const vehicle = await Vehicle.findOne({ vehicle_id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (vehicle.availability_status !== 'Parking') {
      return res.status(400).json({ success: false, message: 'Vehicle is not available' });
    }

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    const totalAmount = vehicle.daily_rate * days;

    const newRental = new Rental({
      vehicle_ref: vehicle._id,
      customer_ref: customer._id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      duration_days: days,
      total_fee_gross: totalAmount,
      rental_status: 'Active',
      payment_status: 'Awaiting',
      destination: notes || 'TBD',
      driver_assigned: req.user._id
    });

    await newRental.save();

    // Update vehicle status
    vehicle.availability_status = 'Rented Out';
    await vehicle.save();

    // Update customer hire history
    customer.addRentalToHistory({
      rental_id: newRental._id,
      rental_date: new Date(),
      vehicle_model: `${vehicle.make} ${vehicle.model}`,
      duration_days: days,
      total_fee: totalAmount
    });

    res.json({ success: true, message: 'Vehicle hired out successfully', booking: newRental });
  } catch (error) {
    console.error('Hire out error:', error);
    res.status(500).json({ success: false, message: 'Failed to hire out vehicle' });
  }
});

module.exports = router;

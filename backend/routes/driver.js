const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { sendBookingConfirmationEmail } = require('../services/bookingEmailService');
const notificationHelper = require('../utils/notificationHelper');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/profile-pictures/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)!'));
    }
  }
});

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

// Create future booking with vehicle request (make/model) instead of specific vehicle
router.post('/bookings/create', protect, async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_phone, 
      customer_email,
      vehicle_make, 
      vehicle_model, 
      vehicle_request,
      start_date, 
      end_date, 
      price_per_day,
      destination, 
      notes 
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_phone || !vehicle_make || !vehicle_model || !start_date || !end_date || !price_per_day) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customer_name, customer_phone, vehicle_make, vehicle_model, start_date, end_date, price_per_day' 
      });
    }

    // Find or create customer
    let customer = await Customer.findOne({ phone: customer_phone });
    if (!customer) {
      // Generate a temporary ID number
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

    // Calculate duration and total amount
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = parseFloat(price_per_day) * days;

    // Find a dummy/placeholder vehicle or create booking without vehicle_ref
    // For now, we'll try to find any available vehicle of similar make/model, or create a pending booking
    let vehicle = null;
    let vehicleRef = null;
    
    // Try to find a matching vehicle (optional - for future assignment)
    const matchingVehicle = await Vehicle.findOne({ 
      make: { $regex: new RegExp(vehicle_make, 'i') },
      model: { $regex: new RegExp(vehicle_model, 'i') },
      availability_status: 'Parking'
    });

    if (matchingVehicle) {
      vehicleRef = matchingVehicle._id;
      vehicle = matchingVehicle;
    }

    // Create booking/rental record
    // Note: Since Rental model requires vehicle_ref, we'll use a placeholder or the matching vehicle
    // If no matching vehicle, we'll need to handle this differently
    // For now, let's create it with the matching vehicle or use a special "Pending Assignment" status
    
    const bookingData = {
      customer_ref: customer._id,
      start_date: start,
      end_date: end,
      duration_days: days,
      total_fee_gross: totalAmount,
      rental_status: 'Pending',
      payment_status: 'Awaiting',
      destination: destination || 'TBD',
      hire_type: 'Direct Client',
      driver_assigned: req.user._id,
      notes: notes || ''
    };

    // If we found a matching vehicle, use it; otherwise use a placeholder
    if (vehicleRef) {
      bookingData.vehicle_ref = vehicleRef;
      // Still store the vehicle request in notes for clarity
      bookingData.notes = `Vehicle Request: ${vehicle_make} ${vehicle_model}${notes ? `. ${notes}` : ''}`;
    } else {
      // Find any available vehicle as placeholder (required by Rental model)
      const placeholderVehicle = await Vehicle.findOne({ availability_status: 'Parking' });
      if (placeholderVehicle) {
        bookingData.vehicle_ref = placeholderVehicle._id;
        bookingData.notes = `Vehicle Request: ${vehicle_make} ${vehicle_model}${notes ? `. ${notes}` : ''}`;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'No available vehicles found. Please contact admin to add vehicles.' 
        });
      }
    }

    const newBooking = new Rental(bookingData);
    await newBooking.save();

    res.json({ 
      success: true, 
      message: 'Future booking created successfully', 
      data: newBooking 
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create booking' 
    });
  }
});

// Create simple booking record (separate from Rental)
// POST /api/driver/bookings
router.post('/bookings', protect, async (req, res) => {
  try {
    const {
      customerName,
      customerIdNumber,
      customerPhone,
      customerEmail,
      vehicleMake,
      vehicleModel,
      bookingDate,
      numberOfDays,
      destination,
      dailyRate,
      notes
    } = req.body;

    // Basic validation
    const missing = [];
    if (!customerName) missing.push('customerName');
    if (!customerIdNumber) missing.push('customerIdNumber');
    if (!customerPhone) missing.push('customerPhone');
    if (!customerEmail) missing.push('customerEmail');
    if (!vehicleMake) missing.push('vehicleMake');
    if (!vehicleModel) missing.push('vehicleModel');
    if (!bookingDate) missing.push('bookingDate');
    if (!numberOfDays) missing.push('numberOfDays');
    if (!destination) missing.push('destination');
    if (!dailyRate && dailyRate !== 0) missing.push('dailyRate');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    // Validate phone (basic)
    const phoneRegex = /^\+?\d{9,15}$/;
    if (!phoneRegex.test(String(customerPhone))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Validate email (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(customerEmail))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const start = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(start.getTime()) || start < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be a valid future date'
      });
    }

    const days = Number(numberOfDays);
    if (Number.isNaN(days) || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'numberOfDays must be greater than 0'
      });
    }

    const rate = Number(dailyRate);
    if (Number.isNaN(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        message: 'dailyRate must be a valid non-negative number'
      });
    }

    // Calculate end date and total amount
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const totalAmount = rate * days;

    const booking = await Booking.create({
      customerName,
      customerIdNumber,
      customerPhone,
      customerEmail,
      vehicleMake,
      vehicleModel,
      bookingDate: start,
      numberOfDays: days,
      endDate: end,
      destination,
      dailyRate: rate,
      totalAmount,
      notes: notes || '',
      status: 'pending',
      createdBy: req.user?._id
    });

    // Fire-and-forget email
    sendBookingConfirmationEmail(booking).catch((err) => {
      console.error('Booking confirmation email error:', err);
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Create driver booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  }
});

// Get driver bookings (future or past)
// GET /api/driver/bookings?filter=future|past
router.get('/bookings', protect, async (req, res) => {
  try {
    const { filter } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = {};
    if (filter === 'future') {
      // Future bookings: on or after today and not cancelled/completed
      query = {
        bookingDate: { $gte: today },
        status: { $in: ['pending', 'confirmed'] }
      };
    } else if (filter === 'past') {
      // Past bookings: before today or explicitly cancelled/completed
      query = {
        $or: [
          { bookingDate: { $lt: today } },
          { status: { $in: ['cancelled', 'completed'] } }
        ]
      };
    }

    const bookings = await Booking.find(query).sort({ bookingDate: 1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get driver bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bookings'
    });
  }
});

// Update booking (edit)
// PUT /api/driver/bookings/:id
router.put('/bookings/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerIdNumber,
      customerPhone,
      customerEmail,
      vehicleMake,
      vehicleModel,
      bookingDate,
      numberOfDays,
      destination,
      dailyRate,
      notes,
      status
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Reuse basic validation similar to create
    const missing = [];
    if (!customerName) missing.push('customerName');
    if (!customerIdNumber) missing.push('customerIdNumber');
    if (!customerPhone) missing.push('customerPhone');
    if (!customerEmail) missing.push('customerEmail');
    if (!vehicleMake) missing.push('vehicleMake');
    if (!vehicleModel) missing.push('vehicleModel');
    if (!bookingDate) missing.push('bookingDate');
    if (!numberOfDays) missing.push('numberOfDays');
    if (!destination) missing.push('destination');
    if (!dailyRate && dailyRate !== 0) missing.push('dailyRate');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    const phoneRegex = /^\+?\d{9,15}$/;
    if (!phoneRegex.test(String(customerPhone))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(customerEmail))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const start = new Date(bookingDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingDate'
      });
    }

    const days = Number(numberOfDays);
    if (Number.isNaN(days) || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'numberOfDays must be greater than 0'
      });
    }

    const rate = Number(dailyRate);
    if (Number.isNaN(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        message: 'dailyRate must be a valid non-negative number'
      });
    }

    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const totalAmount = rate * days;

    booking.customerName = customerName;
    booking.customerIdNumber = customerIdNumber;
    booking.customerPhone = customerPhone;
    booking.customerEmail = customerEmail;
    booking.vehicleMake = vehicleMake;
    booking.vehicleModel = vehicleModel;
    booking.bookingDate = start;
    booking.numberOfDays = days;
    booking.endDate = end;
    booking.destination = destination;
    booking.dailyRate = rate;
    booking.totalAmount = totalAmount;
    booking.notes = notes || '';
    if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      booking.status = status;
    }

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Update driver booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update booking'
    });
  }
});

// Get bookings needing confirmation (today or tomorrow)
// GET /api/driver/bookings/reminders
router.get('/bookings/reminders', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find bookings for today or tomorrow with status 'pending' or 'confirmed'
    const bookings = await Booking.find({
      bookingDate: { $gte: today, $lt: dayAfterTomorrow },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ bookingDate: 1 });

    // Process bookings to add day indicator
    const processed = bookings.map(booking => {
      const bookingDate = new Date(booking.bookingDate);
      bookingDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...booking.toObject(),
        isToday: daysUntil === 0,
        isTomorrow: daysUntil === 1,
        daysUntil
      };
    });

    res.json({
      success: true,
      count: processed.length,
      data: processed
    });
  } catch (error) {
    console.error('Get booking reminders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch booking reminders'
    });
  }
});

// Cancel booking (soft-delete with reason)
// DELETE /api/driver/bookings/:id
router.delete('/bookings/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = 'cancelled';
    booking.cancelReason = reason || '';
    booking.cancelledAt = new Date();

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Cancel driver booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking'
    });
  }
});

// Confirm client for booking
// POST /api/driver/bookings/:id/confirm
router.post('/bookings/:id/confirm', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = 'confirmed';
    booking.confirmedAt = new Date();

    await booking.save();

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Confirm driver booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm booking'
    });
  }
});

// Confirm client confirmation (for reminder flow)
// POST /api/driver/bookings/:id/confirm-client
router.post('/bookings/:id/confirm-client', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed } = req.body; // true if client confirmed, false if not

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (confirmed === true) {
      // Client confirmed - mark as confirmed
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
    } else if (confirmed === false) {
      // Client did not confirm - cancel booking
      booking.status = 'cancelled';
      booking.cancelReason = 'Client did not confirm';
      booking.cancelledAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      data: booking,
      action: confirmed ? 'confirmed' : 'cancelled'
    });
  } catch (error) {
    console.error('Confirm client booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process client confirmation'
    });
  }
});

// Update current vehicle mileage
// PUT /api/driver/vehicles/:id/mileage
router.put('/vehicles/:id/mileage', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentMileage } = req.body;

    if (currentMileage == null || isNaN(currentMileage)) {
      return res.status(400).json({
        success: false,
        message: 'currentMileage is required and must be a number'
      });
    }

    const vehicle = await Vehicle.findOne({
      $or: [
        { _id: id },
        { vehicle_id: id }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Ensure maintenance object exists
    if (!vehicle.maintenance) {
      vehicle.maintenance = {};
    }

    vehicle.maintenance.currentMileage = Number(currentMileage);

    // If we already know last service + interval, recompute next service mileage
    const intervalKm = vehicle.maintenance.serviceIntervalKm || 5000;
    if (vehicle.maintenance.lastServiceMileage != null) {
      vehicle.maintenance.nextServiceDueMileage =
        vehicle.maintenance.lastServiceMileage + intervalKm;
    } else if (vehicle.maintenance.nextServiceDueMileage == null) {
      // As a fallback, schedule next service interval from current mileage
      vehicle.maintenance.nextServiceDueMileage =
        vehicle.maintenance.currentMileage + intervalKm;
    }

    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle mileage updated',
      maintenance: vehicle.maintenance
    });
  } catch (error) {
    console.error('Error updating vehicle mileage:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update vehicle mileage'
    });
  }
});

// Record service completion and recalculate next service due
// POST /api/driver/vehicles/:id/service
router.post('/vehicles/:id/service', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serviceDate,
      serviceMileage,
      serviceIntervalKm,
      serviceIntervalDays
    } = req.body;

    const vehicle = await Vehicle.findOne({
      $or: [
        { _id: id },
        { vehicle_id: id }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (!vehicle.maintenance) {
      vehicle.maintenance = {};
    }

    const nowDate = serviceDate ? new Date(serviceDate) : new Date();
    const mileageNumber =
      serviceMileage != null ? Number(serviceMileage) : vehicle.maintenance.currentMileage || 0;

    const intervalKm = serviceIntervalKm != null
      ? Number(serviceIntervalKm)
      : (vehicle.maintenance.serviceIntervalKm || 5000);

    const intervalDays = serviceIntervalDays != null
      ? Number(serviceIntervalDays)
      : (vehicle.maintenance.serviceIntervalDays || 90);

    // Update base maintenance fields
    vehicle.maintenance.lastServiceDate = nowDate;
    vehicle.maintenance.lastServiceMileage = mileageNumber;
    vehicle.maintenance.currentMileage = Math.max(
      vehicle.maintenance.currentMileage || 0,
      mileageNumber
    );
    vehicle.maintenance.serviceIntervalKm = intervalKm;
    vehicle.maintenance.serviceIntervalDays = intervalDays;

    // Calculate next service due date & mileage
    const nextDate = new Date(nowDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);

    vehicle.maintenance.nextServiceDueDate = nextDate;
    vehicle.maintenance.nextServiceDueMileage = mileageNumber + intervalKm;

    await vehicle.save();

    res.json({
      success: true,
      message: 'Service record updated',
      maintenance: vehicle.maintenance
    });
  } catch (error) {
    console.error('Error recording vehicle service:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record vehicle service'
    });
  }
});

// Upload profile picture
router.post('/driver/profile-picture', protect, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    
    // Get current user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if it exists
    if (user.profile_picture && user.profile_picture.startsWith('/uploads/profile-pictures/')) {
      const oldFilePath = user.profile_picture.replace('/uploads/', 'uploads/');
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          console.error('Error deleting old profile picture:', err);
        }
      }
    }

    // Update user profile picture
    user.profile_picture = profilePicturePath;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profile_picture: profilePicturePath
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    // Delete uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture'
    });
  }
});

// Get driver profile (including profile picture)
router.get('/driver/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone_msisdn: user.phone_msisdn,
        profile_picture: user.profile_picture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver profile'
    });
  }
});

// Get active rentals for driver
router.get('/rentals/active', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query for active rentals where end_date >= today
    // Drivers can only see rentals they assigned or all active rentals (depending on business logic)
    const query = {
      rental_status: 'Active',
      end_date: { $gte: today }
    };

    // Optionally filter by driver_assigned if needed
    // Uncomment if drivers should only see their own rentals:
    // query.driver_assigned = req.user._id;

    const rentals = await Rental.find(query)
      .populate('vehicle_ref', 'license_plate make model year daily_rate')
      .populate('customer_ref', 'name ID_number phone email')
      .populate('driver_assigned', 'name phone_msisdn')
      .sort({ start_date: -1 });

    res.json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    console.error('Error fetching active rentals:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active rentals'
    });
  }
});

// Get available vehicles for driver
router.get('/vehicles/available', protect, async (req, res) => {
  try {
    // Query for vehicles with status = 'Parking' (available) and not 'Out of Service'
    const query = {
      availability_status: 'Parking'
    };

    const vehicles = await Vehicle.find(query)
      .select('license_plate make model year category daily_rate availability_status service_log last_odometer_reading vehicle_id')
      .sort({ make: 1, model: 1 });

    // Process vehicles to include last service and next service due
    const processedVehicles = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject();
      
      // Get last service date from service_log
      if (vehicle.service_log && vehicle.service_log.length > 0) {
        const sortedLogs = vehicle.service_log.sort((a, b) => new Date(b.date) - new Date(a.date));
        vehicleObj.last_service_date = sortedLogs[0].date;
        vehicleObj.next_service_due = sortedLogs[0].next_service_due;
      } else {
        vehicleObj.last_service_date = null;
        vehicleObj.next_service_due = null;
      }
      
      vehicleObj.current_mileage = vehicle.last_odometer_reading || 0;
      
      return vehicleObj;
    });

    res.json({
      success: true,
      count: processedVehicles.length,
      data: processedVehicles
    });
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch available vehicles'
    });
  }
});

// Unified endpoint: rentals due today or tomorrow
router.get('/rentals/due', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Active rentals due between today and tomorrow inclusive
    const query = {
      rental_status: 'Active',
      end_date: {
        $gte: today,
        $lt: dayAfterTomorrow
      }
    };

    const rentals = await Rental.find(query)
      .populate('vehicle_ref', 'license_plate make model year')
      .populate('customer_ref', 'name phone email')
      .populate('driver_assigned', 'name phone_msisdn')
      .sort({ end_date: 1 });

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const processed = rentals.map(rental => {
      const obj = rental.toObject();
      const endDate = new Date(rental.end_date);
      const startDate = new Date(rental.start_date);

      const millisPerDay = 1000 * 60 * 60 * 24;
      const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / millisPerDay);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / millisPerDay);

      // Determine group: today vs tomorrow
      const group = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : 'other';

      // Status for today's returns (on-time, due-soon, overdue)
      let status = 'on-time';
      if (group === 'today') {
        if (endDate < now) status = 'overdue';
        else if (endDate <= twoHoursFromNow) status = 'due-soon';
      }

      obj.group = group;
      obj.days_until = daysUntil;
      obj.duration_days = durationDays;
      obj.expected_return_time = endDate;
      obj.status = status;
      obj.is_overdue = status === 'overdue';
      obj.is_due_soon = status === 'due-soon';

      return obj;
    }).filter(r => r.group === 'today' || r.group === 'tomorrow');

    const todayRentals = processed.filter(r => r.group === 'today');
    const tomorrowRentals = processed.filter(r => r.group === 'tomorrow');

    res.json({
      success: true,
      rentals: {
        today: todayRentals,
        tomorrow: tomorrowRentals,
      },
      todayCount: todayRentals.length,
      tomorrowCount: tomorrowRentals.length,
      totalCount: todayRentals.length + tomorrowRentals.length,
    });
  } catch (error) {
    console.error('Error fetching due rentals:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch due rentals'
    });
  }
});

// Vehicle monthly records: day-by-day status (rented / parked / in service)
// GET /api/driver/vehicles/:vehicleId/records?month=MM&year=YYYY
router.get('/vehicles/:vehicleId/records', protect, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const monthParam = parseInt(req.query.month, 10); // 1-12
    const yearParam = parseInt(req.query.year, 10);

    if (!monthParam || !yearParam) {
      return res.status(400).json({
        success: false,
        message: 'Month and year query parameters are required (e.g., ?month=3&year=2025)'
      });
    }

    // Resolve vehicle either by Mongo _id or by logical vehicle_id
    const vehicle = await Vehicle.findOne({
      $or: [
        { _id: vehicleId },
        { vehicle_id: vehicleId }
      ]
    }).select('service_log license_plate make model year daily_rate');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Build month boundaries
    const monthIndex = monthParam - 1; // JS Date month index
    const startOfMonth = new Date(yearParam, monthIndex, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(yearParam, monthIndex + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Fetch rentals that overlap this month for the vehicle
    const rentals = await Rental.find({
      vehicle_ref: vehicle._id,
      start_date: { $lte: endOfMonth },
      end_date: { $gte: startOfMonth }
    })
      .populate('customer_ref', 'name ID_number phone')
      .populate('driver_assigned', 'name role')
      .lean();

    // Filter service logs for the month
    const monthServices = (vehicle.service_log || []).filter(log => {
      const d = new Date(log.date);
      return d >= startOfMonth && d <= endOfMonth;
    });

    // Initialize calendar days map keyed by ISO date (YYYY-MM-DD)
    const daysInMonth = endOfMonth.getDate();
    const dayMap = {};

    const toISODate = (date) => {
      const d = new Date(date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(yearParam, monthIndex, day);
      current.setHours(0, 0, 0, 0);
      const key = toISODate(current);
      dayMap[key] = {
        date: current,
        isoDate: key,
        status: 'PARKED', // default
        rentals: [],
        services: []
      };
    }

    // Attach service logs, mark days as IN_SERVICE
    monthServices.forEach(service => {
      const key = toISODate(service.date);
      const dayEntry = dayMap[key];
      if (!dayEntry) return;

      dayEntry.services.push({
        service_type: service.service_type,
        description: service.description,
        performed_by: service.performed_by,
        cost: service.cost,
        odometer_reading: service.odometer_reading,
        next_service_due: service.next_service_due,
        raw: service
      });

      // Service has highest priority over rented/parked
      dayEntry.status = 'IN_SERVICE';
    });

    // Attach rentals, mark days as RENTED (unless already IN_SERVICE)
    rentals.forEach(rental => {
      const rentalStart = new Date(Math.max(startOfMonth.getTime(), new Date(rental.start_date).getTime()));
      const rentalEnd = new Date(Math.min(endOfMonth.getTime(), new Date(rental.end_date).getTime()));

      rentalStart.setHours(0, 0, 0, 0);
      rentalEnd.setHours(0, 0, 0, 0);

      for (
        let d = new Date(rentalStart.getTime());
        d <= rentalEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const key = toISODate(d);
        const dayEntry = dayMap[key];
        if (!dayEntry) continue;

        dayEntry.rentals.push({
          rental_id: rental.rental_id,
          customer: {
            name: rental.customer_ref?.name || rental.customer_name || '',
            idNumber: rental.customer_ref?.ID_number || '',
            phone: rental.customer_ref?.phone || rental.customer_phone || ''
          },
          destination: rental.destination,
          total_fee_gross: rental.total_fee_gross,
          daily_rate: rental.duration_days ? (rental.total_fee_gross / rental.duration_days) : vehicle.daily_rate,
          start_date: rental.start_date,
          end_date: rental.end_date,
          actual_end_date: rental.actual_end_date,
          driver: rental.driver_assigned
            ? {
                name: rental.driver_assigned.name,
                role: rental.driver_assigned.role
              }
            : null,
          hire_type: rental.hire_type,
          raw: rental
        });

        // Only upgrade from PARKED to RENTED; IN_SERVICE remains highest priority
        if (dayEntry.status === 'PARKED') {
          dayEntry.status = 'RENTED';
        }
      }
    });

    const days = Object.values(dayMap).sort((a, b) => a.date - b.date);

    res.json({
      success: true,
      vehicle: {
        id: vehicle._id,
        vehicle_id: vehicle.vehicle_id,
        license_plate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        daily_rate: vehicle.daily_rate
      },
      month: monthParam,
      year: yearParam,
      days
    });
  } catch (error) {
    console.error('Error fetching vehicle monthly records:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch vehicle records'
    });
  }
});

// Search hire history
// GET /api/driver/hire-history/search?query=XXX&searchType=idNumber|phone|name&status=&vehicle=&dateFrom=&dateTo=
router.get('/driver/hire-history/search', protect, async (req, res) => {
  try {
    const { query, searchType, status, vehicle, dateFrom, dateTo } = req.query;

    if (!query && !status && !vehicle && !dateFrom && !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter is required'
      });
    }

    let searchConditions = {};
    let customerIds = [];

    // Search customers if query is provided
    if (query && searchType) {
      let customerQuery = {};

      switch (searchType) {
        case 'idNumber':
          customerQuery = { ID_number: { $regex: query, $options: 'i' } };
          break;
        case 'phone':
          // Remove spaces and match
          const cleanPhone = query.replace(/\s/g, '');
          customerQuery = { phone: { $regex: cleanPhone, $options: 'i' } };
          break;
        case 'name':
          customerQuery = { name: { $regex: query, $options: 'i' } };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid searchType. Must be: idNumber, phone, or name'
          });
      }

      const customers = await Customer.find(customerQuery).select('_id');
      customerIds = customers.map(c => c._id);

      if (customerIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0,
          message: 'No customers found matching search criteria'
        });
      }

      searchConditions.customer_ref = { $in: customerIds };
    }

    // Filter by status
    if (status) {
      searchConditions.rental_status = status;
    }

    // Filter by vehicle
    if (vehicle) {
      searchConditions.vehicle_ref = vehicle;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      searchConditions.start_date = {};
      if (dateFrom) {
        searchConditions.start_date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        searchConditions.start_date.$lte = endDate;
      }
    }

    // Fetch rentals with populated data
    const rentals = await Rental.find(searchConditions)
      .populate('customer_ref', 'name ID_number phone email')
      .populate('vehicle_ref', 'license_plate make model year daily_rate category')
      .populate('driver_assigned', 'name email')
      .populate('broker_ref', 'name commission_rate')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich rentals with payment history
    const Transaction = require('../models/Transaction');
    
    const enrichedRentals = await Promise.all(
      rentals.map(async (rental) => {
        // Get payment transactions for this rental
        const payments = await Transaction.find({
          rental_ref: rental._id,
          transaction_type: { $in: ['Deposit', 'Payment', 'Balance Payment'] }
        })
          .select('transaction_type amount payment_method transaction_date notes')
          .sort({ transaction_date: 1 })
          .lean();

        return {
          ...rental,
          payment_history: payments || []
        };
      })
    );

    res.json({
      success: true,
      data: enrichedRentals,
      count: enrichedRentals.length
    });
  } catch (error) {
    console.error('Error searching hire history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search hire history'
    });
  }
});

// Export customer hire history as PDF
// POST /api/driver/hire-history/export-pdf
router.post('/driver/hire-history/export-pdf', protect, async (req, res) => {
  try {
    const { customer, rentals } = req.body;

    if (!customer || !rentals || !Array.isArray(rentals)) {
      return res.status(400).json({
        success: false,
        message: 'Customer data and rentals array are required'
      });
    }

    const puppeteer = require('puppeteer');
    
    // Get driver name from token
    const driverName = req.user?.name || 'System';
    const generationDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Calculate totals
    const totalRentals = rentals.length;
    const totalAmountPaid = rentals.reduce((sum, rental) => {
      const rentalTotal = (rental.total_fee_gross || 0) +
        (rental.additional_fees?.extra_mileage || 0) +
        (rental.additional_fees?.late_return_penalty || 0) +
        (rental.additional_fees?.damage_charges || 0) +
        (rental.additional_fees?.fuel_charges || 0);
      return sum + rentalTotal;
    }, 0);

    // Create HTML template for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #e89d0b;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #e89d0b;
          margin-bottom: 10px;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin: 20px 0 10px 0;
        }
        .customer-details {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .customer-details h3 {
          color: #e89d0b;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .detail-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .detail-label {
          font-weight: bold;
          width: 150px;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .generation-date {
          text-align: right;
          font-size: 11px;
          color: #666;
          margin-top: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        thead {
          background-color: #e89d0b;
          color: white;
        }
        th {
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
        }
        td {
          padding: 10px 8px;
          font-size: 11px;
          border-bottom: 1px solid #e0e0e0;
        }
        tbody tr:hover {
          background-color: #f9f9f9;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }
        .status-active {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-completed {
          background-color: #e5e7eb;
          color: #374151;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .summary-item {
          text-align: center;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 8px;
          flex: 1;
          margin: 0 10px;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #e89d0b;
        }
        .generated-by {
          text-align: center;
          font-size: 11px;
          color: #666;
          margin-top: 20px;
        }
        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo">THE RESSEY TOURS</div>
        <div class="company-info">Car Hire & Tours</div>
        <div class="company-info">Email: info@resseytours.com | Phone: +254 700 000 000</div>
        <div class="document-title">RENTAL HISTORY REPORT</div>
      </div>

      <!-- Customer Details -->
      <div class="customer-details">
        <h3>Customer Information</h3>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
          <span class="detail-value">${customer.name || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ID Number:</span>
          <span class="detail-value">${customer.ID_number || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone Number:</span>
          <span class="detail-value">${customer.phone || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${customer.email || 'N/A'}</span>
        </div>
        <div class="generation-date">Report Generated: ${generationDate}</div>
      </div>

      <!-- Rentals Table -->
      ${rentals.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 15%;">Rental Date</th>
            <th style="width: 20%;">Vehicle</th>
            <th style="width: 20%;">Destination</th>
            <th style="width: 10%;">Duration</th>
            <th style="width: 15%;">Amount (KES)</th>
            <th style="width: 15%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rentals.map((rental, index) => {
            const startDate = new Date(rental.start_date);
            const vehicle = `${rental.vehicle_ref?.license_plate || 'N/A'} (${rental.vehicle_ref?.make || ''} ${rental.vehicle_ref?.model || ''})`;
            const amount = (rental.total_fee_gross || 0) +
              (rental.additional_fees?.extra_mileage || 0) +
              (rental.additional_fees?.late_return_penalty || 0) +
              (rental.additional_fees?.damage_charges || 0) +
              (rental.additional_fees?.fuel_charges || 0);
            const statusClass = rental.rental_status === 'Active' ? 'status-active' : 
                               rental.rental_status === 'Completed' ? 'status-completed' : 'status-cancelled';
            
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${startDate.toLocaleDateString('en-GB')}</td>
              <td>${vehicle}</td>
              <td>${rental.destination || 'N/A'}</td>
              <td>${rental.duration_days || 0} days</td>
              <td>${amount.toLocaleString()}</td>
              <td><span class="status-badge ${statusClass}">${rental.rental_status || 'N/A'}</span></td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ` : `
      <div class="no-data">No rental records found for this customer.</div>
      `}

      <!-- Footer / Summary -->
      <div class="footer">
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Rentals</div>
            <div class="summary-value">${totalRentals}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Amount Paid</div>
            <div class="summary-value">KES ${totalAmountPaid.toLocaleString()}</div>
          </div>
        </div>
        <div class="generated-by">
          Generated by: ${driverName} on ${new Date().toLocaleString('en-GB')}
        </div>
      </div>
    </body>
    </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Create filename
    const customerNameSlug = (customer.name || 'Customer').replace(/\s+/g, '_');
    const dateSlug = new Date().toISOString().split('T')[0];
    const filename = `${customerNameSlug}_RentalHistory_${dateSlug}.pdf`;

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate PDF'
    });
  }
});

// Export individual rental as detailed PDF
// POST /api/driver/rental/export-pdf
router.post('/driver/rental/export-pdf', protect, async (req, res) => {
  try {
    const { rentalId } = req.body;

    if (!rentalId) {
      return res.status(400).json({
        success: false,
        message: 'Rental ID is required'
      });
    }

    // Fetch the rental with all populated data
    const rental = await Rental.findById(rentalId)
      .populate('customer_ref', 'name ID_number phone email')
      .populate('vehicle_ref', 'license_plate make model year daily_rate category color')
      .populate('driver_assigned', 'name email phone_msisdn')
      .populate('broker_ref', 'name commission_rate')
      .lean();

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Get payment transactions for this rental
    const Transaction = require('../models/Transaction');
    const payments = await Transaction.find({
      rental_ref: rental._id,
      transaction_type: { $in: ['Deposit', 'Payment', 'Balance Payment'] }
    })
      .select('transaction_type amount payment_method transaction_date notes')
      .sort({ transaction_date: 1 })
      .lean();

    const puppeteer = require('puppeteer');
    
    // Get driver name from token
    const driverName = req.user?.name || 'System';
    const generationDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate amounts
    const baseAmount = rental.total_fee_gross || 0;
    const additionalCharges = 
      (rental.additional_fees?.extra_mileage || 0) +
      (rental.additional_fees?.late_return_penalty || 0) +
      (rental.additional_fees?.damage_charges || 0) +
      (rental.additional_fees?.fuel_charges || 0);
    const totalAmount = baseAmount + additionalCharges;
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balanceDue = totalAmount - totalPaid;

    // Format dates
    const formatDate = (date) => {
      if (!date) return 'Not recorded';
      return new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Create HTML template for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          padding: 30px;
          color: #333;
          font-size: 13px;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px solid #e89d0b;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #e89d0b;
          margin-bottom: 8px;
        }
        .company-info {
          font-size: 11px;
          color: #666;
          margin-bottom: 3px;
        }
        .document-title {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin: 15px 0 8px 0;
        }
        .rental-id {
          font-size: 12px;
          color: #666;
          font-weight: bold;
        }
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #e89d0b;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #e89d0b;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .info-label {
          font-size: 11px;
          color: #666;
          font-weight: bold;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 13px;
          color: #333;
          margin-top: 2px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          margin-top: 3px;
        }
        .status-active {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-completed {
          background-color: #e5e7eb;
          color: #374151;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .financial-table td {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
        }
        .financial-table td:first-child {
          color: #666;
        }
        .financial-table td:last-child {
          text-align: right;
          font-weight: bold;
        }
        .financial-table tr.total {
          background-color: #f3f4f6;
          font-weight: bold;
          font-size: 14px;
        }
        .financial-table tr.total td {
          border-top: 2px solid #e89d0b;
          border-bottom: 2px solid #e89d0b;
          padding: 10px 8px;
        }
        .payment-history {
          margin-top: 15px;
        }
        .payment-item {
          padding: 10px;
          background-color: white;
          border-radius: 6px;
          margin-bottom: 8px;
          border: 1px solid #e0e0e0;
        }
        .payment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .payment-type {
          font-weight: bold;
          color: #333;
        }
        .payment-amount {
          font-weight: bold;
          color: #10b981;
          font-size: 14px;
        }
        .payment-details {
          font-size: 11px;
          color: #666;
        }
        .alert-box {
          padding: 12px;
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 6px;
          margin: 15px 0;
        }
        .alert-box strong {
          color: #92400e;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          font-size: 11px;
          color: #666;
        }
        .summary-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .summary-box {
          text-align: center;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }
        .summary-box.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .summary-box.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .summary-label {
          font-size: 11px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 20px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo">THE RESSEY TOURS</div>
        <div class="company-info">Car Hire & Tours</div>
        <div class="company-info">Email: info@resseytours.com | Phone: +254 700 000 000</div>
        <div class="document-title">RENTAL DETAILS REPORT</div>
        <div class="rental-id">Rental ID: ${rental.rental_id || rental._id}</div>
      </div>

      <!-- Summary Boxes -->
      <div class="summary-boxes">
        <div class="summary-box">
          <div class="summary-label">Total Amount</div>
          <div class="summary-value">KES ${totalAmount.toLocaleString()}</div>
        </div>
        <div class="summary-box success">
          <div class="summary-label">Amount Paid</div>
          <div class="summary-value">KES ${totalPaid.toLocaleString()}</div>
        </div>
        <div class="summary-box ${balanceDue > 0 ? 'warning' : 'success'}">
          <div class="summary-label">Balance Due</div>
          <div class="summary-value">KES ${balanceDue.toLocaleString()}</div>
        </div>
      </div>

      ${balanceDue > 0 ? `
      <div class="alert-box">
        <strong>⚠️ Outstanding Balance:</strong> KES ${balanceDue.toLocaleString()} is still due for this rental.
      </div>
      ` : ''}

      <!-- Customer Information -->
      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${rental.customer_ref?.name || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">ID Number</div>
            <div class="info-value">${rental.customer_ref?.ID_number || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone Number</div>
            <div class="info-value">${rental.customer_ref?.phone || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email Address</div>
            <div class="info-value">${rental.customer_ref?.email || 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Vehicle Information -->
      <div class="section">
        <div class="section-title">Vehicle Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">License Plate</div>
            <div class="info-value">${rental.vehicle_ref?.license_plate || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Make & Model</div>
            <div class="info-value">${rental.vehicle_ref?.make || ''} ${rental.vehicle_ref?.model || ''} ${rental.vehicle_ref?.year ? `(${rental.vehicle_ref.year})` : ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Category</div>
            <div class="info-value">${rental.vehicle_ref?.category || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Daily Rate</div>
            <div class="info-value">KES ${(rental.vehicle_ref?.daily_rate || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- Rental Details -->
      <div class="section">
        <div class="section-title">Rental Timeline & Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Scheduled Start Date</div>
            <div class="info-value">${formatDate(rental.start_date)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Scheduled End Date</div>
            <div class="info-value">${formatDate(rental.end_date)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Actual Check-Out</div>
            <div class="info-value">${formatDate(rental.actual_start_date)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Actual Return</div>
            <div class="info-value">${rental.actual_end_date ? formatDate(rental.actual_end_date) : (rental.rental_status === 'Active' ? 'Still Active' : 'Not Recorded')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Duration</div>
            <div class="info-value">${rental.duration_days || 0} days</div>
          </div>
          <div class="info-item">
            <div class="info-label">Destination</div>
            <div class="info-value">${rental.destination || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Hire Type</div>
            <div class="info-value">${rental.hire_type || 'Direct Client'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status-badge status-${rental.rental_status?.toLowerCase() || 'active'}">
                ${rental.rental_status || 'Active'}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Driver Assigned</div>
            <div class="info-value">${rental.driver_assigned?.name || 'Not Assigned'}</div>
          </div>
          ${rental.broker_ref ? `
          <div class="info-item">
            <div class="info-label">Broker</div>
            <div class="info-value">${rental.broker_ref.name} (${rental.broker_commission_rate}% commission)</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Financial Breakdown -->
      <div class="section">
        <div class="section-title">Financial Breakdown</div>
        <table class="financial-table">
          <tr>
            <td>Daily Rate</td>
            <td>KES ${(rental.vehicle_ref?.daily_rate || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Number of Days</td>
            <td>${rental.duration_days || 0} days</td>
          </tr>
          <tr>
            <td>Base Rental Amount</td>
            <td>KES ${baseAmount.toLocaleString()}</td>
          </tr>
          ${rental.additional_fees?.extra_mileage > 0 ? `
          <tr>
            <td>Extra Mileage Charges</td>
            <td>KES ${rental.additional_fees.extra_mileage.toLocaleString()}</td>
          </tr>
          ` : ''}
          ${rental.additional_fees?.late_return_penalty > 0 ? `
          <tr>
            <td>Late Return Penalty</td>
            <td>KES ${rental.additional_fees.late_return_penalty.toLocaleString()}</td>
          </tr>
          ` : ''}
          ${rental.additional_fees?.damage_charges > 0 ? `
          <tr>
            <td>Damage Charges</td>
            <td>KES ${rental.additional_fees.damage_charges.toLocaleString()}</td>
          </tr>
          ` : ''}
          ${rental.additional_fees?.fuel_charges > 0 ? `
          <tr>
            <td>Fuel Charges</td>
            <td>KES ${rental.additional_fees.fuel_charges.toLocaleString()}</td>
          </tr>
          ` : ''}
          <tr class="total">
            <td>TOTAL AMOUNT</td>
            <td>KES ${totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Payment History -->
      ${payments.length > 0 ? `
      <div class="section">
        <div class="section-title">Payment History</div>
        <div class="payment-history">
          ${payments.map(payment => `
            <div class="payment-item">
              <div class="payment-header">
                <span class="payment-type">${payment.transaction_type}</span>
                <span class="payment-amount">KES ${(payment.amount || 0).toLocaleString()}</span>
              </div>
              <div class="payment-details">
                ${formatDate(payment.transaction_date)} • ${payment.payment_method || 'N/A'}
                ${payment.notes ? ` • ${payment.notes}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <table class="financial-table" style="margin-top: 15px;">
          <tr class="total">
            <td>TOTAL PAID</td>
            <td style="color: #10b981;">KES ${totalPaid.toLocaleString()}</td>
          </tr>
          ${balanceDue !== 0 ? `
          <tr class="total">
            <td>${balanceDue > 0 ? 'BALANCE DUE' : 'OVERPAYMENT'}</td>
            <td style="color: ${balanceDue > 0 ? '#dc2626' : '#10b981'};">KES ${Math.abs(balanceDue).toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <p><strong>THE RESSEY TOURS AND CAR HIRE</strong></p>
        <p>This is an official rental report generated from the Ressey Tours CRMS</p>
        <p>Generated by: ${driverName} on ${generationDate}</p>
      </div>
    </body>
    </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15px',
        right: '15px',
        bottom: '15px',
        left: '15px'
      }
    });

    await browser.close();

    // Create filename
    const customerName = (rental.customer_ref?.name || 'Customer').replace(/\s+/g, '_');
    const vehiclePlate = (rental.vehicle_ref?.license_plate || 'Vehicle').replace(/\s+/g, '_');
    const dateSlug = new Date().toISOString().split('T')[0];
    const filename = `${customerName}_${vehiclePlate}_Rental_${dateSlug}.pdf`;

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating rental PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate rental PDF'
    });
  }
});

// ============================================
// NOTIFICATION ROUTES
// ============================================

// Get all notifications for logged-in driver
// GET /api/driver/notifications
router.get('/driver/notifications', protect, async (req, res) => {
  try {
    const { unreadOnly, limit = 50, skip = 0 } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications'
    });
  }
});

// Create a new notification (manual creation)
// POST /api/driver/notifications
router.post('/driver/notifications', protect, async (req, res) => {
  try {
    const { type, title, message, relatedId, relatedModel, priority, actionUrl, actionButtons, expiresAt } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and message are required'
      });
    }

    const notification = await Notification.createNotification({
      type,
      title,
      message,
      relatedId,
      relatedModel,
      recipient: req.user._id,
      priority: priority || 'medium',
      actionUrl,
      actionButtons,
      expiresAt
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create notification'
    });
  }
});

// Mark notification as read
// PUT /api/driver/notifications/:id/read
router.put('/driver/notifications/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
// PUT /api/driver/notifications/mark-all-read
router.put('/driver/notifications-mark-all-read', protect, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
});

// Delete/dismiss notification
// DELETE /api/driver/notifications/:id
router.delete('/driver/notifications/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification dismissed'
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to dismiss notification'
    });
  }
});

// Get unread count
// GET /api/driver/notifications/unread-count
router.get('/driver/notifications-unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count'
    });
  }
});

// Extend rental
// POST /api/driver/rentals/:id/extend
router.post('/driver/rentals/:id/extend', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalDays, newDailyRate, paymentAmount, paymentMethod, hasPaid } = req.body;

    // Validation
    if (!additionalDays || additionalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional days must be greater than 0'
      });
    }

    if (!hasPaid) {
      return res.status(400).json({
        success: false,
        message: 'Payment must be confirmed before extending rental'
      });
    }

    // Find the rental
    const rental = await Rental.findById(id)
      .populate('vehicle_ref')
      .populate('customer_ref')
      .populate('driver_assigned');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.rental_status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Only active rentals can be extended'
      });
    }

    // Calculate new dates and amounts
    const currentEndDate = new Date(rental.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(additionalDays));

    const dailyRate = newDailyRate || rental.daily_rate || rental.vehicle_ref?.daily_rate || 0;
    const extensionAmount = dailyRate * parseInt(additionalDays);

    // Update rental
    rental.end_date = newEndDate;
    rental.total_days = rental.total_days + parseInt(additionalDays);
    rental.total_amount = (rental.total_amount || 0) + extensionAmount;
    
    // Add extension note
    if (!rental.notes) {
      rental.notes = '';
    }
    rental.notes += `\n[Extension] Added ${additionalDays} days on ${new Date().toLocaleDateString()}. New end date: ${newEndDate.toLocaleDateString()}. Extension amount: KES ${extensionAmount.toLocaleString()}.`;

    await rental.save();

    // Create payment record
    const Transaction = require('../models/Transaction');
    await Transaction.create({
      rental_ref: rental._id,
      customer_ref: rental.customer_ref._id,
      amount: paymentAmount || extensionAmount,
      payment_method: paymentMethod || 'Cash',
      payment_type: 'Extension Payment',
      payment_date: new Date(),
      status: 'Completed',
      notes: `Extension payment for ${additionalDays} additional days`
    });

    // Dismiss the extension request notification
    await Notification.deleteMany({
      type: 'extension_request',
      relatedId: rental._id,
      recipient: req.user._id
    });

    // Create new return_due notification for new return date
    const oneDayBefore = new Date(newEndDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only create if new end date is more than 1 day away
    if (newEndDate > oneDayBefore && oneDayBefore >= today) {
      await Notification.create({
        type: 'return_due',
        title: 'Vehicle Return Due',
        message: `${rental.vehicle_ref?.license_plate || 'Vehicle'} rented by ${rental.customer_ref?.name || 'Customer'} is due for return on ${newEndDate.toLocaleDateString()}.`,
        relatedId: rental._id,
        relatedModel: 'Rental',
        recipient: req.user._id,
        priority: 'high',
        actionUrl: '/driver?tab=active-rentals',
        actionButtons: [
          { label: 'Process Return', action: 'process_return' }
        ]
      });
    }

    // TODO: Generate extension contract PDF
    // TODO: Send extension contract via email

    res.json({
      success: true,
      message: 'Rental extended successfully',
      data: rental
    });
  } catch (error) {
    console.error('Error extending rental:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extend rental'
    });
  }
});

// Mark rental as "no extension needed"
// POST /api/driver/rentals/:id/no-extension
router.post('/driver/rentals/:id/no-extension', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the rental
    const rental = await Rental.findById(id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Add note to rental
    if (!rental.notes) {
      rental.notes = '';
    }
    rental.notes += `\n[No Extension] Confirmed on ${new Date().toLocaleDateString()} - Vehicle will be returned on time.`;

    await rental.save();

    // Dismiss the extension request notification
    await Notification.deleteMany({
      type: 'extension_request',
      relatedId: rental._id,
      recipient: req.user._id
    });

    res.json({
      success: true,
      message: 'Rental marked as no extension needed'
    });
  } catch (error) {
    console.error('Error marking no extension:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark no extension'
    });
  }
});

module.exports = router;


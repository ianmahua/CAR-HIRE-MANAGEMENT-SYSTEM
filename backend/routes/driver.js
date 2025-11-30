const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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

module.exports = router;

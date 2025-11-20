const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/driver/assignments
// @desc    Get driver's assigned rentals
// @access  Private (Driver)
router.get('/assignments', protect, authorize('Driver'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = { driver_assigned: req.user._id };

    if (status) query.rental_status = status;

    const rentals = await Rental.find(query)
      .populate('vehicle_ref', 'model make license_plate category')
      .populate('customer_ref', 'name phone ID_number')
      .sort({ start_date: -1 });

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

// @route   GET /api/driver/assignments/:id
// @desc    Get single assignment details
// @access  Private (Driver)
router.get('/assignments/:id', protect, authorize('Driver'), async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      driver_assigned: req.user._id
    })
      .populate('vehicle_ref')
      .populate('customer_ref');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
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

module.exports = router;


const express = require('express');
const router = express.Router();
const VehicleOwner = require('../models/VehicleOwner');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/vehicle-owners
// @desc    Get all vehicle owners
// @access  Private (Admin, Director)
router.get('/', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const owners = await VehicleOwner.find()
      .populate('linked_vehicles', 'make model license_plate availability_status')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      count: owners.length,
      data: owners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/vehicle-owners/:id
// @desc    Get single vehicle owner
// @access  Private (Admin, Director)
router.get('/:id', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const owner = await VehicleOwner.findById(req.params.id)
      .populate('linked_vehicles', 'make model license_plate availability_status daily_rate');

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle owner not found'
      });
    }

    res.json({
      success: true,
      data: owner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/vehicle-owners
// @desc    Create new vehicle owner
// @access  Private (Admin)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const owner = await VehicleOwner.create(req.body);

    res.status(201).json({
      success: true,
      data: owner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/vehicle-owners/:id
// @desc    Update vehicle owner
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const owner = await VehicleOwner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle owner not found'
      });
    }

    res.json({
      success: true,
      data: owner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;












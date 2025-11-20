const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/vehicles
// @desc    Get all vehicles
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, owner_type, search } = req.query;
    const query = {};

    if (status) query.availability_status = status;
    if (category) query.category = category;
    if (owner_type) query.owner_type = owner_type;
    if (search) {
      query.$or = [
        { license_plate: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('owner_ref')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner_ref');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private (Admin)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/vehicles/:id/service-log
// @desc    Add service log entry
// @access  Private (Admin)
router.post('/:id/service-log', protect, authorize('Admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    vehicle.service_log.push(req.body);
    await vehicle.updateMTDFinancials();
    await vehicle.save();

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


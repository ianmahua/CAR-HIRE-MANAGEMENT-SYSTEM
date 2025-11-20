const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private (Admin, Director)
router.get('/', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const { search, is_returning } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ID_number: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (is_returning !== undefined) {
      query.is_returning_client = is_returning === 'true';
    }

    const customers = await Customer.find(query)
      .populate('hire_history.rental_id')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Private (Admin, Director)
router.get('/:id', protect, authorize('Admin', 'Director'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('hire_history.rental_id');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private (Admin)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


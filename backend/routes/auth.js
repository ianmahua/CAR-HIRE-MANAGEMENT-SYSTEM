const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin/Director only)
// @access  Private (Admin/Director)
router.post('/register', protect, async (req, res) => {
  try {
    // Check if user is Admin or Director
    if (req.user.role !== 'Admin' && req.user.role !== 'Director') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins and Directors can register users'
      });
    }

    const { name, email, phone_msisdn, role, password_hash, payout_account_details } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone_msisdn }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone number already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone_msisdn,
      role,
      password_hash,
      payout_account_details
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password_hash').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password_hash } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).select('+password_hash');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator'
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        data: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone_msisdn: user.phone_msisdn
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, email, phone_msisdn, payout_account_details } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone_msisdn) user.phone_msisdn = phone_msisdn;
    if (payout_account_details) user.payout_account_details = payout_account_details;
    
    await user.save();
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


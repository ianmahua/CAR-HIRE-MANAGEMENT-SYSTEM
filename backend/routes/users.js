const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendUserInvitationEmail } = require('../services/emailService');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone_msisdn: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password_hash').sort({ created_at: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin)
router.get('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { email, role, name } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    if (role !== 'Director' && role !== 'Driver') {
      return res.status(400).json({
        success: false,
        message: 'Only Director or Driver roles can be assigned'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user exists but is inactive, reactivate and update
      if (!existingUser.is_active) {
        existingUser.is_active = true;
        existingUser.role = role;
        if (name) existingUser.name = name;
        await existingUser.save();
        return res.json({
          success: true,
          data: existingUser
        });
      }
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (password will be null initially)
    const user = await User.create({
      email,
      role,
      name: name || email.split('@')[0]
      // phone_msisdn and password_hash are optional - user will set them later
    });

    // Send invitation email
    try {
      await sendUserInvitationEmail(email, role);
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail user creation if email fails
    }

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

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, role, phone_msisdn, is_active } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing Admin role
    if (user.role === 'Admin' && role && role !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change Admin role'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && user.role !== 'Admin') user.role = role;
    if (phone_msisdn) user.phone_msisdn = phone_msisdn;
    if (is_active !== undefined) user.is_active = is_active;

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

// @route   PUT /api/users/:id/password
// @desc    Reset user password (Admin only)
// @access  Private (Admin)
router.put('/:id/password', protect, authorize('Admin'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bcrypt = require('bcryptjs');
    user.password_hash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting Admin
    if (user.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete Admin user'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const roleMapping = require('../config/roleMapping');
const { sendPasswordResetEmail, sendUserInvitationEmail } = require('../services/emailService');

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [{ email }, { google_id: id }] 
    });
    
    if (user) {
      // Link Google account if not already linked
      if (!user.google_id) {
        user.google_id = id;
        await user.save();
      }
      return done(null, user);
    }
    
    // Get role from mapping
    const role = roleMapping.getRoleFromEmail(email) || 'Driver';
    
    // Create new user
    user = await User.create({
      email,
      name: displayName || email.split('@')[0],
      google_id: id,
      role,
      is_active: true
    });
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT Token with role
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
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
// @desc    Login user with role validation
// @access  Public
router.post('/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password_hash').notEmpty().withMessage('Password is required'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password_hash, role } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).select('+password_hash');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Validate role matches user's actual role
      if (user.role !== role) {
        return res.status(401).json({
          success: false,
          message: `Invalid role. Your account is registered as ${user.role}`
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator'
        });
      }

      // Check password (allow null for Google OAuth users)
      if (!user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'No password set. Please use "Forgot Password" to set your password or sign in with Google'
        });
      }

      const isMatch = await user.comparePassword(password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate token with role
      const token = generateToken(user);

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

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Send user data to frontend for role selection
      const userData = {
        email: user.email,
        name: user.name,
        role: user.role,
        google_id: user.google_id
      };
      
      // Redirect to frontend with user data
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?google_auth=true&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&role=${encodeURIComponent(user.role)}`;
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google_auth_error`);
    }
  }
);

// @route   POST /api/auth/google/verify-role
// @desc    Verify role and generate JWT for Google OAuth users
// @access  Public
router.post('/google/verify-role', async (req, res) => {
  try {
    const { email, role } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Validate role
    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Invalid role. Your account is registered as ${user.role}`
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }
    
    const token = generateToken(user);
    
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
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.password_reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.password_reset_expires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, resetUrl);
    
    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent',
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Hash token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Set new password
    const bcrypt = require('bcryptjs');
    user.password_hash = password; // Will be hashed by pre-save hook
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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


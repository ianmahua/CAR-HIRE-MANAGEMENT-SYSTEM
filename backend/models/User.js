const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `USR${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  display_name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['Director', 'Admin', 'Driver', 'Owner', 'Customer'],
    default: 'Customer',
    required: [true, 'Role is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone_msisdn: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty/null
        return /^254\d{9}$/.test(v);
      },
      message: 'Phone number must be in format 254XXXXXXXXX'
    }
  },
  google_id: {
    type: String,
    unique: true,
    sparse: true
  },
  profile_picture: {
    type: String
  },
  password_hash: {
    type: String,
    required: false,
    minlength: 6
  },
  password_reset_token: {
    type: String
  },
  password_reset_expires: {
    type: Date
  },
  payout_account_details: {
    account_name: String,
    account_number: String,
    bank_name: String,
    mpesa_phone: String // For B2C payouts
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fast lookups
userSchema.index({ email: 1 });
userSchema.index({ phone_msisdn: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash') || !this.password_hash) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password_hash) return false;
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);


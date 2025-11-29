const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `CUST${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  ID_number: {
    type: String,
    required: [true, 'ID number is required'],
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^254\d{9}$/, 'Phone number must be in format 254XXXXXXXXX']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  hire_history: [{
    rental_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental'
    },
    rental_date: Date,
    vehicle_model: String,
    duration_days: Number,
    total_fee: Number
  }],
  is_returning_client: {
    type: Boolean,
    default: false
  },
  loyalty_points: {
    type: Number,
    default: 0
  },
  preferred_category: {
    type: String,
    enum: ['Economy', 'Executive', null],
    default: null
  },
  documents: {
    id_scan: {
      url: String,
      uploaded_at: Date,
      verified: { type: Boolean, default: false }
    },
    license_scan: {
      url: String,
      uploaded_at: Date,
      verified: { type: Boolean, default: false }
    },
    other_documents: [{
      name: String,
      url: String,
      uploaded_at: Date,
      document_type: String
    }]
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

// Indexes for performance
customerSchema.index({ ID_number: 1 }, { unique: true });
customerSchema.index({ phone: 1 });
customerSchema.index({ is_returning_client: 1 });

// Method to update returning client status
customerSchema.methods.updateReturningStatus = function() {
  this.is_returning_client = this.hire_history.length > 0;
  return this.save();
};

// Method to add rental to history
customerSchema.methods.addRentalToHistory = function(rentalData) {
  this.hire_history.push({
    rental_id: rentalData.rental_id,
    rental_date: rentalData.rental_date || new Date(),
    vehicle_model: rentalData.vehicle_model,
    duration_days: rentalData.duration_days,
    total_fee: rentalData.total_fee
  });
  this.updateReturningStatus();
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);


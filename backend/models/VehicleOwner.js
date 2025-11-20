const mongoose = require('mongoose');

const vehicleOwnerSchema = new mongoose.Schema({
  owner_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `OWN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  contact_details: {
    phone: {
      type: String,
      required: true,
      match: [/^254\d{9}$/, 'Phone number must be in format 254XXXXXXXXX']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: String
  },
  payout_rate: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  payout_due_day: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    validate: {
      validator: function(v) {
        return v >= 1 && v <= 31;
      },
      message: 'Payout due day must be between 1 and 31'
    }
  },
  last_payout_date: {
    type: Date
  },
  last_payout_amount: {
    type: Number,
    default: 0
  },
  linked_vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  total_earnings: {
    type: Number,
    default: 0
  },
  contract_status: {
    type: String,
    enum: ['Active', 'Suspended', 'Terminated'],
    default: 'Active'
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

// Indexes
vehicleOwnerSchema.index({ owner_id: 1 }, { unique: true });
vehicleOwnerSchema.index({ 'contact_details.phone': 1 });
vehicleOwnerSchema.index({ payout_due_day: 1 });
vehicleOwnerSchema.index({ contract_status: 1 });

// Method to calculate payout amount
vehicleOwnerSchema.methods.calculatePayout = function(monthlyRevenue) {
  if (this.payout_rate.type === 'percentage') {
    return monthlyRevenue * (this.payout_rate.value / 100);
  } else {
    return this.payout_rate.value; // Fixed amount
  }
};

module.exports = mongoose.model('VehicleOwner', vehicleOwnerSchema);


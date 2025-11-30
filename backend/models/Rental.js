const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  rental_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `RENT${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  vehicle_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  customer_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  driver_assigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  booking_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  actual_start_date: {
    type: Date
  },
  actual_end_date: {
    type: Date
  },
  duration_days: {
    type: Number,
    required: true,
    min: 1
  },
  destination: {
    type: String,
    required: [true, 'Destination is required for contract record']
  },
  total_fee_gross: {
    type: Number,
    required: true,
    min: 0
  },
  additional_fees: {
    extra_mileage: {
      type: Number,
      default: 0
    },
    late_return_penalty: {
      type: Number,
      default: 0
    },
    damage_charges: {
      type: Number,
      default: 0
    },
    fuel_charges: {
      type: Number,
      default: 0
    }
  },
  hire_type: {
    type: String,
    enum: ['Direct Client', 'Broker Handoff', 'External Brokerage Rental'],
    required: true,
    default: 'Direct Client'
  },
  broker_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker'
  },
  broker_commission_rate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  broker_commission_amount: {
    type: Number,
    default: 0
  },
  contract_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  payment_status: {
    type: String,
    enum: ['Awaiting', 'Paid', 'Reversed', 'Partial'],
    default: 'Awaiting'
  },
  rental_status: {
    type: String,
    enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  // Extension tracking
  is_extended: {
    type: Boolean,
    default: false
  },
  extension_days: {
    type: Number,
    default: 0
  },
  extension_amount: {
    type: Number,
    default: 0
  },
  extension_payment_status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Paid'
  },
  // Dispatch tracking
  dispatch_date: {
    type: Date
  },
  dispatched_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Return tracking
  return_time: {
    type: String
  },
  receiving_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actual_return_date: {
    type: Date
  },
  handover_data: {
    delivery: {
      date: Date,
      driver_id: mongoose.Schema.Types.ObjectId,
      odometer_reading: Number,
      fuel_level: String,
      condition_notes: String,
      photos: [String],
      customer_signature: String,
      gps_coordinates: {
        lat: Number,
        lng: Number
      }
    },
    pickup: {
      date: Date,
      driver_id: mongoose.Schema.Types.ObjectId,
      odometer_reading: Number,
      fuel_level: String,
      condition_notes: String,
      photos: [String],
      customer_signature: String,
      gps_coordinates: {
        lat: Number,
        lng: Number
      },
      damage_assessment: String
    }
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
rentalSchema.index({ vehicle_ref: 1 });
rentalSchema.index({ customer_ref: 1 });
rentalSchema.index({ driver_assigned: 1 });
rentalSchema.index({ start_date: 1 });
rentalSchema.index({ end_date: 1 });
rentalSchema.index({ booking_date: 1 });
rentalSchema.index({ payment_status: 1 });
rentalSchema.index({ rental_status: 1 });
rentalSchema.index({ hire_type: 1 });
// Compound index for date range queries
rentalSchema.index({ start_date: 1, end_date: 1 });

// Virtual for calculating total fee including additional charges
rentalSchema.virtual('total_fee_with_additions').get(function() {
  const additions = this.additional_fees || {};
  return this.total_fee_gross + 
    (additions.extra_mileage || 0) + 
    (additions.late_return_penalty || 0) + 
    (additions.damage_charges || 0) + 
    (additions.fuel_charges || 0);
});

// Method to calculate broker commission
rentalSchema.methods.calculateBrokerCommission = function() {
  if (this.hire_type === 'Broker Handoff' || this.hire_type === 'External Brokerage Rental') {
    this.broker_commission_amount = this.total_fee_gross * (this.broker_commission_rate / 100);
  } else {
    this.broker_commission_amount = 0;
  }
  return this.broker_commission_amount;
};

// Method to check if rental is overdue
rentalSchema.methods.isOverdue = function() {
  if (this.rental_status !== 'Active') return false;
  return new Date() > this.end_date && !this.actual_end_date;
};

module.exports = mongoose.model('Rental', rentalSchema);


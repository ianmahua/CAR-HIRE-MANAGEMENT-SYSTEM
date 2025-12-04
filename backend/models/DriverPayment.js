const mongoose = require('mongoose');

const driverPaymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `DRVPAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  driver_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rental_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  amount_owed: {
    type: Number,
    required: true,
    min: 0
  },
  amount_paid: {
    type: Number,
    default: 0,
    min: 0
  },
  payment_status: {
    type: String,
    enum: ['Not Paid', 'Partial', 'Paid'],
    default: 'Not Paid'
  },
  due_date: {
    type: Date,
    required: true
  },
  paid_date: Date,
  payment_method: {
    type: String,
    enum: ['M-Pesa', 'Bank Transfer', 'Cash', 'Other']
  },
  payment_reference: String,
  notes: String,
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
driverPaymentSchema.index({ driver_ref: 1 });
driverPaymentSchema.index({ rental_ref: 1 });
driverPaymentSchema.index({ payment_status: 1 });
driverPaymentSchema.index({ due_date: 1 });
driverPaymentSchema.index({ created_at: -1 });

module.exports = mongoose.model('DriverPayment', driverPaymentSchema);












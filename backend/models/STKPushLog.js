const mongoose = require('mongoose');

const stkPushLogSchema = new mongoose.Schema({
  stk_push_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `STK${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  rental_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  customer_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vehicle_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  driver_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  phone_number: {
    type: String,
    required: true,
    match: [/^254\d{9}$/, 'Phone number must be in format 254XXXXXXXXX']
  },
  checkout_request_id: String,
  merchant_request_id: String,
  result_code: String,
  result_desc: String,
  mpesa_receipt_number: String,
  transaction_date: Date,
  status: {
    type: String,
    enum: ['Pending', 'Initiated', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  callback_received: {
    type: Boolean,
    default: false
  },
  callback_data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  error_message: String,
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
stkPushLogSchema.index({ customer_ref: 1 });
stkPushLogSchema.index({ driver_ref: 1 });
stkPushLogSchema.index({ rental_ref: 1 });
stkPushLogSchema.index({ vehicle_ref: 1 });
stkPushLogSchema.index({ status: 1 });
stkPushLogSchema.index({ checkout_request_id: 1 });
stkPushLogSchema.index({ merchant_request_id: 1 });
stkPushLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('STKPushLog', stkPushLogSchema);








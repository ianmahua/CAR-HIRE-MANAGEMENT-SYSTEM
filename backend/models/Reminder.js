const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  reminder_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `REM${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  rental_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true
  },
  customer_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vehicle_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  reminder_type: {
    type: String,
    enum: ['Return Date', 'Payment Due', 'Contract Expiry', 'Other'],
    default: 'Return Date'
  },
  due_date: {
    type: Date,
    required: true
  },
  reminder_date: {
    type: Date,
    required: true
  },
  days_before: {
    type: Number,
    required: true,
    default: 1
  },
  channels: [{
    type: String,
    enum: ['Email', 'WhatsApp', 'SMS']
  }],
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  sent_at: Date,
  message_log_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageLog'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
reminderSchema.index({ rental_ref: 1 });
reminderSchema.index({ customer_ref: 1 });
reminderSchema.index({ vehicle_ref: 1 });
reminderSchema.index({ reminder_date: 1 });
reminderSchema.index({ due_date: 1 });
reminderSchema.index({ status: 1 });
reminderSchema.index({ created_at: -1 });

module.exports = mongoose.model('Reminder', reminderSchema);












const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  message_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `MSG${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  recipient_type: {
    type: String,
    enum: ['Customer', 'Driver', 'Owner', 'Director'],
    required: true
  },
  recipient_ref: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipient_model'
  },
  recipient_model: {
    type: String,
    required: true,
    enum: ['Customer', 'User', 'VehicleOwner']
  },
  recipient_name: {
    type: String,
    required: true
  },
  recipient_email: String,
  recipient_phone: String,
  message_type: {
    type: String,
    enum: ['Rental Agreement', 'Contract Renewal', 'Terms & Conditions', 'Reminder', 'Payment Request', 'Other'],
    required: true
  },
  channel: {
    type: String,
    enum: ['Email', 'WhatsApp', 'SMS', 'Bulk SMS'],
    required: true
  },
  subject: String,
  content: {
    type: String,
    required: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  rental_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  vehicle_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  sent_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed', 'Delivered'],
    default: 'Pending'
  },
  sent_at: Date,
  delivered_at: Date,
  error_message: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
messageLogSchema.index({ recipient_ref: 1 });
messageLogSchema.index({ rental_ref: 1 });
messageLogSchema.index({ vehicle_ref: 1 });
messageLogSchema.index({ sent_by: 1 });
messageLogSchema.index({ message_type: 1 });
messageLogSchema.index({ channel: 1 });
messageLogSchema.index({ status: 1 });
messageLogSchema.index({ sent_at: 1 });
messageLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('MessageLog', messageLogSchema);












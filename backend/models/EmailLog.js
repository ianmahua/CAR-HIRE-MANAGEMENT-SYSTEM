const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  email_log_id: {
    type: String,
    unique: true,
    default: () => `EL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  },
  rental_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  recipient_email: {
    type: String,
    required: true
  },
  recipient_name: {
    type: String
  },
  email_type: {
    type: String,
    enum: [
      'contract',
      'return_reminder_24h',
      'return_reminder_morning',
      'extension_confirmation',
      'thank_you'
    ],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  message_id: {
    type: String
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  error_message: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

EmailLogSchema.index({ rental_id: 1, email_type: 1, sent_at: -1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);



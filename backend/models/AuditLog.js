const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'booking_created',
      'booking_updated',
      'booking_cancelled',
      'payment_received',
      'payment_failed',
      'car_status_changed',
      'driver_assigned',
      'driver_unassigned',
      'contract_generated',
      'contract_signed',
      'contract_rejected',
      'vehicle_added',
      'vehicle_updated',
      'vehicle_deleted',
      'customer_created',
      'customer_updated',
      'owner_payout_processed',
      'service_logged',
      'user_login',
      'user_logout',
      'user_created',
      'user_updated',
      'settings_changed'
    ]
  },
  entity_type: {
    type: String,
    required: true,
    enum: ['Rental', 'Vehicle', 'Customer', 'Owner', 'User', 'Contract', 'Transaction', 'System']
  },
  entity_id: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_role: {
    type: String,
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  ip_address: String,
  user_agent: String,
  changes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for fast queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1 });
auditLogSchema.index({ user_id: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);









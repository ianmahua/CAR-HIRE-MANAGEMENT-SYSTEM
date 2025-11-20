const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema({
  step: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  ip_address: String,
  user_agent: String,
  action: {
    type: String,
    enum: ['Generated', 'Sent', 'Viewed', 'Signed', 'Rejected', 'Expired']
  },
  actor: {
    type: String,
    required: true
  },
  verification_method: {
    type: String,
    enum: ['OTP', 'Email', 'SMS', 'WhatsApp', 'None']
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { _id: true });

const contractSchema = new mongoose.Schema({
  contract_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `CNT${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  type: {
    type: String,
    enum: ['Rental Agreement', 'Owner Lease'],
    required: true
  },
  related_entity: {
    rental_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental'
    },
    owner_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleOwner'
    }
  },
  digital_signature_data: {
    signatory_name: String,
    signatory_id: String,
    signatory_email: String,
    signatory_phone: String,
    signature_timestamp: Date,
    signature_method: {
      type: String,
      enum: ['E-Signature API', 'Digital Signature', 'OTP Verified']
    },
    signature_certificate: String,
    signature_hash: String
  },
  signing_method: {
    type: String,
    enum: ['E-Signature API', 'Digital Signature', 'OTP Verified', 'Pending']
  },
  signer_identity_verification_data: {
    otp_sent: Boolean,
    otp_verified: Boolean,
    otp_timestamp: Date,
    email_verified: Boolean,
    phone_verified: Boolean
  },
  document_url: {
    type: String, // URL to the generated PDF contract
    required: true
  },
  signed_document_url: {
    type: String // URL to the signed PDF after completion
  },
  signing_url: {
    type: String, // Secure URL for e-signature platform
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Viewed', 'Signed', 'Rejected', 'Expired'],
    default: 'Pending'
  },
  expiry_date: {
    type: Date,
    required: true
  },
  audit_trail: [auditTrailSchema],
  terms_and_conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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
contractSchema.index({ contract_id: 1 }, { unique: true });
contractSchema.index({ status: 1 });
contractSchema.index({ type: 1 });
contractSchema.index({ 'related_entity.rental_ref': 1 });
contractSchema.index({ 'related_entity.owner_ref': 1 });
contractSchema.index({ expiry_date: 1 });

// Method to add audit trail entry
contractSchema.methods.addAuditEntry = function(entry) {
  this.audit_trail.push({
    ...entry,
    timestamp: new Date()
  });
  return this.save();
};

// Method to check if contract is expired
contractSchema.methods.isExpired = function() {
  return new Date() > this.expiry_date;
};

// Method to update status with audit trail
contractSchema.methods.updateStatus = function(newStatus, actor, metadata = {}) {
  this.status = newStatus;
  this.addAuditEntry({
    step: `Status changed to ${newStatus}`,
    action: newStatus,
    actor: actor,
    metadata: metadata
  });
  return this.save();
};

module.exports = mongoose.model('Contract', contractSchema);


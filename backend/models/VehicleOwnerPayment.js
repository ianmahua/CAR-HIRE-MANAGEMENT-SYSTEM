const mongoose = require('mongoose');

const vehicleOwnerPaymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `OWNPAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  owner_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleOwner',
    required: true
  },
  vehicle_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
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
  reminder_sent_2days: {
    type: Boolean,
    default: false
  },
  reminder_sent_1day: {
    type: Boolean,
    default: false
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
vehicleOwnerPaymentSchema.index({ owner_ref: 1 });
vehicleOwnerPaymentSchema.index({ vehicle_ref: 1 });
vehicleOwnerPaymentSchema.index({ rental_ref: 1 });
vehicleOwnerPaymentSchema.index({ payment_status: 1 });
vehicleOwnerPaymentSchema.index({ due_date: 1 });
vehicleOwnerPaymentSchema.index({ created_at: -1 });

// Virtual for days remaining
vehicleOwnerPaymentSchema.virtual('days_remaining').get(function() {
  if (this.payment_status === 'Paid') return 0;
  const now = new Date();
  const due = new Date(this.due_date);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
});

module.exports = mongoose.model('VehicleOwnerPayment', vehicleOwnerPaymentSchema);












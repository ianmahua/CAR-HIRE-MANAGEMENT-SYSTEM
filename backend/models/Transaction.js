const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  type: {
    type: String,
    enum: ['C2B', 'B2C Owner Payout', 'B2C Driver Salary', 'Cost Allocation', 'Broker Commission'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  related_rental_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  related_vehicle_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  related_owner_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleOwner'
  },
  related_user_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  source_destination_ref: {
    type: String, // MSISDN or Paybill number
    required: true
  },
  mpesa_transaction_id: {
    type: String,
    unique: true,
    sparse: true
  },
  mpesa_receipt_number: {
    type: String
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Failed', 'Pending', 'Reversed'],
    default: 'Pending'
  },
  account_reference: {
    type: String, // Critical for Bill Manager reconciliation
    required: function() {
      return this.type === 'C2B';
    }
  },
  description: {
    type: String
  },
  metadata: {
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

// Indexes for performance
transactionSchema.index({ date: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ mpesa_transaction_id: 1 }, { unique: true, sparse: true });
transactionSchema.index({ account_reference: 1 });
// Compound index for financial reporting
transactionSchema.index({ date: 1, type: 1 });
transactionSchema.index({ related_rental_ref: 1 });
transactionSchema.index({ related_owner_ref: 1 });

// Method to get transaction summary by type and date range
transactionSchema.statics.getSummaryByType = async function(startDate, endDate, type) {
  const match = {
    date: { $gte: startDate, $lte: endDate },
    status: 'Confirmed'
  };
  
  if (type) {
    match.type = type;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total_amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);


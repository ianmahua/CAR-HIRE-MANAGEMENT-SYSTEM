const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerIdNumber: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, required: true },
  vehicleMake: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true, min: 1 },
  endDate: { type: Date, required: true },
  destination: { type: String, required: true },
  dailyRate: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: String,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  cancelReason: String,
  cancelledAt: Date,
  confirmedAt: Date
}, {
  timestamps: true
});

bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('Booking', bookingSchema);



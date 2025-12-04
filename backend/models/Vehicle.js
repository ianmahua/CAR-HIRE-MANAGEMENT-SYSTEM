const mongoose = require('mongoose');

const serviceLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  performed_by: {
    type: String,
    required: true
  },
  service_type: {
    type: String,
    enum: ['Maintenance', 'Repair', 'Inspection', 'Other'],
    required: true
  },
  odometer_reading: Number,
  next_service_due: Date
}, { _id: true });

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `VEH${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['Economy', 'Executive'],
    required: true
  },
  license_plate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  owner_type: {
    type: String,
    enum: ['Company Owned', 'Leased', 'Broker'],
    required: true
  },
  owner_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleOwner',
    required: function() {
      return this.owner_type === 'Leased';
    }
  },
  daily_rate: {
    type: Number,
    required: true,
    min: 0
  },
  availability_status: {
    type: String,
    enum: ['Parking', 'Rented Out', 'In Garage', 'Out of Service'],
    default: 'Parking'
  },
  service_log: [serviceLogSchema],
  monthly_revenue_mtd: {
    type: Number,
    default: 0
  },
  current_servicing_cost_mtd: {
    type: Number,
    default: 0
  },
  last_odometer_reading: {
    type: Number,
    default: 0
  },
  gps_device_id: {
    type: String
  },
  insurance_details: {
    policy_number: String,
    expiry_date: Date,
    provider: String
  },
  registration_details: {
    registration_number: String,
    expiry_date: Date
  },
  // Maintenance / health tracking
  maintenance: {
    lastServiceDate: Date,
    lastServiceMileage: Number,
    currentMileage: {
      type: Number,
      default: 0
    },
    serviceIntervalKm: {
      type: Number,
      default: 5000
    },
    serviceIntervalDays: {
      type: Number,
      default: 90
    },
    nextServiceDueDate: Date,
    nextServiceDueMileage: Number
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
vehicleSchema.index({ license_plate: 1 }, { unique: true });
vehicleSchema.index({ availability_status: 1 });
vehicleSchema.index({ category: 1 });
vehicleSchema.index({ owner_type: 1 });
vehicleSchema.index({ owner_ref: 1 });

// Method to calculate monthly maintenance cost
vehicleSchema.methods.calculateMonthlyMaintenanceCost = function(month) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  return this.service_log
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfMonth && logDate <= endOfMonth;
    })
    .reduce((total, log) => total + log.cost, 0);
};

// Method to update MTD revenue and costs
vehicleSchema.methods.updateMTDFinancials = async function() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Calculate current month maintenance cost
  this.current_servicing_cost_mtd = this.calculateMonthlyMaintenanceCost(now);
  
  // Calculate current month revenue from rentals
  const Rental = mongoose.model('Rental');
  const monthRentals = await Rental.find({
    vehicle_ref: this._id,
    start_date: { $gte: startOfMonth, $lte: now },
    payment_status: 'Paid'
  });
  
  this.monthly_revenue_mtd = monthRentals.reduce((total, rental) => {
    return total + (rental.total_fee_gross || 0);
  }, 0);
  
  return this.save();
};

// Method to get gross contribution margin
vehicleSchema.methods.getGrossContributionMargin = function() {
  return this.monthly_revenue_mtd - this.current_servicing_cost_mtd;
};

module.exports = mongoose.model('Vehicle', vehicleSchema);


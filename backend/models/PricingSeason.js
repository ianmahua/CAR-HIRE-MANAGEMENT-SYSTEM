const mongoose = require('mongoose');

const pricingSeasonSchema = new mongoose.Schema({
  season_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `SEASON${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Peak', 'Off-Peak', 'Holiday', 'Special'],
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  rate_modifier: {
    type: Number,
    required: true,
    default: 1.0,
    min: 0.1,
    max: 5.0
  },
  description: String,
  is_active: {
    type: Boolean,
    default: true
  },
  applies_to_categories: [{
    type: String,
    enum: ['Economy', 'Executive', 'All']
  }],
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
pricingSeasonSchema.index({ start_date: 1, end_date: 1 });
pricingSeasonSchema.index({ is_active: 1 });
pricingSeasonSchema.index({ type: 1 });

// Method to check if season is currently active
pricingSeasonSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.is_active && now >= this.start_date && now <= this.end_date;
};

// Method to get applicable rate modifier for a date
pricingSeasonSchema.statics.getRateModifierForDate = async function(date, category = 'All') {
  const seasons = await this.find({
    is_active: true,
    start_date: { $lte: date },
    end_date: { $gte: date },
    $or: [
      { applies_to_categories: 'All' },
      { applies_to_categories: category }
    ]
  }).sort({ rate_modifier: -1 }); // Get highest modifier if multiple seasons overlap

  return seasons.length > 0 ? seasons[0].rate_modifier : 1.0;
};

module.exports = mongoose.model('PricingSeason', pricingSeasonSchema);













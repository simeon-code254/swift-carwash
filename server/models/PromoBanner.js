const mongoose = require('mongoose');

const promoBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  actionUrl: {
    type: String,
    default: null
  },
  actionText: {
    type: String,
    default: 'Learn More'
  },
  discountCode: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1
  },
  targetAudience: {
    type: [String],
    enum: ['all', 'new_users', 'returning_users', 'students', 'golf_players'],
    default: ['all']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
promoBannerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
promoBannerSchema.index({ priority: -1 });

// Virtual to check if banner is currently active
promoBannerSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
});

module.exports = mongoose.model('PromoBanner', promoBannerSchema); 
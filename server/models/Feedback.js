const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  washer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500,
    default: null
  },
  serviceType: {
    type: String,
    enum: ['body_wash', 'interior_exterior', 'engine', 'vacuum', 'full_service'],
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  adminAlerted: {
    type: Boolean,
    default: false
  },
  apologyDiscountApplied: {
    type: Boolean,
    default: false
  },
  discountAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ washer: 1 });
feedbackSchema.index({ booking: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema); 
const mongoose = require('mongoose');

const phoneVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Index for efficient queries
phoneVerificationSchema.index({ phone: 1, createdAt: -1 });
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is valid
phoneVerificationSchema.methods.isValid = function() {
  return !this.isUsed && this.attempts < this.maxAttempts && new Date() < this.expiresAt;
};

// Method to mark OTP as used
phoneVerificationSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Method to increment attempts
phoneVerificationSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

module.exports = mongoose.model('PhoneVerification', phoneVerificationSchema); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['student', 'golf_player', 'admin'],
    default: 'student'
  },
  university: {
    type: String,
    trim: true,
    required: false
  },
  studentId: {
    type: String,
    trim: true,
    required: false
  },
  golfClub: {
    type: String,
    trim: true,
    required: false
  },
  membershipNumber: {
    type: String,
    trim: true,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  pushToken: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // New fields for referral system
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCredits: {
    type: Number,
    default: 0
  },
  // Loyalty program
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  // Wallet/credits
  walletBalance: {
    type: Number,
    default: 0
  },
  // Phone verification
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: {
    type: String,
    default: null
  },
  phoneVerificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate referral code before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Generate referral code if not exists
    if (!this.referralCode) {
      this.referralCode = this.generateReferralCode();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.phoneVerificationCode;
  return user;
};

module.exports = mongoose.model('User', userSchema); 
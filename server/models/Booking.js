const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerLocation: {
    type: String,
    required: true
  },
  carType: {
    type: String,
    enum: ['saloon', 'suv', 'truck'],
    required: true
  },
  serviceType: {
    type: String,
    enum: ['body_wash', 'interior_exterior', 'engine', 'vacuum', 'full_service'],
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true,
    enum: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'started_cleaning', 'done', 'delivered', 'rejected', 'cancelled'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  specialInstructions: {
    type: String,
    maxlength: 500,
    default: ''
  },
  carDetails: {
    make: String,
    model: String,
    color: String,
    plateNumber: String
  },
  smsNotifications: {
    confirmed: { type: Boolean, default: false },
    started: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false }
  },
  completedAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null
  },
  // New fields for booking modifications
  modifications: [{
    type: {
      type: String,
      enum: ['reschedule', 'cancel', 'location_change']
    },
    oldValue: String,
    newValue: String,
    reason: String,
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: {
      type: String,
      enum: ['customer', 'admin', 'worker']
    }
  }],
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: String,
    default: null
  },
  // Feedback system
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      maxlength: 500,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    washerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null
    }
  },
  // Photos from workers
  photos: {
    before: [{
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
      }
    }],
    after: [{
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
      }
    }]
  },
  // Loyalty and referral tracking
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  referralCreditsApplied: {
    type: Number,
    default: 0
  },
  // Customer reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ status: 1, scheduledDate: 1 });
bookingSchema.index({ customerPhone: 1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ 'feedback.rating': 1 });

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return this.scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for service duration
bookingSchema.virtual('estimatedDuration').get(function() {
  const durations = {
    body_wash: 30,
    interior_exterior: 45,
    engine: 20,
    vacuum: 15,
    full_service: 90
  };
  return durations[this.serviceType] || 30;
});

module.exports = mongoose.model('Booking', bookingSchema); 
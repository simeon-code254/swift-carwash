const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.Mixed,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Worker', 'User', 'Admin'] // Worker, Admin (User), or Admin
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.Mixed,
      refPath: 'readByModel'
    },
    readByModel: {
      type: String,
      enum: ['Worker', 'User', 'Admin']
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group', 'private'],
    default: 'group'
  },
  name: {
    type: String,
    default: 'SwiftWash Team Chat'
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.Mixed,
      refPath: 'participantModel'
    },
    participantModel: {
      type: String,
      enum: ['Worker', 'User', 'Admin']
    },
    role: {
      type: String,
      enum: ['admin', 'worker', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  messages: [messageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ lastMessage: -1 });
chatSchema.index({ type: 1 });

module.exports = mongoose.model('Chat', chatSchema); 
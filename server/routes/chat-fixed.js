const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Worker = require('../models/Worker');
const User = require('../models/User');
const workerAuth = require('../middleware/auth').workerAuth;
const adminAuth = require('../middleware/auth').adminAuth;

// Helper function to authenticate user
const authenticateUser = async (token) => {
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    
    // Try to find worker first
    let currentUser = await Worker.findById(decoded.workerId);
    if (currentUser) {
      return { currentUser, userModel: 'Worker' };
    }
    
    // Try to find admin - check both userId and id (for admin tokens)
    currentUser = await User.findById(decoded.userId || decoded.id);
    if (currentUser) {
      return { currentUser, userModel: 'User' };
    }
    
    // Handle admin authentication without database user
    if (decoded.id === 'admin' && decoded.username === 'admin') {
      currentUser = {
        _id: 'admin',
        name: 'Admin',
        role: 'admin'
      };
      return { currentUser, userModel: 'Admin' };
    }
    
    return { currentUser: null, userModel: null };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// @route   GET /api/chat/group
// @desc    Get or create group chat for workers and admin
// @access  Private (Worker & Admin)
router.get('/group', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { currentUser, userModel } = await authenticateUser(token);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Find existing group chat
    let groupChat = await Chat.findOne({ type: 'group', isActive: true });
    
    if (!groupChat) {
      // Create new group chat
      const allWorkers = await Worker.find({ isActive: true });
      const adminUsers = await User.find({ userType: 'admin' });
      
      const participants = [
        ...allWorkers.map(worker => ({
          userId: worker._id,
          participantModel: 'Worker',
          role: 'worker'
        })),
        ...adminUsers.map(admin => ({
          userId: admin._id,
          participantModel: 'User',
          role: 'admin'
        }))
      ];
      
      // Add admin user if no admin users exist in database
      if (adminUsers.length === 0 && currentUser._id === 'admin') {
        participants.push({
          userId: 'admin',
          participantModel: 'Admin',
          role: 'admin'
        });
      }
      
      groupChat = new Chat({
        type: 'group',
        name: 'SwiftWash Team Chat',
        participants,
        messages: []
      });
      
      await groupChat.save();
    } else {
      // Check if current user is already a participant
      const isParticipant = groupChat.participants.some(
        p => p.userId.toString() === currentUser._id.toString()
      );
      
      if (!isParticipant) {
        groupChat.participants.push({
          userId: currentUser._id,
          participantModel: userModel,
          role: userModel === 'User' ? 'admin' : 'worker'
        });
        await groupChat.save();
      }
    }
    
    // Populate sender names for messages
    await groupChat.populate('messages.sender', 'name');
    
    // Mark messages as read by current user
    const unreadMessages = groupChat.messages.filter(message => {
      const isOwnMessage = message.sender.toString() === currentUser._id.toString();
      const isReadByUser = message.readBy.some(
        read => read.userId.toString() === currentUser._id.toString()
      );
      return !isOwnMessage && !isReadByUser;
    });
    
    // Mark messages as read
    for (const message of unreadMessages) {
      message.readBy.push({
        userId: currentUser._id,
        readByModel: userModel,
        readAt: new Date()
      });
    }
    
    if (unreadMessages.length > 0) {
      await groupChat.save();
    }
    
    res.json({
      chat: groupChat,
      currentUser: {
        _id: currentUser._id,
        name: currentUser.name,
        role: userModel === 'User' ? 'admin' : 'worker'
      }
    });
  } catch (error) {
    console.error('Get group chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/group/message
// @desc    Send message to group chat
// @access  Private (Worker & Admin)
router.post('/group/message', [
  body('content').notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, messageType = 'text' } = req.body;
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { currentUser, userModel } = await authenticateUser(token);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Find group chat
    const groupChat = await Chat.findOne({ type: 'group', isActive: true });
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user is participant
    const isParticipant = groupChat.participants.some(
      p => p.userId.toString() === currentUser._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this chat' });
    }

    // Add message
    const newMessage = {
      sender: currentUser._id,
      senderModel: userModel,
      senderName: currentUser.name,
      content,
      messageType,
      timestamp: new Date(),
      isRead: false,
      readBy: []
    };

    groupChat.messages.push(newMessage);
    groupChat.lastMessage = new Date();
    await groupChat.save();

    // Populate sender info for the new message
    await groupChat.populate('messages.sender', 'name');

    res.json({
      message: 'Message sent successfully',
      chat: groupChat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chat/group/message/:messageId/read
// @desc    Mark message as read
// @access  Private (Worker & Admin)
router.put('/group/message/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { currentUser, userModel } = await authenticateUser(token);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Find group chat
    const groupChat = await Chat.findOne({ type: 'group', isActive: true });
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Find the message
    const message = groupChat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(
      read => read.userId.toString() === currentUser._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        userId: currentUser._id,
        readByModel: userModel,
        readAt: new Date()
      });
      
      await groupChat.save();
    }

    res.json({
      message: 'Message marked as read',
      chat: groupChat
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/group/unread
// @desc    Get unread message count
// @access  Private (Worker & Admin)
router.get('/group/unread', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { currentUser } = await authenticateUser(token);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Find group chat
    const groupChat = await Chat.findOne({ type: 'group', isActive: true });
    if (!groupChat) {
      return res.json({ unreadCount: 0 });
    }

    // Count unread messages (messages not sent by current user and not read by current user)
    const unreadCount = groupChat.messages.filter(message => {
      const isOwnMessage = message.sender.toString() === currentUser._id.toString();
      const isReadByUser = message.readBy.some(
        read => read.userId.toString() === currentUser._id.toString()
      );
      
      return !isOwnMessage && !isReadByUser;
    }).length;

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
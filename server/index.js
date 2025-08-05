const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const smsRoutes = require('./routes/sms');
const workerRoutes = require('./routes/workers');
const chatRoutes = require('./routes/chat');
const aiChatbotRoutes = require('./routes/ai-chatbot');
const referralRoutes = require('./routes/referrals');
const loyaltyRoutes = require('./routes/loyalty');
const promoRoutes = require('./routes/promos');
const photoRoutes = require('./routes/photos');
const phoneVerificationRoutes = require('./routes/phone-verification');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3001', // Admin app
      'http://localhost:3002' // Workers app
    ],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const chatUploadsDir = path.join(uploadsDir, 'chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, document, audio, and video files are allowed'));
    }
  }
});

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001', // Admin app
    'http://localhost:3002' // Workers app
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftwash', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// WebSocket connection handling
const connectedUsers = new Map(); // userId -> socket
const userRooms = new Map(); // userId -> room

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication and join chat room
  socket.on('authenticate', async (data) => {
    try {
      const { token, userType } = data;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = null;
      if (userType === 'worker') {
        const Worker = require('./models/Worker');
        user = await Worker.findById(decoded.workerId);
      } else {
        const User = require('./models/User');
        user = await User.findById(decoded.userId);
      }

      if (user) {
        const userId = user._id.toString();
        connectedUsers.set(userId, socket);
        userRooms.set(userId, 'group-chat');
        
        socket.userId = userId;
        socket.userType = userType;
        socket.userName = user.name;
        
        socket.join('group-chat');
        
        console.log(`User ${user.name} (${userType}) joined group chat`);
        
        // Notify others that user is online
        socket.to('group-chat').emit('userOnline', {
          userId: userId,
          userName: user.name,
          userType: userType
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authError', { message: 'Authentication failed' });
    }
  });

  // Handle new message
  socket.on('newMessage', async (data) => {
    try {
      const { content, messageType = 'text', fileUrl = null } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Save message to database
      const Chat = require('./models/Chat');
      const groupChat = await Chat.findOne({ type: 'group', isActive: true });
      
      if (!groupChat) {
        socket.emit('error', { message: 'Group chat not found' });
        return;
      }

      const newMessage = {
        sender: socket.userId,
        senderModel: socket.userType === 'worker' ? 'Worker' : 'User',
        senderName: socket.userName,
        content,
        messageType,
        fileUrl,
        timestamp: new Date(),
        isRead: false,
        readBy: []
      };

      groupChat.messages.push(newMessage);
      groupChat.lastMessage = new Date();
      await groupChat.save();

      // Broadcast message to all users in the room
      const messageData = {
        _id: newMessage._id,
        sender: {
          _id: socket.userId,
          name: socket.userName
        },
        senderName: socket.userName,
        content,
        messageType,
        fileUrl,
        timestamp: newMessage.timestamp,
        isRead: false,
        readBy: []
      };

      io.to('group-chat').emit('messageReceived', messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to('group-chat').emit('userTyping', {
      userId: socket.userId,
      userName: socket.userName,
      userType: socket.userType
    });
  });

  // Handle stop typing
  socket.on('stopTyping', () => {
    socket.to('group-chat').emit('userStopTyping', {
      userId: socket.userId,
      userName: socket.userName
    });
  });

  // Handle message read
  socket.on('messageRead', async (data) => {
    try {
      const { messageId } = data;
      
      if (!socket.userId) return;

      const Chat = require('./models/Chat');
      const groupChat = await Chat.findOne({ type: 'group', isActive: true });
      
      if (!groupChat) return;

      const message = groupChat.messages.id(messageId);
      if (message) {
        const alreadyRead = message.readBy.some(
          read => read.userId.toString() === socket.userId
        );

        if (!alreadyRead) {
          message.readBy.push({
            userId: socket.userId,
            readByModel: socket.userType === 'worker' ? 'Worker' : 'User',
            readAt: new Date()
          });
          
          await groupChat.save();
          
          // Notify message sender that message was read
          io.to('group-chat').emit('messageRead', {
            messageId,
            readBy: socket.userId
          });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      userRooms.delete(socket.userId);
      
      // Notify others that user is offline
      socket.to('group-chat').emit('userOffline', {
        userId: socket.userId,
        userName: socket.userName
      });
      
      console.log(`User ${socket.userName} disconnected`);
    }
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chatbot', aiChatbotRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/phone-verification', phoneVerificationRoutes);

// File upload route for chat
app.post('/api/chat/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SwiftWash API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`SwiftWash server running on port ${PORT}`);
}); 
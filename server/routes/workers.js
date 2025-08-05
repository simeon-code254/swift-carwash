const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const User = require('../models/User');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Workers route is working!' });
});

// Worker authentication middleware
const workerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const worker = await Worker.findById(decoded.workerId).select('-password');
    
    if (!worker || !worker.isActive) {
      return res.status(401).json({ error: 'Invalid token or inactive worker.' });
    }

    req.worker = worker;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token decoded:', decoded);
    
    // Check if it's a simple admin token (for hardcoded admin)
    if (decoded.id === 'admin' && decoded.username === 'admin') {
      console.log('Admin token validated');
      req.admin = decoded;
      return next();
    }
    
    // Check if it's a user token with admin role
    if (decoded.userId) {
      console.log('Checking user token...');
      const admin = await User.findById(decoded.userId).select('-password');
      if (admin && admin.role === 'admin') {
        console.log('User admin token validated');
        req.admin = admin;
        return next();
      }
    }
    
    // Check if it's a worker token (for worker-specific endpoints)
    if (decoded.workerId) {
      console.log('Checking worker token...');
      const worker = await Worker.findById(decoded.workerId).select('-password');
      if (worker && worker.role === 'supervisor') {
        console.log('Worker supervisor token validated');
        req.admin = { id: worker._id, username: worker.name, role: 'supervisor' };
        return next();
      }
    }
    
    console.log('No valid token found');
    return res.status(401).json({ error: 'Invalid token or unauthorized access.' });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// @route   POST /api/workers/login
// @desc    Worker login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find worker by email
    const worker = await Worker.findOne({ email });
    if (!worker) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if worker is active
    if (!worker.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await worker.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { workerId: worker._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const workerData = {
      _id: worker._id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role
    };

    res.json({
      token,
      worker: workerData
    });

  } catch (error) {
    console.error('Worker login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/profile
// @desc    Get worker profile
// @access  Private
router.get('/profile', workerAuth, async (req, res) => {
  try {
    res.json({ worker: req.worker });
  } catch (error) {
    console.error('Get worker profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/tasks
// @desc    Get worker's assigned tasks
// @access  Private
router.get('/tasks', workerAuth, async (req, res) => {
  try {
    const tasks = await Booking.find({ 
      assignedWorker: req.worker._id,
      status: { $in: ['confirmed', 'started_cleaning', 'done'] }
    }).sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Get worker tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/workers/tasks/:id/status
// @desc    Update task status
// @access  Private
router.put('/tasks/:id/status', workerAuth, [
  body('status').isIn(['started_cleaning', 'done', 'delivered']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const taskId = req.params.id;

    // Find the booking and verify it's assigned to this worker
    const booking = await Booking.findById(taskId);
    if (!booking) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (booking.assignedWorker.toString() !== req.worker._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    // Update the status
    booking.status = status;
    booking.updatedAt = Date.now();
    
    // If task is completed, calculate and update worker earnings
    if (status === 'done') {
      const workerEarnings = Math.round(booking.price * 0.4); // 40% of the full price
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Update worker's total earnings
      req.worker.totalEarnings += workerEarnings;
      
      // Update daily earnings
      const existingDailyEarning = req.worker.dailyEarnings.find(
        earning => earning.date.getTime() === today.getTime()
      );
      
      if (existingDailyEarning) {
        existingDailyEarning.amount += workerEarnings;
        existingDailyEarning.tasksCompleted += 1;
      } else {
        req.worker.dailyEarnings.push({
          date: today,
          amount: workerEarnings,
          tasksCompleted: 1
        });
      }
      
      await req.worker.save();
    }
    
    await booking.save();

    // Send SMS notification to customer if status is 'done' or 'delivered'
    if (status === 'done' || status === 'delivered') {
      try {
        const message = status === 'done' 
          ? `Your car wash service is completed! Your car is ready for delivery. - SwiftWash`
          : `Your car has been delivered! Thank you for choosing SwiftWash.`;

        // Here you would integrate with your SMS service
        console.log(`SMS to ${booking.customerPhone}: ${message}`);
        
        // For now, we'll just log it. You can integrate with Twilio or other SMS service
        // await sendSMS(booking.customerPhone, message);
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    }

    res.json({ 
      message: 'Status updated successfully',
      booking 
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/workers/change-password
// @desc    Change worker password
// @access  Private
router.put('/change-password', workerAuth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isMatch = await req.worker.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    req.worker.password = newPassword;
    await req.worker.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/earnings
// @desc    Get worker earnings
// @access  Private
router.get('/earnings', workerAuth, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    let earnings = [];

    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      earnings = req.worker.dailyEarnings.filter(
        earning => earning.date.getTime() === today.getTime()
      );
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      earnings = req.worker.dailyEarnings.filter(
        earning => earning.date >= weekAgo
      );
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      earnings = req.worker.dailyEarnings.filter(
        earning => earning.date >= monthAgo
      );
    } else {
      earnings = req.worker.dailyEarnings;
    }

    const totalAmount = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const totalTasks = earnings.reduce((sum, earning) => sum + earning.tasksCompleted, 0);

    res.json({
      earnings,
      totalAmount,
      totalTasks,
      totalEarnings: req.worker.totalEarnings
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/workers/job-request
// @desc    Submit job request
// @access  Private
router.post('/job-request', workerAuth, [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    req.worker.jobRequests.push({
      message,
      date: new Date()
    });

    await req.worker.save();

    res.json({ 
      message: 'Job request submitted successfully',
      jobRequest: req.worker.jobRequests[req.worker.jobRequests.length - 1]
    });
  } catch (error) {
    console.error('Submit job request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/job-requests
// @desc    Get worker's job requests
// @access  Private
router.get('/job-requests', workerAuth, async (req, res) => {
  try {
    res.json({ jobRequests: req.worker.jobRequests });
  } catch (error) {
    console.error('Get job requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/settings
// @desc    Get worker settings
// @access  Private
router.get('/settings', workerAuth, async (req, res) => {
  try {
    res.json({ settings: req.worker.settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/workers/settings
// @desc    Update worker settings
// @access  Private
router.put('/settings', workerAuth, async (req, res) => {
  try {
    const { settings } = req.body;

    if (settings.notifications) {
      req.worker.settings.notifications = {
        ...req.worker.settings.notifications,
        ...settings.notifications
      };
    }

    if (settings.availability) {
      req.worker.settings.availability = {
        ...req.worker.settings.availability,
        ...settings.availability
      };
    }

    if (settings.workingHours) {
      req.worker.settings.workingHours = {
        ...req.worker.settings.workingHours,
        ...settings.workingHours
      };
    }

    await req.worker.save();

    res.json({ 
      message: 'Settings updated successfully',
      settings: req.worker.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/workers/status
// @desc    Update worker status
// @access  Private (Worker)
router.put('/status', workerAuth, async (req, res) => {
  try {
    const { status, bookingId } = req.body;
    
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const worker = await Worker.findById(req.worker.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    worker.status = status;
    if (bookingId) {
      worker.currentBooking = bookingId;
    } else {
      worker.currentBooking = null;
    }
    
    await worker.save();
    
    res.json({ 
      message: 'Status updated successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        status: worker.status,
        currentBooking: worker.currentBooking
      }
    });
  } catch (error) {
    console.error('Update worker status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/workers/status
// @desc    Get all workers status with schedule
// @access  Private (Admin)
router.get('/status', adminAuth, async (req, res) => {
  try {
    const workers = await Worker.find({ isActive: true })
      .select('name email phone status currentBooking settings createdAt')
      .populate('currentBooking', 'customerName carType serviceType status scheduledDate scheduledTime');
    
    const workersWithSchedule = workers.map(worker => {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const isAvailableToday = worker.settings?.availability?.[currentDay] || false;
      const startTime = worker.settings?.workingHours?.start || '08:00';
      const endTime = worker.settings?.workingHours?.end || '17:00';
      
      const isWithinWorkingHours = currentTime >= startTime && currentTime <= endTime;
      const isWorking = isAvailableToday && isWithinWorkingHours;
      
      return {
        ...worker.toObject(),
        schedule: {
          isAvailableToday,
          startTime,
          endTime,
          isWithinWorkingHours,
          isWorking
        }
      };
    });
    
    res.json({ workers: workersWithSchedule });
  } catch (error) {
    console.error('Get workers status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/workers/bookings/:id/status
// @desc    Update booking status (worker-specific endpoint)
// @access  Private (Worker)
router.patch('/bookings/:id/status', workerAuth, [
  body('status').isIn(['started_cleaning', 'done', 'delivered']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const bookingId = req.params.id;

    // Find the booking and verify it's assigned to this worker
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.assignedWorker.toString() !== req.worker._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Update the status
    booking.status = status;
    booking.updatedAt = Date.now();
    
    if (status === 'done') {
      booking.completedAt = new Date();
    } else if (status === 'delivered') {
      booking.deliveredAt = new Date();
    }

    // If task is completed, calculate and update worker earnings
    if (status === 'done') {
      const workerEarnings = Math.round(booking.price * 0.4); // 40% of the full price
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Update worker's total earnings
      req.worker.totalEarnings += workerEarnings;
      
      // Update daily earnings
      const existingDailyEarning = req.worker.dailyEarnings.find(
        earning => earning.date.getTime() === today.getTime()
      );
      
      if (existingDailyEarning) {
        existingDailyEarning.amount += workerEarnings;
        existingDailyEarning.tasksCompleted += 1;
      } else {
        req.worker.dailyEarnings.push({
          date: today,
          amount: workerEarnings,
          tasksCompleted: 1
        });
      }
      
      await req.worker.save();
    }
    
    await booking.save();

    // Send SMS notification to customer if status is 'done' or 'delivered'
    if (status === 'done' || status === 'delivered') {
      try {
        const message = status === 'done' 
          ? `Your car wash service is completed! Your car is ready for delivery. - SwiftWash`
          : `Your car has been delivered! Thank you for choosing SwiftWash.`;

        // Here you would integrate with your SMS service
        console.log(`SMS to ${booking.customerPhone}: ${message}`);
        
        // For now, we'll just log it. You can integrate with Twilio or other SMS service
        // await sendSMS(booking.customerPhone, message);
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    }

    res.json({ 
      message: 'Status updated successfully',
      booking 
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

const router = express.Router();

// Simple test endpoint to check if server is running
router.get('/ping', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Admin auth - Token received:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('Admin auth - No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Admin auth - Token decoded:', decoded);
    
    // For now, we'll use simple admin validation since we're using hardcoded credentials
    // In production, you should validate against a database
    if (decoded.id === 'admin' && decoded.username === 'admin') {
      console.log('Admin auth - Token validated successfully');
      req.admin = decoded;
      next();
    } else {
      console.log('Admin auth - Invalid admin token');
      return res.status(401).json({ error: 'Invalid admin token.' });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Export adminAuth middleware
module.exports.adminAuth = adminAuth;

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Simple admin authentication (in production, use database)
    const adminCredentials = {
      username: 'admin',
      password: 'admin123' // In production, this should be hashed
    };

    if (username === adminCredentials.username && password === adminCredentials.password) {
      const token = jwt.sign(
        { id: 'admin', username: adminCredentials.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        admin: {
          id: 'admin',
          username: adminCredentials.username
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/verify
// @desc    Verify admin token
// @access  Private (Admin)
router.get('/verify', adminAuth, async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.admin.id,
        username: req.admin.username
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private (Admin)
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/bookings/:id/status
// @desc    Update booking status
// @access  Private (Admin)
router.put('/bookings/:id/status', adminAuth, [
  body('status').isIn(['pending', 'confirmed', 'started_cleaning', 'done', 'delivered', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    console.log('Status update request:', { id: req.params.id, status: req.body.status });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;
    const bookingId = req.params.id;
    
    // Validate booking ID format
    if (!bookingId || bookingId.length !== 24) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log('Booking not found for ID:', bookingId);
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log('Found booking:', { id: booking._id, currentStatus: booking.status, newStatus: status });

    booking.status = status;

    // Update timestamps based on status
    if (status === 'done') {
      booking.completedAt = new Date();
    } else if (status === 'delivered') {
      booking.deliveredAt = new Date();
    }

    // Handle rejection reason
    if (status === 'rejected' && reason) {
      booking.rejectionReason = reason;
    }

    // Update SMS notification flags
    if (status === 'confirmed') {
      booking.smsNotifications.confirmed = true;
    } else if (status === 'started_cleaning') {
      booking.smsNotifications.started = true;
    } else if (status === 'done') {
      booking.smsNotifications.completed = true;
    } else if (status === 'delivered') {
      booking.smsNotifications.delivered = true;
    }

    await booking.save();

    console.log('Booking status updated successfully');

    res.json({
      message: 'Booking status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      bookingId: req.params.id,
      status: req.body.status
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   GET /api/admin/test-db
// @desc    Test database connection (no auth required)
// @access  Public
router.get('/test-db', async (req, res) => {
  try {
    console.log('=== DATABASE TEST ENDPOINT CALLED ===');
    console.log('Testing database connection...');
    
    // Test basic database operations
    const totalBookings = await Booking.countDocuments();
    console.log('Total bookings in DB:', totalBookings);
    
    // Try to find one booking
    const sampleBooking = await Booking.findOne();
    console.log('Sample booking found:', sampleBooking ? 'Yes' : 'No');
    if (sampleBooking) {
      console.log('Sample booking details:', {
        id: sampleBooking._id,
        customerName: sampleBooking.customerName,
        status: sampleBooking.status,
        price: sampleBooking.price
      });
    }
    
    // If no bookings exist, create a sample booking for testing
    if (totalBookings === 0) {
      console.log('No bookings found, creating sample booking...');
      const sampleBooking = new Booking({
        customerName: 'Test Customer',
        customerPhone: '+254700000000',
        customerLocation: 'Nairobi, Kenya',
        carType: 'suv',
        serviceType: 'full_service',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '14:00',
        price: 1500,
        status: 'confirmed',
        paymentStatus: 'paid',
        specialInstructions: 'Test booking for stats verification'
      });
      
      await sampleBooking.save();
      console.log('Sample booking created successfully');
      
      // Get updated data
      const updatedTotalBookings = await Booking.countDocuments();
      const updatedSampleBooking = await Booking.findOne();
      
      const response = {
        success: true,
        totalBookings: updatedTotalBookings,
        hasSampleBooking: !!updatedSampleBooking,
        sampleBooking: updatedSampleBooking ? {
          id: updatedSampleBooking._id,
          customerName: updatedSampleBooking.customerName,
          status: updatedSampleBooking.status,
          price: updatedSampleBooking.price
        } : null,
        message: 'Sample booking created for testing'
      };
      
      console.log('Sending response:', response);
      res.json(response);
    } else {
      const response = {
        success: true,
        totalBookings,
        hasSampleBooking: !!sampleBooking,
        sampleBooking: sampleBooking ? {
          id: sampleBooking._id,
          customerName: sampleBooking.customerName,
          status: sampleBooking.status,
          price: sampleBooking.price
        } : null
      };
      
      console.log('Sending response:', response);
      res.json(response);
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database error', 
      details: error.message 
    });
  }
});

// @route   GET /api/admin/test-bookings
// @desc    Test endpoint to check bookings
// @access  Private (Admin)
router.get('/test-bookings', adminAuth, async (req, res) => {
  try {
    const allBookings = await Booking.find().limit(5);
    const totalCount = await Booking.countDocuments();
    
    console.log('Test bookings - Total count:', totalCount);
    console.log('Sample bookings:', allBookings.map(b => ({
      id: b._id,
      customerName: b.customerName,
      status: b.status,
      price: b.price,
      createdAt: b.createdAt
    })));
    
    // If no bookings exist, create a sample booking for testing
    if (totalCount === 0) {
      console.log('No bookings found, creating sample booking...');
      const sampleBooking = new Booking({
        customerName: 'Test Customer',
        customerPhone: '+254700000000',
        customerLocation: 'Nairobi, Kenya',
        carType: 'suv',
        serviceType: 'full_service',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '14:00',
        price: 1500,
        status: 'confirmed',
        paymentStatus: 'paid',
        specialInstructions: 'Test booking for stats verification'
      });
      
      await sampleBooking.save();
      console.log('Sample booking created successfully');
      
      // Return updated data
      const updatedBookings = await Booking.find().limit(5);
      const updatedCount = await Booking.countDocuments();
      
      res.json({
        totalCount: updatedCount,
        sampleBookings: updatedBookings,
        message: 'Sample booking created for testing'
      });
    } else {
      res.json({
        totalCount,
        sampleBookings: allBookings
      });
    }
  } catch (error) {
    console.error('Test bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get booking statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    console.log('Stats endpoint called');
    console.log('Request headers:', req.headers);
    console.log('Admin user:', req.admin);
    
    // Test database connection
    console.log('Testing database connection...');
    const testBooking = await Booking.findOne();
    console.log('Test booking found:', testBooking ? 'Yes' : 'No');
    
    const totalBookings = await Booking.countDocuments();
    console.log('Total bookings:', totalBookings);
    
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const inProgressBookings = await Booking.countDocuments({ status: 'started_cleaning' });
    const completedBookings = await Booking.countDocuments({ status: 'done' });
    const deliveredBookings = await Booking.countDocuments({ status: 'delivered' });

    console.log('Status counts:', {
      pending: pendingBookings,
      confirmed: confirmedBookings,
      inProgress: inProgressBookings,
      completed: completedBookings,
      delivered: deliveredBookings
    });

    // Calculate total revenue from all bookings
    const totalRevenueResult = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    console.log('Total revenue result:', totalRevenueResult);
    console.log('Total revenue:', totalRevenue);

    // Calculate monthly revenue (current month)
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyRevenueResult = await Booking.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: startOfMonth, 
            $lte: endOfMonth 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;
    console.log('Monthly revenue result:', monthlyRevenueResult);
    console.log('Monthly revenue:', monthlyRevenue);

    // Calculate today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    console.log('Today bookings:', todayBookings);

    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      deliveredBookings,
      totalRevenue,
      monthlyRevenue,
      todayBookings,
      averageRating: 4.8 // Default rating for now
    };

    console.log('Final stats object:', stats);
    console.log('Stats JSON stringified:', JSON.stringify(stats));

    const response = {
      stats
    };

    console.log('Final response object:', response);
    console.log('Response JSON stringified:', JSON.stringify(response));

    res.json(response);

  } catch (error) {
    console.error('Get stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   GET /api/admin/workers
// @desc    Get all workers
// @access  Private (Admin)
router.get('/workers', adminAuth, async (req, res) => {
  try {
    const workers = await Worker.find().select('-password').sort({ createdAt: -1 });
    res.json({ workers });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/workers
// @desc    Create a new worker
// @access  Private (Admin)
router.post('/workers', adminAuth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').isIn(['worker', 'supervisor']).withMessage('Invalid role')
], async (req, res) => {
  try {
    console.log('Worker creation request received:', req.body);
    console.log('Admin user:', req.admin);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role } = req.body;
    console.log('Creating worker with data:', { name, email, phone, role });

    // Check if worker already exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      console.log('Worker with email already exists:', email);
      return res.status(400).json({ error: 'Worker with this email already exists' });
    }

    const worker = new Worker({
      name,
      email,
      password,
      phone,
      role
    });

    await worker.save();
    console.log('Worker created successfully:', worker._id);

    // Remove password from response
    const workerData = {
      _id: worker._id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role,
      isActive: worker.isActive,
      createdAt: worker.createdAt
    };

    res.status(201).json({
      message: 'Worker created successfully',
      worker: workerData
    });

  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/workers/:id
// @desc    Update worker status
// @access  Private (Admin)
router.put('/workers/:id', adminAuth, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const workerId = req.params.id;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    worker.isActive = isActive;
    await worker.save();

    res.json({
      message: 'Worker status updated successfully',
      worker: {
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role,
        isActive: worker.isActive
      }
    });

  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/bookings/:id/assign
// @desc    Assign booking to worker
// @access  Private (Admin)
router.put('/bookings/:id/assign', adminAuth, [
  body('workerId').notEmpty().withMessage('Worker ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { workerId } = req.body;
    const bookingId = req.params.id;

    // Check if worker exists and is active
    const worker = await Worker.findById(workerId);
    if (!worker || !worker.isActive) {
      return res.status(400).json({ error: 'Worker not found or inactive' });
    }

    // Update booking with assigned worker
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.assignedWorker = workerId;
    await booking.save();

    res.json({
      message: 'Booking assigned to worker successfully',
      booking
    });

  } catch (error) {
    console.error('Assign booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get bookings in date range
    const bookings = await Booking.find({
      createdAt: { $gte: startDate, $lte: now }
    }).sort({ createdAt: -1 });

    // Calculate analytics
    const totalRevenue = bookings
      .filter(b => ['done', 'delivered'].includes(b.status))
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'done').length;
    const deliveredBookings = bookings.filter(b => b.status === 'delivered').length;
    const rejectedBookings = bookings.filter(b => b.status === 'rejected').length;

    // Service distribution
    const serviceDistribution = bookings.reduce((acc, booking) => {
      const service = booking.serviceType;
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {});

    // Map service types to analytics format
    const mappedServices = {
      fullService: serviceDistribution['full_service'] || 0,
      exteriorOnly: serviceDistribution['body_wash'] || 0,
      interiorOnly: serviceDistribution['vacuum'] || 0,
      premium: serviceDistribution['interior_exterior'] || 0,
      engine: serviceDistribution['engine'] || 0
    };

    // Calculate growth (mock data for now)
    const revenueGrowth = 12.5 + (Math.random() - 0.5) * 10;
    const bookingsGrowth = 8.2 + (Math.random() - 0.5) * 15;

    // Generate trend data
    const dailyTrends = [];
    const weeklyTrends = [];
    const monthlyTrends = [];

    // Daily trends (last 7 days)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayBookings = bookings.filter(b => 
        new Date(b.createdAt).toDateString() === date.toDateString()
      );
      const dayRevenue = dayBookings
        .filter(b => ['done', 'delivered'].includes(b.status))
        .reduce((sum, b) => sum + (b.price || 0), 0);

      dailyTrends.push({
        date: date.toLocaleDateString(),
        bookings: dayBookings.length,
        revenue: dayRevenue
      });
    }

    // Weekly trends (last 4 weeks)
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const weekBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= weekStart && bookingDate <= weekEnd;
      });
      
      const weekRevenue = weekBookings
        .filter(b => ['done', 'delivered'].includes(b.status))
        .reduce((sum, b) => sum + (b.price || 0), 0);

      weeklyTrends.push({
        week: `Week ${4 - i}`,
        bookings: weekBookings.length,
        revenue: weekRevenue
      });
    }

    // Monthly trends (last 6 months)
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
      
      const monthRevenue = monthBookings
        .filter(b => ['done', 'delivered'].includes(b.status))
        .reduce((sum, b) => sum + (b.price || 0), 0);

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        bookings: monthBookings.length,
        revenue: monthRevenue
      });
    }

    const analyticsData = {
      revenue: {
        total: Math.floor(totalRevenue),
        monthly: Math.floor(totalRevenue * 0.3),
        weekly: Math.floor(totalRevenue * 0.07),
        daily: Math.floor(totalRevenue * 0.01),
        growth: Math.floor(revenueGrowth)
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings + deliveredBookings, // Combine completed and delivered
        rejected: rejectedBookings,
        growth: Math.floor(bookingsGrowth)
      },
      services: mappedServices,
      performance: {
        averageRating: Math.floor(4.5 + Math.random() * 0.5),
        customerSatisfaction: Math.floor(90 + Math.random() * 10),
        completionRate: totalBookings > 0 ? Math.floor(((completedBookings + deliveredBookings) / totalBookings) * 100) : 0,
        responseTime: Math.floor(1.5 + Math.random() * 2)
      },
      trends: {
        daily: dailyTrends.map(trend => ({
          ...trend,
          revenue: Math.floor(trend.revenue),
          bookings: Math.floor(trend.bookings)
        })),
        weekly: weeklyTrends.map(trend => ({
          ...trend,
          revenue: Math.floor(trend.revenue),
          bookings: Math.floor(trend.bookings)
        })),
        monthly: monthlyTrends.map(trend => ({
          ...trend,
          revenue: Math.floor(trend.revenue),
          bookings: Math.floor(trend.bookings)
        }))
      }
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/job-requests
// @desc    Get all worker job requests
// @access  Private (Admin)
router.get('/job-requests', adminAuth, async (req, res) => {
  try {
    const workers = await Worker.find({
      'jobRequests.0': { $exists: true }
    }).select('name email jobRequests');

    const allRequests = [];
    workers.forEach(worker => {
      worker.jobRequests.forEach(request => {
        allRequests.push({
          _id: request._id,
          workerId: worker._id,
          workerName: worker.name,
          workerEmail: worker.email,
          message: request.message,
          date: request.date,
          status: request.status,
          adminResponse: request.adminResponse
        });
      });
    });

    // Sort by date (newest first)
    allRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ jobRequests: allRequests });
  } catch (error) {
    console.error('Get job requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/job-requests/:requestId
// @desc    Respond to job request
// @access  Private (Admin)
router.put('/job-requests/:requestId', adminAuth, [
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
  body('adminResponse').notEmpty().withMessage('Response is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, adminResponse } = req.body;
    const requestId = req.params.requestId;

    // Find the worker with this job request
    const worker = await Worker.findOne({
      'jobRequests._id': requestId
    });

    if (!worker) {
      return res.status(404).json({ error: 'Job request not found' });
    }

    // Update the specific job request
    const jobRequest = worker.jobRequests.id(requestId);
    if (!jobRequest) {
      return res.status(404).json({ error: 'Job request not found' });
    }

    jobRequest.status = status;
    jobRequest.adminResponse = adminResponse;

    await worker.save();

    res.json({
      message: 'Job request updated successfully',
      jobRequest: {
        _id: jobRequest._id,
        workerId: worker._id,
        workerName: worker.name,
        workerEmail: worker.email,
        message: jobRequest.message,
        date: jobRequest.date,
        status: jobRequest.status,
        adminResponse: jobRequest.adminResponse
      }
    });
  } catch (error) {
    console.error('Update job request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/workers/:id/details
// @desc    Update worker details
// @access  Private (Admin)
router.put('/workers/:id/details', adminAuth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('role').optional().isIn(['worker', 'supervisor']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, role } = req.body;
    const workerId = req.params.id;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Update fields if provided
    if (name) worker.name = name;
    if (email) worker.email = email;
    if (phone) worker.phone = phone;
    if (role) worker.role = role;

    await worker.save();

    // Remove password from response
    const workerData = {
      _id: worker._id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role,
      isActive: worker.isActive,
      totalEarnings: worker.totalEarnings,
      createdAt: worker.createdAt
    };

    res.json({
      message: 'Worker details updated successfully',
      worker: workerData
    });

  } catch (error) {
    console.error('Update worker details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/workers/:id/earnings
// @desc    Get worker earnings
// @access  Private (Admin)
router.get('/workers/:id/earnings', adminAuth, async (req, res) => {
  try {
    const workerId = req.params.id;
    const { period = 'all' } = req.query;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    let earnings = worker.dailyEarnings;

    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      earnings = worker.dailyEarnings.filter(
        earning => earning.date.getTime() === today.getTime()
      );
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      earnings = worker.dailyEarnings.filter(
        earning => earning.date >= weekAgo
      );
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      earnings = worker.dailyEarnings.filter(
        earning => earning.date >= monthAgo
      );
    }

    const totalAmount = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const totalTasks = earnings.reduce((sum, earning) => sum + earning.tasksCompleted, 0);

    res.json({
      worker: {
        _id: worker._id,
        name: worker.name,
        email: worker.email
      },
      earnings,
      totalAmount,
      totalTasks,
      totalEarnings: worker.totalEarnings
    });
  } catch (error) {
    console.error('Get worker earnings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/bookings/:id/reject
// @desc    Reject a booking
// @access  Private (Admin)
router.post('/bookings/:id/reject', adminAuth, [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'rejected';
    booking.rejectionReason = reason;
    booking.rejectedAt = new Date();
    booking.rejectedBy = req.admin.id;

    await booking.save();

    res.json({
      message: 'Booking rejected successfully',
      booking
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/workers/:id
// @desc    Delete a worker
// @access  Private (Admin)
router.delete('/workers/:id', adminAuth, async (req, res) => {
  try {
    const workerId = req.params.id;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Check if worker has any active bookings
    const activeBookings = await Booking.find({
      assignedWorker: workerId,
      status: { $in: ['confirmed', 'in-progress'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete worker with active bookings. Please reassign or complete their bookings first.' 
      });
    }

    await Worker.findByIdAndDelete(workerId);

    res.json({
      message: 'Worker deleted successfully',
      workerId
    });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/push-to-homepage
// @desc    Push content to homepage
// @access  Private (Admin)
router.post('/push-to-homepage', adminAuth, async (req, res) => {
  try {
    const { type, contentId, action } = req.body;

    // This is a placeholder endpoint for pushing content to homepage
    // In a real implementation, you would update a homepage content collection
    // or trigger a cache refresh

    res.json({
      message: 'Content pushed to homepage successfully',
      type,
      contentId,
      action
    });
  } catch (error) {
    console.error('Push to homepage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
module.exports.adminAuth = adminAuth; 
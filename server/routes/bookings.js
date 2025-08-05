const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { auth } = require('../middleware/auth');
const { sendSMS } = require('./sms');

// Get pricing information (must be before /:id route)
router.get('/pricing', async (req, res) => {
  try {
    const pricing = {
      saloon: {
        body_wash: 200,
        interior_exterior: 300,
        engine: 250,
        vacuum: 200,
        full_service: 1200
      },
      suv: {
        body_wash: 300,
        interior_exterior: 400,
        engine: 250,
        vacuum: 200,
        full_service: 1500
      },
      truck: {
        body_wash: 400,
        interior_exterior: 500,
        engine: 300,
        vacuum: 250,
        full_service: 1800
      }
    };
    
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings (admin)
router.get('/admin', auth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('assignedWorker', 'name phone')
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bookings by customer phone
router.get('/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { status, month, serviceType } = req.query;
    
    // Normalize phone number to handle different formats
    let normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // Generate all possible phone number variations
    const phoneVariations = [];
    
    // Original format
    phoneVariations.push(phone);
    
    // If it starts with 0, add 254 version
    if (normalizedPhone.startsWith('0')) {
      phoneVariations.push('254' + normalizedPhone.substring(1));
    }
    
    // If it starts with 254, add 0 version
    if (normalizedPhone.startsWith('254')) {
      phoneVariations.push('0' + normalizedPhone.substring(3));
    }
    
    // If it starts with 7 and is 9 digits, add 254 version
    if (normalizedPhone.startsWith('7') && normalizedPhone.length === 9) {
      phoneVariations.push('254' + normalizedPhone);
    }
    
    // If it's 9 digits starting with 7, add 0 version
    if (normalizedPhone.length === 9 && normalizedPhone.startsWith('7')) {
      phoneVariations.push('0' + normalizedPhone);
    }
    
    // If it doesn't start with 254, add it
    if (!normalizedPhone.startsWith('254')) {
      phoneVariations.push('254' + normalizedPhone);
    }
    
    // Remove duplicates
    const uniqueVariations = [...new Set(phoneVariations)];
    
    // Create query to match all phone number variations
    let query = {
      $or: uniqueVariations.map(phone => ({ customerPhone: phone }))
    };
    
    if (status) {
      query.status = status;
    }
    
    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    }
    
    if (serviceType) {
      query.serviceType = serviceType;
    }
    
    const bookings = await Booking.find(query)
      .populate('assignedWorker', 'name phone')
      .sort({ scheduledDate: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track booking by phone number (for client app)
router.get('/track/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Normalize phone number to handle different formats
    let normalizedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    // Generate all possible phone number variations
    const phoneVariations = [];
    
    // Original format
    phoneVariations.push(phoneNumber);
    
    // If it starts with 0, add 254 version
    if (normalizedPhone.startsWith('0')) {
      phoneVariations.push('254' + normalizedPhone.substring(1));
    }
    
    // If it starts with 254, add 0 version
    if (normalizedPhone.startsWith('254')) {
      phoneVariations.push('0' + normalizedPhone.substring(3));
    }
    
    // If it starts with 7 and is 9 digits, add 254 version
    if (normalizedPhone.startsWith('7') && normalizedPhone.length === 9) {
      phoneVariations.push('254' + normalizedPhone);
    }
    
    // If it's 9 digits starting with 7, add 0 version
    if (normalizedPhone.length === 9 && normalizedPhone.startsWith('7')) {
      phoneVariations.push('0' + normalizedPhone);
    }
    
    // If it doesn't start with 254, add it
    if (!normalizedPhone.startsWith('254')) {
      phoneVariations.push('254' + normalizedPhone);
    }
    
    // Remove duplicates
    const uniqueVariations = [...new Set(phoneVariations)];
    
    // Create query to match all phone number variations
    const query = {
      $or: uniqueVariations.map(phone => ({ customerPhone: phone }))
    };
    
    const bookings = await Booking.find(query)
      .populate('assignedWorker', 'name phone')
      .sort({ scheduledDate: -1 })
      .limit(10); // Get last 10 bookings
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Get booking statistics
router.get('/stats/admin', auth, async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      statusBreakdown: stats,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new booking
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerLocation,
      carType,
      serviceType,
      scheduledDate,
      scheduledTime,
      price,
      specialInstructions,
      carDetails,
      referralCode,
      loyaltyPointsRedeemed
    } = req.body;

    // Check if referral code is valid
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Find or create customer
    let customer = await User.findOne({ phone: customerPhone });
    if (!customer) {
      customer = new User({
        name: customerName,
        phone: customerPhone,
        email: `${customerPhone}@swiftwash.com`, // Temporary email
        password: Math.random().toString(36).substring(7), // Temporary password
        referredBy
      });
      await customer.save();
    }

    const booking = new Booking({
      customerName,
      customerPhone,
      customerLocation,
      carType,
      serviceType,
      scheduledDate,
      scheduledTime,
      price,
      specialInstructions,
      carDetails,
      customer: customer._id,
      loyaltyPointsEarned: 10, // 10 points per wash
      referralCreditsApplied: loyaltyPointsRedeemed || 0
    });

    await booking.save();

    // Update customer loyalty points
    if (customer) {
      customer.loyaltyPoints += 10;
      await customer.save();
    }

    // Send confirmation SMS
    await sendSMS(
      customerPhone,
      `Booking confirmed! Your ${serviceType.replace('_', ' ')} is scheduled for ${scheduledDate} at ${scheduledTime}. Location: ${customerLocation}. Booking ID: ${booking._id}`
    );

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('assignedWorker', 'name phone')
      .populate('customer', 'name phone email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Modify booking (reschedule, cancel, change location)
router.patch('/:id/modify', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { modificationType, newValue, reason } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    let oldValue = '';
    let updateData = {};

    switch (modificationType) {
      case 'reschedule':
        oldValue = `${booking.scheduledDate} at ${booking.scheduledTime}`;
        const [newDate, newTime] = newValue.split(' ');
        updateData = {
          scheduledDate: new Date(newDate),
          scheduledTime: newTime
        };
        break;
      
      case 'cancel':
        oldValue = booking.status;
        updateData = {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: req.user.userType === 'admin' ? 'admin' : 'customer'
        };
        break;
      
      case 'location_change':
        oldValue = booking.customerLocation;
        updateData = { customerLocation: newValue };
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid modification type' });
    }

    // Add modification record
    booking.modifications.push({
      type: modificationType,
      oldValue,
      newValue,
      reason,
      modifiedBy: req.user.userType === 'admin' ? 'admin' : 'customer'
    });

    // Update booking
    Object.assign(booking, updateData);
    await booking.save();

    // Send SMS notification
    await sendSMS(
      booking.customerPhone,
      `Your booking has been ${modificationType === 'cancel' ? 'cancelled' : 'modified'}. ${reason ? `Reason: ${reason}` : ''}`
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, washerId } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking feedback
    booking.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
      washerId
    };

    await booking.save();

    // Create separate feedback record
    const feedback = new Feedback({
      booking: booking._id,
      customer: booking.customer,
      washer: washerId,
      rating,
      comment,
      serviceType: booking.serviceType
    });

    await feedback.save();

    // Check if rating is low and trigger admin alert
    if (rating <= 3) {
      // TODO: Send admin notification
      console.log(`Low rating alert: Booking ${id} received ${rating} stars`);
    }

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, workerId } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    
    if (workerId) {
      booking.assignedWorker = workerId;
    }

    if (status === 'done') {
      booking.completedAt = new Date();
    } else if (status === 'delivered') {
      booking.deliveredAt = new Date();
    }

    await booking.save();

    // Send SMS notification
    const statusMessages = {
      confirmed: 'Your booking has been confirmed!',
      started_cleaning: 'Your car wash has started!',
      done: 'Your car wash is complete!',
      delivered: 'Your car has been delivered!'
    };

    if (statusMessages[status]) {
      await sendSMS(booking.customerPhone, statusMessages[status]);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
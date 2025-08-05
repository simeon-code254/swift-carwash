const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const PhoneVerification = require('../models/PhoneVerification');
const User = require('../models/User');
const { sendSMS } = require('./sms');
const jwt = require('jsonwebtoken');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   POST /api/phone-verification/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', [
  body('phone').matches(/^254\d{9}$/).withMessage('Phone number must be in format 254XXXXXXXXX')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    // Check if user exists or if there are bookings for this phone number
    const user = await User.findOne({ phone });
    const Booking = require('../models/Booking');
    
    // Normalize phone number to handle different formats
    let normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // If it starts with 0, replace with 254
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    }
    
    // If it starts with 7 and is 9 digits, add 254
    if (normalizedPhone.startsWith('7') && normalizedPhone.length === 9) {
      normalizedPhone = '254' + normalizedPhone;
    }
    
    // If it doesn't start with 254, add it
    if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = '254' + normalizedPhone;
    }
    
    // Create query to match both original and normalized phone numbers
    const bookingQuery = {
      $or: [
        { customerPhone: phone }, // Original format
        { customerPhone: normalizedPhone }, // Normalized format
        { customerPhone: phone.replace(/^254/, '0') }, // Convert 254 to 0
        { customerPhone: phone.replace(/^0/, '254') } // Convert 0 to 254
      ]
    };
    
    const bookings = await Booking.find(bookingQuery).limit(1);
    
    if (!user && bookings.length === 0) {
      return res.status(404).json({ error: 'No account or bookings found with this phone number' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const verification = new PhoneVerification({
      phone,
      otp,
      expiresAt
    });

    await verification.save();

    // Send SMS with OTP
    const message = `Your SwiftWash verification code is: ${otp}. Valid for 10 minutes.`;
    const smsResult = await sendSMS(phone, message);

    if (smsResult.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully',
        phone: phone.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1***$3$4') // Mask phone number
      });
    } else {
      // Delete the verification record if SMS failed
      await PhoneVerification.findByIdAndDelete(verification._id);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/phone-verification/verify-otp
// @desc    Verify OTP and login user
// @access  Public
router.post('/verify-otp', [
  body('phone').matches(/^254\d{9}$/).withMessage('Phone number must be in format 254XXXXXXXXX'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, otp } = req.body;

    // Find the most recent valid OTP for this phone
    const verification = await PhoneVerification.findOne({
      phone,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check if attempts exceeded
    if (verification.attempts >= verification.maxAttempts) {
      return res.status(400).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    // Increment attempts
    await verification.incrementAttempts();

    // Mark OTP as used
    await verification.markAsUsed();

    // Find user or check for bookings
    const user = await User.findOne({ phone });
    const Booking = require('../models/Booking');
    
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
    const bookingQuery = {
      $or: uniqueVariations.map(phone => ({ customerPhone: phone }))
    };
    
    const bookings = await Booking.find(bookingQuery).limit(1);
    
    if (!user && bookings.length === 0) {
      return res.status(404).json({ error: 'No account or bookings found' });
    }

    let token = null;
    let userData = null;

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      token = generateToken(user._id);
      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType
      };
    } else {
      // Create a temporary user data for bookings-only access
      userData = {
        id: null,
        name: 'Guest User',
        email: null,
        phone: phone,
        userType: 'guest'
      };
    }

    res.json({
      success: true,
      message: 'Phone verification successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/phone-verification/resend-otp
// @desc    Resend OTP to phone number
// @access  Public
router.post('/resend-otp', [
  body('phone').matches(/^254\d{9}$/).withMessage('Phone number must be in format 254XXXXXXXXX')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    // Check if user exists or if there are bookings for this phone number
    const user = await User.findOne({ phone });
    const Booking = require('../models/Booking');
    
    // Normalize phone number to handle different formats
    let normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // If it starts with 0, replace with 254
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    }
    
    // If it starts with 7 and is 9 digits, add 254
    if (normalizedPhone.startsWith('7') && normalizedPhone.length === 9) {
      normalizedPhone = '254' + normalizedPhone;
    }
    
    // If it doesn't start with 254, add it
    if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = '254' + normalizedPhone;
    }
    
    // Create query to match both original and normalized phone numbers
    const bookingQuery = {
      $or: [
        { customerPhone: phone }, // Original format
        { customerPhone: normalizedPhone }, // Normalized format
        { customerPhone: phone.replace(/^254/, '0') }, // Convert 254 to 0
        { customerPhone: phone.replace(/^0/, '254') } // Convert 0 to 254
      ]
    };
    
    const bookings = await Booking.find(bookingQuery).limit(1);
    
    if (!user && bookings.length === 0) {
      return res.status(404).json({ error: 'No account or bookings found with this phone number' });
    }

    // Check if there's a recent OTP (within 1 minute)
    const recentOTP = await PhoneVerification.findOne({
      phone,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // 1 minute ago
    });

    if (recentOTP) {
      return res.status(429).json({ 
        error: 'Please wait 1 minute before requesting another OTP' 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save new OTP
    const verification = new PhoneVerification({
      phone,
      otp,
      expiresAt
    });

    await verification.save();

    // Send SMS with new OTP
    const message = `Your SwiftWash verification code is: ${otp}. Valid for 10 minutes.`;
    const smsResult = await sendSMS(phone, message);

    if (smsResult.success) {
      res.json({
        success: true,
        message: 'New OTP sent successfully',
        phone: phone.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1***$3$4')
      });
    } else {
      // Delete the verification record if SMS failed
      await PhoneVerification.findByIdAndDelete(verification._id);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/phone-verification/debug/bookings
// @desc    Debug endpoint to check bookings (remove in production)
// @access  Public
router.get('/debug/bookings', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({}).limit(10);
    
    res.json({
      totalBookings: await Booking.countDocuments(),
      sampleBookings: bookings.map(b => ({
        id: b._id,
        customerPhone: b.customerPhone,
        customerName: b.customerName,
        serviceType: b.serviceType,
        status: b.status,
        scheduledDate: b.scheduledDate
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
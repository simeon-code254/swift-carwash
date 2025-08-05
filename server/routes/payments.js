const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');

const router = express.Router();

// Mock M-PESA integration
const mockMpesaPayment = async (phoneNumber, amount, bookingId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock success/failure (90% success rate)
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    return {
      success: true,
      transactionId: `MPESA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Payment successful'
    };
  } else {
    return {
      success: false,
      message: 'Payment failed - insufficient funds'
    };
  }
};

// @route   POST /api/payments/initiate
// @desc    Initiate M-PESA payment
// @access  Private
router.post('/initiate', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('phoneNumber').matches(/^254\d{9}$/).withMessage('Phone number must be in format 254XXXXXXXXX')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, phoneNumber } = req.body;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if payment is already made
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Initiate M-PESA payment
    const paymentResult = await mockMpesaPayment(phoneNumber, booking.price, bookingId);

    if (paymentResult.success) {
      // Update booking payment status
      booking.paymentStatus = 'paid';
      booking.transactionId = paymentResult.transactionId;
      await booking.save();

      res.json({
        success: true,
        message: 'Payment successful',
        transactionId: paymentResult.transactionId,
        amount: booking.price,
        booking: {
          id: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      });
    } else {
      // Update booking payment status
      booking.paymentStatus = 'failed';
      await booking.save();

      res.status(400).json({
        success: false,
        message: paymentResult.message,
        booking: {
          id: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Server error during payment' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment status
// @access  Private
router.post('/verify', auth, [
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId } = req.body;

    // Find booking by transaction ID
    const booking = await Booking.findOne({ transactionId });
    if (!booking) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      transactionId: booking.transactionId,
      amount: booking.price,
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// @route   GET /api/payments/receipt/:bookingId
// @desc    Generate payment receipt
// @access  Private
router.get('/receipt/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate receipt data
    const receipt = {
      receiptNumber: `SW-${booking._id.toString().slice(-8).toUpperCase()}`,
      date: booking.createdAt,
      customerName: booking.user.name,
      customerPhone: booking.user.phone,
      customerEmail: booking.user.email,
      serviceDetails: {
        carType: booking.carType,
        washType: booking.washType,
        location: booking.location,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime
      },
      paymentDetails: {
        amount: booking.price,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        paymentStatus: booking.paymentStatus,
        paidAt: booking.paymentStatus === 'paid' ? booking.updatedAt : null
      },
      bookingStatus: booking.status,
      specialInstructions: booking.specialInstructions
    };

    res.json({
      success: true,
      receipt
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    res.status(500).json({ error: 'Server error during receipt generation' });
  }
});

// @route   POST /api/payments/refund
// @desc    Request refund (admin only)
// @access  Admin
router.post('/refund', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, reason } = req.body;

    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if payment was made
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'No payment to refund' });
    }

    // Mock refund process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update booking
    booking.paymentStatus = 'refunded';
    await booking.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundAmount: booking.price,
      booking: {
        id: booking._id,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Server error during refund' });
  }
});

module.exports = router; 
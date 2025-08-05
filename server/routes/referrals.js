const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

// Get user's referral code
router.get('/my-code', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      referralCode: user.referralCode,
      referralCredits: user.referralCredits,
      totalReferrals: await User.countDocuments({ referredBy: user._id })
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate referral code
router.post('/validate', async (req, res) => {
  try {
    const { referralCode } = req.body;
    
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(400).json({ message: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrerName: referrer.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get referred users
    const referredUsers = await User.find({ referredBy: user._id })
      .select('name phone createdAt');

    // Get successful referrals (users who completed at least 1 wash)
    const successfulReferrals = await Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $match: {
          'customer.referredBy': user._id,
          status: { $in: ['done', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$customer._id',
          customerName: { $first: '$customer.name' },
          customerPhone: { $first: '$customer.phone' },
          completedWashes: { $sum: 1 }
        }
      }
    ]);

    res.json({
      referralCode: user.referralCode,
      referralCredits: user.referralCredits,
      totalReferrals: referredUsers.length,
      successfulReferrals: successfulReferrals.length,
      referredUsers,
      successfulReferrals
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process referral credit (called when referred user completes first wash)
router.post('/process-credit', async (req, res) => {
  try {
    const { customerId, bookingId } = req.body;

    const customer = await User.findById(customerId);
    if (!customer || !customer.referredBy) {
      return res.status(400).json({ message: 'Invalid customer or no referrer' });
    }

    // Check if this is the customer's first completed wash
    const completedWashes = await Booking.countDocuments({
      customer: customerId,
      status: { $in: ['done', 'delivered'] }
    });

    if (completedWashes > 1) {
      return res.json({ message: 'Credit already processed for this customer' });
    }

    // Add credit to referrer
    const referrer = await User.findById(customer.referredBy);
    if (referrer) {
      referrer.referralCredits += 200; // Ksh 200 credit
      await referrer.save();
    }

    res.json({ message: 'Referral credit processed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
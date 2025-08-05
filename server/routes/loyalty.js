const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

// Get user's loyalty information
router.get('/my-points', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate points needed for next reward
    const pointsNeeded = 100 - (user.loyaltyPoints % 100);
    const rewardsEarned = Math.floor(user.loyaltyPoints / 100);

    res.json({
      loyaltyPoints: user.loyaltyPoints,
      walletBalance: user.walletBalance,
      pointsNeeded,
      rewardsEarned,
      canRedeem: user.loyaltyPoints >= 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Redeem loyalty points
router.post('/redeem', auth, async (req, res) => {
  try {
    const { pointsToRedeem } = req.body;
    
    if (pointsToRedeem < 100) {
      return res.status(400).json({ message: 'Minimum 100 points required for redemption' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.loyaltyPoints < pointsToRedeem) {
      return res.status(400).json({ message: 'Insufficient loyalty points' });
    }

    // Calculate reward amount (100 points = Ksh 300)
    const rewardAmount = Math.floor(pointsToRedeem / 100) * 300;
    const pointsUsed = Math.floor(pointsToRedeem / 100) * 100;

    // Update user
    user.loyaltyPoints -= pointsUsed;
    user.walletBalance += rewardAmount;
    await user.save();

    res.json({
      message: 'Points redeemed successfully',
      pointsRedeemed: pointsUsed,
      rewardAmount,
      newBalance: user.loyaltyPoints,
      newWalletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get loyalty history
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get bookings with loyalty points earned
    const bookings = await Booking.find({ customer: user._id })
      .select('serviceType scheduledDate price loyaltyPointsEarned status')
      .sort({ scheduledDate: -1 });

    res.json({
      totalPoints: user.loyaltyPoints,
      totalWashes: bookings.length,
      completedWashes: bookings.filter(b => ['done', 'delivered'].includes(b.status)).length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply wallet credit to booking
router.post('/apply-credit', auth, async (req, res) => {
  try {
    const { bookingId, creditAmount } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.walletBalance < creditAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Apply credit to booking
    booking.referralCreditsApplied = creditAmount;
    user.walletBalance -= creditAmount;
    
    await booking.save();
    await user.save();

    res.json({
      message: 'Credit applied successfully',
      newWalletBalance: user.walletBalance,
      bookingPrice: booking.price - creditAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
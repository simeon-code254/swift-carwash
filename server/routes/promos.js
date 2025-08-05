const express = require('express');
const router = express.Router();
const PromoBanner = require('../models/PromoBanner');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('./admin');

// Get active promo banners for client app
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const banners = await PromoBanner.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ priority: -1, createdAt: -1 });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all promo banners (admin)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const banners = await PromoBanner.find()
      .sort({ createdAt: -1 });

    // Transform banners to include admin info for admin-created banners
    const transformedBanners = banners.map(banner => {
      const bannerObj = banner.toObject();
      if (!bannerObj.createdBy) {
        bannerObj.createdBy = { name: 'Admin' };
      }
      return bannerObj;
    });

    res.json(transformedBanners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new promo banner (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      actionUrl,
      actionText,
      discountCode,
      discountAmount,
      discountType,
      startDate,
      endDate,
      priority,
      targetAudience
    } = req.body;

    const banner = new PromoBanner({
      title,
      description,
      imageUrl,
      actionUrl,
      actionText,
      discountCode,
      discountAmount,
      discountType,
      startDate,
      endDate,
      priority,
      targetAudience,
      createdBy: null // Admin-created banners don't need user reference
    });

    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update promo banner (admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const banner = await PromoBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    Object.assign(banner, req.body);
    await banner.save();

    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete promo banner (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const banner = await PromoBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await banner.remove();
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle banner active status (admin)
router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const banner = await PromoBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
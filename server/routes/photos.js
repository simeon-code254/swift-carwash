const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload photos for a booking (worker)
router.post('/upload/:bookingId', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { photoType } = req.body; // 'before' or 'after'
    
    if (!['before', 'after'].includes(photoType)) {
      return res.status(400).json({ message: 'Invalid photo type' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if worker is assigned to this booking
    if (booking.assignedWorker.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to upload photos for this booking' });
    }

    const uploadedPhotos = [];

    // Upload each photo to Cloudinary
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `swiftwash/${bookingId}/${photoType}`,
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(file.buffer);
      });

      uploadedPhotos.push({
        url: result.secure_url,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      });
    }

    // Add photos to booking
    booking.photos[photoType].push(...uploadedPhotos);
    await booking.save();

    res.json({
      message: 'Photos uploaded successfully',
      photos: uploadedPhotos
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get photos for a booking
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('photos.before.uploadedBy', 'name')
      .populate('photos.after.uploadedBy', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      before: booking.photos.before,
      after: booking.photos.after
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete photo (admin/worker)
router.delete('/:bookingId/:photoId', auth, async (req, res) => {
  try {
    const { bookingId, photoId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Find and remove photo from both before and after arrays
    let photoRemoved = false;
    
    ['before', 'after'].forEach(type => {
      const photoIndex = booking.photos[type].findIndex(
        photo => photo._id.toString() === photoId
      );
      
      if (photoIndex !== -1) {
        booking.photos[type].splice(photoIndex, 1);
        photoRemoved = true;
      }
    });

    if (!photoRemoved) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    await booking.save();
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all photos for admin dashboard
router.get('/admin/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const bookings = await Booking.find({
      $or: [
        { 'photos.before': { $exists: true, $ne: [] } },
        { 'photos.after': { $exists: true, $ne: [] } }
      ]
    })
    .populate('customer', 'name phone')
    .populate('assignedWorker', 'name')
    .populate('photos.before.uploadedBy', 'name')
    .populate('photos.after.uploadedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Booking.countDocuments({
      $or: [
        { 'photos.before': { $exists: true, $ne: [] } },
        { 'photos.after': { $exists: true, $ne: [] } }
      ]
    });

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
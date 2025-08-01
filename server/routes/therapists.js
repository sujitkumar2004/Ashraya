import express from 'express';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/therapists
// @desc    Get all active therapists
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      specialization,
      search 
    } = req.query;

    let filter = { 
      role: 'therapist', 
      isActive: true 
    };

    if (specialization) {
      filter['profile.specialization'] = { $regex: specialization, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'profile.specialization': { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } }
      ];
    }

    const therapists = await User.find(filter)
      .select('name email profile createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get booking stats for each therapist
    const therapistsWithStats = await Promise.all(
      therapists.map(async (therapist) => {
        const completedBookings = await Booking.countDocuments({
          therapist: therapist._id,
          status: 'completed'
        });

        const averageRating = await Booking.aggregate([
          {
            $match: {
              therapist: therapist._id,
              'feedback.patientRating': { $exists: true }
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$feedback.patientRating' },
              ratingCount: { $sum: 1 }
            }
          }
        ]);

        return {
          ...therapist.toObject(),
          stats: {
            completedSessions: completedBookings,
            averageRating: averageRating[0]?.avgRating || 0,
            ratingCount: averageRating[0]?.ratingCount || 0
          }
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      therapists: therapistsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTherapists: total
      }
    });
  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch therapists',
      error: error.message 
    });
  }
});

// @route   GET /api/therapists/:id
// @desc    Get single therapist profile
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const therapist = await User.findOne({
      _id: req.params.id,
      role: 'therapist',
      isActive: true
    }).select('name email profile createdAt');

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    // Get therapist stats
    const [completedBookings, ratingStats] = await Promise.all([
      Booking.countDocuments({
        therapist: therapist._id,
        status: 'completed'
      }),
      Booking.aggregate([
        {
          $match: {
            therapist: therapist._id,
            'feedback.patientRating': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$feedback.patientRating' },
            ratingCount: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get availability for the next 7 days
    const availability = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const bookedSlots = await Booking.find({
        therapist: therapist._id,
        appointmentDate: date,
        status: { $in: ['scheduled', 'confirmed'] }
      }).select('appointmentTime');

      const bookedTimes = bookedSlots.map(booking => booking.appointmentTime);
      
      // Generate available slots (9 AM to 6 PM)
      const availableSlots = [];
      for (let hour = 9; hour < 18; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        if (!bookedTimes.includes(timeSlot)) {
          availableSlots.push(timeSlot);
        }
      }

      availability.push({
        date: date.toISOString().split('T')[0],
        availableSlots,
        bookedSlots: bookedTimes
      });
    }

    const therapistWithStats = {
      ...therapist.toObject(),
      stats: {
        completedSessions: completedBookings,
        averageRating: ratingStats[0]?.avgRating || 0,
        ratingCount: ratingStats[0]?.ratingCount || 0
      },
      availability
    };

    res.json({ therapist: therapistWithStats });
  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch therapist',
      error: error.message 
    });
  }
});

// @route   GET /api/therapists/:id/reviews
// @desc    Get therapist reviews
// @access  Private
router.get('/:id/reviews', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Booking.find({
      therapist: req.params.id,
      'feedback.patientRating': { $exists: true },
      'feedback.patientFeedback': { $exists: true, $ne: '' }
    })
      .populate('patient', 'name')
      .select('feedback appointmentDate')
      .sort({ 'feedback.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments({
      therapist: req.params.id,
      'feedback.patientRating': { $exists: true }
    });

    const formattedReviews = reviews.map(booking => ({
      id: booking._id,
      patientName: booking.patient.name,
      rating: booking.feedback.patientRating,
      feedback: booking.feedback.patientFeedback,
      sessionDate: booking.appointmentDate
    }));

    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get therapist reviews error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch therapist reviews',
      error: error.message 
    });
  }
});

// @route   PUT /api/therapists/profile
// @desc    Update therapist profile
// @access  Private (Therapists only)
router.put('/profile', authenticate, authorize('therapist'), async (req, res) => {
  try {
    const { bio, specialization, phone, location } = req.body;
    
    const therapist = await User.findById(req.user.userId);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    // Update profile fields
    if (bio !== undefined) therapist.profile.bio = bio;
    if (specialization !== undefined) therapist.profile.specialization = specialization;
    if (phone !== undefined) therapist.profile.phone = phone;
    if (location !== undefined) therapist.profile.location = location;

    await therapist.save();

    res.json({
      message: 'Profile updated successfully',
      profile: therapist.profile
    });
  } catch (error) {
    console.error('Update therapist profile error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// @route   GET /api/therapists/dashboard/stats
// @desc    Get therapist dashboard statistics
// @access  Private (Therapists only)
router.get('/dashboard/stats', authenticate, authorize('therapist'), async (req, res) => {
  try {
    const therapistId = req.user.userId;

    const [
      totalBookings,
      completedBookings,
      upcomingBookings,
      cancelledBookings,
      averageRating
    ] = await Promise.all([
      Booking.countDocuments({ therapist: therapistId }),
      Booking.countDocuments({ therapist: therapistId, status: 'completed' }),
      Booking.countDocuments({ 
        therapist: therapistId, 
        status: { $in: ['scheduled', 'confirmed'] },
        appointmentDate: { $gte: new Date() }
      }),
      Booking.countDocuments({ therapist: therapistId, status: 'cancelled' }),
      Booking.aggregate([
        {
          $match: {
            therapist: therapistId,
            'feedback.patientRating': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$feedback.patientRating' },
            ratingCount: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find({ therapist: therapistId })
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('patient appointmentDate appointmentTime status sessionType');

    res.json({
      stats: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings,
        averageRating: averageRating[0]?.avgRating || 0,
        ratingCount: averageRating[0]?.ratingCount || 0
      },
      recentBookings
    });
  } catch (error) {
    console.error('Get therapist stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch therapist statistics',
      error: error.message 
    });
  }
});

export default router;
import express from 'express';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBooking } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const isTherapist = req.user.role === 'therapist';
    
    let filter = {};
    filter[isTherapist ? 'therapist' : 'patient'] = req.user.userId;
    
    if (status) {
      filter.status = status;
    }
    
    if (upcoming === 'true') {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = { $in: ['scheduled', 'confirmed'] };
    }

    const bookings = await Booking.find(filter)
      .populate('patient', 'name email profile.phone')
      .populate('therapist', 'name email profile.specialization profile.phone')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookings',
      error: error.message 
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('patient', 'name email profile')
      .populate('therapist', 'name email profile');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is involved in this booking
    const isInvolved = booking.patient._id.toString() === req.user.userId ||
                      booking.therapist._id.toString() === req.user.userId ||
                      req.user.role === 'admin';

    if (!isInvolved) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch booking',
      error: error.message 
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Patients only)
router.post('/', authenticate, authorize('patient'), validateBooking, async (req, res) => {
  try {
    const { therapist, appointmentDate, appointmentTime, sessionType, duration, notes } = req.body;

    // Verify therapist exists and is active
    const therapistUser = await User.findById(therapist);
    if (!therapistUser || therapistUser.role !== 'therapist' || !therapistUser.isActive) {
      return res.status(400).json({ message: 'Invalid therapist selected' });
    }

    // Check for conflicts
    const existingBooking = await Booking.checkAvailability(therapist, appointmentDate, appointmentTime);
    if (existingBooking) {
      return res.status(409).json({ 
        message: 'This time slot is already booked. Please choose another time.' 
      });
    }

    // Create booking
    const booking = new Booking({
      patient: req.user.userId,
      therapist,
      appointmentDate,
      appointmentTime,
      sessionType,
      duration: duration || 60,
      notes: {
        patient: notes
      }
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('patient', 'name email')
      .populate('therapist', 'name email profile.specialization');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      message: 'Failed to create booking',
      error: error.message 
    });
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm a booking (Therapists only)
// @access  Private
router.put('/:id/confirm', authenticate, authorize('therapist'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.therapist.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'scheduled') {
      return res.status(400).json({ 
        message: 'Only scheduled bookings can be confirmed' 
      });
    }

    const { sessionDetails } = req.body;

    booking.status = 'confirmed';
    if (sessionDetails) {
      booking.sessionDetails = { ...booking.sessionDetails, ...sessionDetails };
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('patient', 'name email')
      .populate('therapist', 'name email profile.specialization');

    res.json({
      message: 'Booking confirmed successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ 
      message: 'Failed to confirm booking',
      error: error.message 
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can cancel this booking
    const canCancel = booking.patient.toString() === req.user.userId ||
                     booking.therapist.toString() === req.user.userId ||
                     req.user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'This booking cannot be cancelled' 
      });
    }

    await booking.cancel(req.user.userId, reason);

    const populatedBooking = await Booking.findById(booking._id)
      .populate('patient', 'name email')
      .populate('therapist', 'name email profile.specialization');

    res.json({
      message: 'Booking cancelled successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      message: 'Failed to cancel booking',
      error: error.message 
    });
  }
});

// @route   PUT /api/bookings/:id/complete
// @desc    Mark booking as completed (Therapists only)
// @access  Private
router.put('/:id/complete', authenticate, authorize('therapist'), async (req, res) => {
  try {
    const { therapistNotes, followUpRecommended } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.therapist.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Only confirmed bookings can be completed' 
      });
    }

    await booking.complete(therapistNotes, followUpRecommended);

    res.json({
      message: 'Booking completed successfully',
      booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ 
      message: 'Failed to complete booking',
      error: error.message 
    });
  }
});

// @route   POST /api/bookings/:id/feedback
// @desc    Add patient feedback
// @access  Private
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Can only provide feedback for completed sessions' 
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    await booking.addPatientFeedback(rating, feedback);

    res.json({
      message: 'Feedback added successfully',
      booking
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ 
      message: 'Failed to add feedback',
      error: error.message 
    });
  }
});

// @route   GET /api/bookings/availability/:therapistId
// @desc    Check therapist availability
// @access  Private
router.get('/availability/:therapistId', authenticate, async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Verify therapist exists
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      therapist: therapistId,
      appointmentDate: new Date(date),
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('appointmentTime');

    const bookedSlots = existingBookings.map(booking => booking.appointmentTime);

    // Generate available time slots (9 AM to 6 PM, hourly)
    const availableSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      if (!bookedSlots.includes(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }

    res.json({
      date,
      availableSlots,
      bookedSlots
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ 
      message: 'Failed to check availability',
      error: error.message 
    });
  }
});

export default router;
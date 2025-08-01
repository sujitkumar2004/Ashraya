import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's full profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -resetPasswordToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile',
      error: error.message 
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, validateProfileUpdate, async (req, res) => {
  try {
    const { name, profile, preferences } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(user._id)
      .select('-password -resetPasswordToken -emailVerificationToken');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get public user profile
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name role profile.bio profile.specialization createdAt');

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user',
      error: error.message 
    });
  }
});

// @route   GET /api/users
// @desc    Search users (for mentions, etc.)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, role, limit = 10 } = req.query;

    if (!search || search.length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters long' 
      });
    }

    let filter = {
      isActive: true,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    if (role && role !== 'all') {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('name email role profile.bio')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ 
      message: 'Failed to search users',
      error: error.message 
    });
  }
});

// @route   POST /api/users/deactivate
// @desc    Deactivate user account
// @access  Private
router.post('/deactivate', authenticate, async (req, res) => {
  try {
    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'Password is required to deactivate account' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Deactivate account
    user.isActive = false;
    user.deactivationReason = reason;
    user.deactivatedAt = new Date();

    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ 
      message: 'Failed to deactivate account',
      error: error.message 
    });
  }
});

// @route   GET /api/users/stats/dashboard
// @desc    Get user dashboard statistics
// @access  Private
router.get('/stats/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let stats = {};

    // Common stats for all users
    const user = await User.findById(userId).select('createdAt');
    stats.memberSince = user.createdAt;

    // Role-specific stats
    if (userRole === 'patient') {
      const [totalBookings, completedBookings] = await Promise.all([
        // These would be actual database queries
        // For now, returning mock data
        Promise.resolve(5),
        Promise.resolve(3)
      ]);

      stats = {
        ...stats,
        totalBookings,
        completedBookings,
        upcomingBookings: totalBookings - completedBookings
      };
    } else if (userRole === 'therapist') {
      // Therapist-specific stats would be handled in therapists route
      stats = {
        ...stats,
        totalPatients: 12,
        completedSessions: 45,
        averageRating: 4.8
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user statistics',
      error: error.message 
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { emailNotifications, smsNotifications } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences
    if (typeof emailNotifications === 'boolean') {
      user.preferences.emailNotifications = emailNotifications;
    }
    if (typeof smsNotifications === 'boolean') {
      user.preferences.smsNotifications = smsNotifications;
    }

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      message: 'Failed to update preferences',
      error: error.message 
    });
  }
});

export default router;
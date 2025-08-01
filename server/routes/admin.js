import express from 'express';
import User from '../models/User.js';
import Story from '../models/Story.js';
import Resource from '../models/Resource.js';
import Booking from '../models/Booking.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticate);
router.use(adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalStories,
      pendingStories,
      totalResources,
      pendingResources,
      totalBookings,
      completedBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Story.countDocuments(),
      Story.countDocuments({ status: 'pending' }),
      Resource.countDocuments(),
      Resource.countDocuments({ status: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' })
    ]);

    // Get user stats by role
    const userStats = await User.getStats();

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentStories = await Story.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name role')
      .select('title status createdAt author');

    res.json({
      statistics: {
        totalUsers,
        activeUsers,
        totalStories,
        pendingStories,
        totalResources,
        pendingResources,
        totalBookings,
        completedBookings
      },
      userStats,
      recentActivity: {
        users: recentUsers,
        stories: recentStories
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      status,
      search 
    } = req.query;

    let filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user status or role
// @access  Private (Admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.userId && isActive === false) {
      return res.status(400).json({ 
        message: 'You cannot deactivate your own account' 
      });
    }

    // Update fields if provided
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    if (role && ['patient', 'caregiver', 'therapist', 'admin'].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Failed to update user',
      error: error.message 
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (soft delete by deactivating)
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        message: 'You cannot delete your own account' 
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Failed to delete user',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/stories
// @desc    Get all stories for moderation
// @access  Private (Admin only)
router.get('/stories', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending' 
    } = req.query;

    const filter = status !== 'all' ? { status } : {};

    const stories = await Story.find(filter)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Story.countDocuments(filter);

    res.json({
      stories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStories: total
      }
    });
  } catch (error) {
    console.error('Get stories for moderation error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch stories',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/stories/:id
// @desc    Moderate a story (approve/reject)
// @access  Private (Admin only)
router.put('/stories/:id', async (req, res) => {
  try {
    const { status, moderationNotes } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be either approved or rejected' 
      });
    }

    story.status = status;
    story.moderationNotes = moderationNotes;
    story.moderatedBy = req.user.userId;
    story.moderatedAt = new Date();

    await story.save();

    res.json({
      message: `Story ${status} successfully`,
      story
    });
  } catch (error) {
    console.error('Moderate story error:', error);
    res.status(500).json({ 
      message: 'Failed to moderate story',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/resources
// @desc    Get all resources for moderation
// @access  Private (Admin only)
router.get('/resources', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending' 
    } = req.query;

    const filter = status !== 'all' ? { status } : {};

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Resource.countDocuments(filter);

    res.json({
      resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResources: total
      }
    });
  } catch (error) {
    console.error('Get resources for moderation error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch resources',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/resources/:id
// @desc    Moderate a resource (approve/reject)
// @access  Private (Admin only)
router.put('/resources/:id', async (req, res) => {
  try {
    const { status, moderationNotes } = req.body;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be either approved or rejected' 
      });
    }

    resource.status = status;
    resource.moderationNotes = moderationNotes;
    resource.moderatedBy = req.user.userId;
    resource.moderatedAt = new Date();

    await resource.save();

    res.json({
      message: `Resource ${status} successfully`,
      resource
    });
  } catch (error) {
    console.error('Moderate resource error:', error);
    res.status(500).json({ 
      message: 'Failed to moderate resource',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private (Admin only)
router.get('/bookings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      therapistId,
      patientId 
    } = req.query;

    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (therapistId) {
      filter.therapist = therapistId;
    }

    if (patientId) {
      filter.patient = patientId;
    }

    const bookings = await Booking.find(filter)
      .populate('patient', 'name email')
      .populate('therapist', 'name email profile.specialization')
      .sort({ appointmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookings',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // User growth analytics
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Story engagement analytics
    const storyEngagement = await Story.aggregate([
      {
        $match: {
          status: 'approved',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalStories: { $sum: 1 },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    // Resource usage analytics
    const resourceUsage = await Resource.aggregate([
      {
        $match: {
          status: 'approved',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    // Booking analytics
    const bookingAnalytics = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      period,
      dateRange: { startDate, endDate },
      analytics: {
        userGrowth,
        storyEngagement: storyEngagement[0] || {},
        resourceUsage,
        bookingAnalytics
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      error: error.message 
    });
  }
});

export default router;
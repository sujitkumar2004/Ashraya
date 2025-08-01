import express from 'express';
import Resource from '../models/Resource.js';
import { authenticate, authorize, adminOnly } from '../middleware/auth.js';
import { validateResource } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/resources
// @desc    Get all approved resources
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      type,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    let filter = { 
      status: 'approved',
      isActive: true
    };

    // Apply filters
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    let resources;

    if (search) {
      resources = await Resource.search(search, category !== 'all' ? category : null, type !== 'all' ? type : null)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      const sortOrder = order === 'desc' ? -1 : 1;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      resources = await Resource.find(filter)
        .populate('uploadedBy', 'name role')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await Resource.countDocuments(filter);

    res.json({
      resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResources: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch resources',
      error: error.message 
    });
  }
});

// @route   GET /api/resources/:id
// @desc    Get single resource
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'name role profile.bio')
      .populate('ratings.user', 'name role');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user can view this resource
    if (resource.status !== 'approved' && 
        resource.uploadedBy._id.toString() !== req.user.userId && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    if (resource.status === 'approved') {
      await resource.incrementViews();
    }

    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch resource',
      error: error.message 
    });
  }
});

// @route   POST /api/resources
// @desc    Upload a new resource
// @access  Private (Therapists and Admins only)
router.post('/', authenticate, authorize('therapist', 'admin'), validateResource, async (req, res) => {
  try {
    const { title, description, category, type, url, tags, fileSize, mimeType } = req.body;

    const resource = new Resource({
      title,
      description,
      category,
      type,
      url,
      tags: tags || [],
      fileSize,
      mimeType,
      uploadedBy: req.user.userId
    });

    await resource.save();

    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name role');

    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource: populatedResource
    });
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ 
      message: 'Failed to upload resource',
      error: error.message 
    });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update a resource
// @access  Private
router.put('/:id', authenticate, validateResource, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user owns the resource or is admin
    if (resource.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, category, type, url, tags } = req.body;

    // Update fields
    resource.title = title || resource.title;
    resource.description = description || resource.description;
    resource.category = category || resource.category;
    resource.type = type || resource.type;
    resource.url = url || resource.url;
    resource.tags = tags || resource.tags;

    // Reset status to pending if content changed significantly
    if (req.user.role !== 'admin' && (
        title !== resource.title || 
        description !== resource.description || 
        url !== resource.url
    )) {
      resource.status = 'pending';
    }

    await resource.save();

    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name role');

    res.json({
      message: 'Resource updated successfully',
      resource: populatedResource
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ 
      message: 'Failed to update resource',
      error: error.message 
    });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user owns the resource or is admin
    if (resource.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ 
      message: 'Failed to delete resource',
      error: error.message 
    });
  }
});

// @route   POST /api/resources/:id/download
// @desc    Record a download
// @access  Private
router.post('/:id/download', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.status !== 'approved' || !resource.isActive) {
      return res.status(403).json({ message: 'Resource not available for download' });
    }

    // Increment download count
    await resource.incrementDownloads();

    res.json({
      message: 'Download recorded',
      downloadCount: resource.downloadCount + 1,
      downloadUrl: resource.url
    });
  } catch (error) {
    console.error('Record download error:', error);
    res.status(500).json({ 
      message: 'Failed to record download',
      error: error.message 
    });
  }
});

// @route   POST /api/resources/:id/rate
// @desc    Rate a resource
// @access  Private
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.status !== 'approved') {
      return res.status(403).json({ message: 'Cannot rate unpublished resource' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    await resource.addRating(req.user.userId, rating, review);

    res.json({
      message: 'Rating added successfully',
      averageRating: resource.averageRating,
      ratingCount: resource.ratingCount
    });
  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({ 
      message: 'Failed to rate resource',
      error: error.message 
    });
  }
});

// @route   GET /api/resources/category/:category
// @desc    Get resources by category
// @access  Private
router.get('/category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const resources = await Resource.getByCategory(category, parseInt(limit));

    res.json({ resources });
  } catch (error) {
    console.error('Get resources by category error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch resources by category',
      error: error.message 
    });
  }
});

// @route   GET /api/resources/popular
// @desc    Get popular resources
// @access  Private
router.get('/popular', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const resources = await Resource.getPopular(parseInt(limit));
    
    res.json({ resources });
  } catch (error) {
    console.error('Get popular resources error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch popular resources',
      error: error.message 
    });
  }
});

// @route   GET /api/resources/user/:userId
// @desc    Get resources uploaded by user
// @access  Private
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Users can only see their own draft/pending resources
    let filter = { uploadedBy: userId };
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      filter.status = 'approved';
      filter.isActive = true;
    }

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name role')
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
    console.error('Get user resources error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user resources',
      error: error.message 
    });
  }
});

export default router;
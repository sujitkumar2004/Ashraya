import express from 'express';
import Story from '../models/Story.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateStory, validateComment } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/stories
// @desc    Get all approved stories
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { status: 'approved' };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const stories = await Story.find(filter)
      .populate('author', 'name role')
      .populate('comments.author', 'name role')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add like status for current user
    const storiesWithLikeStatus = stories.map(story => ({
      ...story,
      isLiked: story.likes.some(like => like.user.toString() === req.user.userId),
      likeCount: story.likes.length,
      commentCount: story.comments.filter(comment => !comment.isHidden).length
    }));

    const total = await Story.countDocuments(filter);

    res.json({
      stories: storiesWithLikeStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStories: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch stories',
      error: error.message 
    });
  }
});

// @route   GET /api/stories/:id
// @desc    Get single story by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'name role profile.bio')
      .populate('comments.author', 'name role');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user can view this story
    if (story.status !== 'approved' && 
        story.author._id.toString() !== req.user.userId && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    await story.incrementViews();

    // Add like status for current user
    const storyWithLikeStatus = {
      ...story.toObject(),
      isLiked: story.isLikedBy(req.user.userId),
      likeCount: story.likeCount,
      commentCount: story.commentCount
    };

    res.json({ story: storyWithLikeStatus });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch story',
      error: error.message 
    });
  }
});

// @route   POST /api/stories
// @desc    Create a new story
// @access  Private
router.post('/', authenticate, validateStory, async (req, res) => {
  try {
    const { title, content, category, tags, isAnonymous } = req.body;

    const story = new Story({
      title,
      content,
      author: req.user.userId,
      category: category || 'personal',
      tags: tags || [],
      isAnonymous: isAnonymous || false
    });

    await story.save();

    const populatedStory = await Story.findById(story._id)
      .populate('author', 'name role');

    res.status(201).json({
      message: 'Story created successfully',
      story: populatedStory
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ 
      message: 'Failed to create story',
      error: error.message 
    });
  }
});

// @route   PUT /api/stories/:id
// @desc    Update a story
// @access  Private
router.put('/:id', authenticate, validateStory, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story or is admin
    if (story.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, content, category, tags, isAnonymous } = req.body;

    // Update fields
    story.title = title || story.title;
    story.content = content || story.content;
    story.category = category || story.category;
    story.tags = tags || story.tags;
    story.isAnonymous = isAnonymous !== undefined ? isAnonymous : story.isAnonymous;

    // Reset status to pending if content changed
    if (content && content !== story.content) {
      story.status = 'pending';
    }

    await story.save();

    const populatedStory = await Story.findById(story._id)
      .populate('author', 'name role');

    res.json({
      message: 'Story updated successfully',
      story: populatedStory
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ 
      message: 'Failed to update story',
      error: error.message 
    });
  }
});

// @route   DELETE /api/stories/:id
// @desc    Delete a story
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story or is admin
    if (story.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ 
      message: 'Failed to delete story',
      error: error.message 
    });
  }
});

// @route   POST /api/stories/:id/like
// @desc    Toggle like on a story
// @access  Private
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.status !== 'approved') {
      return res.status(403).json({ message: 'Cannot like unpublished story' });
    }

    await story.toggleLike(req.user.userId);

    res.json({
      message: story.isLikedBy(req.user.userId) ? 'Story liked' : 'Story unliked',
      likeCount: story.likeCount,
      isLiked: story.isLikedBy(req.user.userId)
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ 
      message: 'Failed to toggle like',
      error: error.message 
    });
  }
});

// @route   POST /api/stories/:id/comments
// @desc    Add a comment to a story
// @access  Private
router.post('/:id/comments', authenticate, validateComment, async (req, res) => {
  try {
    const { content } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.status !== 'approved') {
      return res.status(403).json({ message: 'Cannot comment on unpublished story' });
    }

    await story.addComment(req.user.userId, content);

    const updatedStory = await Story.findById(req.params.id)
      .populate('comments.author', 'name role');

    const newComment = updatedStory.comments[updatedStory.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      message: 'Failed to add comment',
      error: error.message 
    });
  }
});

// @route   GET /api/stories/user/:userId
// @desc    Get stories by specific user
// @access  Private
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Users can only see their own drafts/pending stories
    let filter = { author: userId };
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      filter.status = 'approved';
    }

    const stories = await Story.find(filter)
      .populate('author', 'name role')
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
    console.error('Get user stories error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user stories',
      error: error.message 
    });
  }
});

// @route   GET /api/stories/trending
// @desc    Get trending stories
// @access  Private
router.get('/trending', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const stories = await Story.getTrending(parseInt(limit));
    
    res.json({ stories });
  } catch (error) {
    console.error('Get trending stories error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trending stories',
      error: error.message 
    });
  }
});

export default router;
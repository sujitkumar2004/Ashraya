import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Story content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['personal', 'medical', 'emotional', 'caregiver', 'recovery', 'other'],
    default: 'personal'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'pending'
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  viewCount: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  moderationNotes: {
    type: String,
    maxlength: [500, 'Moderation notes cannot exceed 500 characters']
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
storySchema.index({ author: 1, status: 1 });
storySchema.index({ status: 1, createdAt: -1 });
storySchema.index({ category: 1, status: 1 });
storySchema.index({ tags: 1 });

// Virtual for like count
storySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
storySchema.virtual('commentCount').get(function() {
  return this.comments.filter(comment => !comment.isHidden).length;
});

// Instance method to check if user liked the story
storySchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to toggle like
storySchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Instance method to add comment
storySchema.methods.addComment = function(userId, content) {
  this.comments.push({
    author: userId,
    content: content
  });
  return this.save();
};

// Instance method to increment view count
storySchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to get trending stories
storySchema.statics.getTrending = function(limit = 10) {
  return this.find({ status: 'approved' })
    .populate('author', 'name role')
    .sort({ 
      likeCount: -1, 
      viewCount: -1, 
      createdAt: -1 
    })
    .limit(limit);
};

// Static method to get stories by category
storySchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({ 
    status: 'approved',
    category: category
  })
    .populate('author', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

export default mongoose.model('Story', storySchema);
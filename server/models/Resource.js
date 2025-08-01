import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Resource description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['medical', 'emotional', 'financial', 'legal'],
    required: [true, 'Category is required']
  },
  type: {
    type: String,
    enum: ['pdf', 'link', 'video', 'audio', 'image'],
    required: [true, 'Resource type is required']
  },
  url: {
    type: String,
    required: [true, 'Resource URL is required']
  },
  fileSize: {
    type: Number, // in bytes
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: function() {
      return this.type !== 'link';
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'pending'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  moderationNotes: {
    type: String,
    maxlength: [500, 'Moderation notes cannot exceed 500 characters']
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  expiresAt: {
    type: Date,
    default: null // null means no expiration
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ type: 1, status: 1 });
resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ status: 1, createdAt: -1 });

// Virtual for average rating
resourceSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal place
});

// Virtual for rating count
resourceSchema.virtual('ratingCount').get(function() {
  return this.ratings.length;
});

// Instance method to increment download count
resourceSchema.methods.incrementDownloads = function() {
  this.downloadCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment view count
resourceSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to add rating
resourceSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => r.user.toString() !== userId.toString());
  
  // Add new rating
  this.ratings.push({
    user: userId,
    rating: rating,
    review: review
  });
  
  return this.save();
};

// Static method to get popular resources
resourceSchema.statics.getPopular = function(limit = 10) {
  return this.find({ 
    status: 'approved',
    isActive: true 
  })
    .populate('uploadedBy', 'name role')
    .sort({ 
      downloadCount: -1, 
      viewCount: -1, 
      createdAt: -1 
    })
    .limit(limit);
};

// Static method to get resources by category
resourceSchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({ 
    status: 'approved',
    isActive: true,
    category: category
  })
    .populate('uploadedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to search resources
resourceSchema.statics.search = function(query, category = null, type = null) {
  let searchFilter = {
    status: 'approved',
    isActive: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };

  if (category) searchFilter.category = category;
  if (type) searchFilter.type = type;

  return this.find(searchFilter)
    .populate('uploadedBy', 'name role')
    .sort({ relevance: -1, createdAt: -1 });
};

export default mongoose.model('Resource', resourceSchema);
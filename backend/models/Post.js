const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    index: 'text', // Enable text indexing for full-text search
  },
  // Update image field to be an array of URLs
  images: [{
    type: String,
    default: null,
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster query by userId
  },
  profilename: {
    type: String,
    required: true,
    index: true, // Index for quick lookups or sorting by profile name
  },
  uniqueName: {
    type: String,
    required: true,
    index: true, // Index for quick lookups or sorting by unique name
  },
  profilepic: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Index for efficient sorting by timestamp
  },
});

// Add validation for maximum images
PostSchema.pre('save', function(next) {
  if (this.images && this.images.length > 6) {
    next(new Error('Maximum 6 images allowed per post'));
  }
  next();
});

// Add indexes for better performance
PostSchema.index({ timestamp: -1 });
PostSchema.index({ userId: 1 });
PostSchema.index({ userId: 1, timestamp: -1 });
PostSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', PostSchema);

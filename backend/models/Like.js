const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index userId for fast lookup
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true, // Index postId for fast lookup
  },
  profilename: {
    type: String,
    required: true,
  },
  uniqueName: {
    type: String,
    required: true,
  },
  profilepic: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Index timestamp for sorting by newest/oldest
  },
});

// Ensure unique combinations of userId and postId to prevent multiple likes by the same user
LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);

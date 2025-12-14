const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,  // Index to optimize querying by postId
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,  // Index to optimize sorting by timestamp (for most recent comments)
  },
});

CommentSchema.index({ postId: 1, timestamp: -1 }); // Optional: compound index for common queries

module.exports = mongoose.model('Comment', CommentSchema);

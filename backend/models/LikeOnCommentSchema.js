const mongoose = require('mongoose');

const LikeOnCommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for fast querying by userId
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true,
    index: true, // Index for fast querying by commentId
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
  },
});

module.exports = mongoose.model('LikeOnComment', LikeOnCommentSchema);

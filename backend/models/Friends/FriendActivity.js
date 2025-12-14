const mongoose = require('mongoose');

const friendActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: ['workout', 'chat', 'achievement'],
    required: true
  },
  description: String,
  shared: {
    type: Boolean,
    default: false
  },
  duration: Number,
  distance: Number,
  calories: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FriendActivity', friendActivitySchema);

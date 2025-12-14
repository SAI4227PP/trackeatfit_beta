const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  isWorkoutBuddy: {
    type: Boolean,
    default: false
  },
  isFollowing: {
    type: Boolean,
    default: false  // Sender (A) follows Receiver (B)
  },
  isFollowedBack: {
    type: Boolean,
    default: false  // Receiver (B) follows Sender (A)
  },
  mutualFollow: {
    type: Boolean,
    default: false  // Both follow each other
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique friendships
friendSchema.index({ user: 1, friend: 1 }, { unique: true });

// Update method for mutual follow status
friendSchema.methods.updateMutualStatus = function() {
  // Both flags must be true for mutual follow
  this.mutualFollow = this.isFollowing && this.isFollowedBack;
};

// Add a method to get follow status from a user's perspective
friendSchema.methods.getFollowStatusForUser = function(userId) {
  const isInitiator = this.user.toString() === userId.toString();
  return {
    isFollowing: isInitiator ? this.isFollowing : this.isFollowedBack,
    isFollowedBack: isInitiator ? this.isFollowedBack : this.isFollowing,
    mutualFollow: this.mutualFollow
  };
};

module.exports = mongoose.model('Friend', friendSchema);

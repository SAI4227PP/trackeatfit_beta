const mongoose = require('mongoose');

const followingSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isFollowing: {
    type: Boolean,
    default: true  // Follower follows Following user
  },
  isFollowedBack: {
    type: Boolean,
    default: false  // Following user follows Follower
  },
  mutualFollow: {
    type: Boolean,
    default: false  // Both follow each other
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can follow another user only once
followingSchema.index({ follower: 1, following: 1 }, { unique: true });

// Update method for mutual follow status
followingSchema.methods.updateMutualStatus = function() {
  // Both flags must be true for mutual follow
  this.mutualFollow = this.isFollowing && this.isFollowedBack;
};

// Add a method to get follow status from a user's perspective
followingSchema.methods.getFollowStatusForUser = function(userId) {
  const isInitiator = this.follower.toString() === userId.toString();
  return {
    isFollowing: isInitiator ? this.isFollowing : this.isFollowedBack,
    isFollowedBack: isInitiator ? this.isFollowedBack : this.isFollowing,
    mutualFollow: this.mutualFollow
  };
};

module.exports = mongoose.model('Following', followingSchema);

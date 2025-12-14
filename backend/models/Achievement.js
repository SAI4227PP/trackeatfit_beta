const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  achievements: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['streak', 'level', 'meals'],
      default: 'meals'
    },
    isUnlocked: {
      type: Boolean,
      default: false
    },
    unlockedAt: {
      type: Date,
      default: null
    },
    icon: {
      type: String,
      required: true,
      trim: true
    }
  }],
  stats: {
    totalUnlocked: {
      type: Number,
      default: 0
    },
    lastUnlocked: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Pre-save middleware to update stats
achievementSchema.pre('save', function(next) {
  if (this.isModified('achievements')) {
    const unlocked = this.achievements.filter(a => a.isUnlocked);
    this.stats.totalUnlocked = unlocked.length;
    
    const latestUnlock = Math.max(...unlocked.map(a => a.unlockedAt?.getTime() || 0));
    if (latestUnlock > 0) {
      this.stats.lastUnlocked = new Date(latestUnlock);
    }
  }
  next();
});

module.exports = mongoose.model('Achievement', achievementSchema);

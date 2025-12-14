const mongoose = require('mongoose');

const sleepDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bedTime: {
    type: Date,
    required: true,
  },
  wakeTime: {
    type: Date,
    required: true,
  },
  quality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  settings: {
    notifications: { type: Boolean, default: true },
    smartAlarm: { type: Boolean, default: true },
    sleepGoal: { type: Number, default: 8 }, // in hours
    trackMovement: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('SleepData', sleepDataSchema);

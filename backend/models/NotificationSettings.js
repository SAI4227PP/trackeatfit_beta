const mongoose = require('mongoose');

const notificationSettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nutrition: {
    mealReminders: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    },
    waterReminders: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    },
    snackAlerts: {
      enabled: { type: Boolean, default: false },
      description: String,
      icon: String,
      color: String,
    }
  },
  health: {
    weightTracking: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    },
    exerciseReminders: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    },
    sleepSchedule: {
      enabled: { type: Boolean, default: false },
      description: String,
      icon: String,
      color: String,
    }
  },
  achievements: {
    milestones: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    },
    weeklyReport: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    },
    streaks: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String,
    }
  },
  social: {
    chat: {
      enabled: { type: Boolean, default: true },
      description: String,
      icon: String,
      color: String
    }
  },
  payment: {
    success: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Get notified when your payment is successful' },
      icon: { type: String, default: 'credit-card-check' },
      color: { type: String, default: '#2563eb' }
    },
    failed: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Get notified when your payment fails' },
      icon: { type: String, default: 'credit-card-remove' },
      color: { type: String, default: '#ef4444' }
    }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationSettings', notificationSettingSchema);

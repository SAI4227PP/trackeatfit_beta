const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  planCode: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true // e.g., "free", "standard", "premium"
  },

  name: {
    type: String,
    required: true,
    enum: ['FREE', 'STANDARD', 'PREMIUM'],
    uppercase: true,
    trim: true
  },

  tagline: {
    type: String,
    default: '',
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    required: true,
    min: 0 // in paise (INR), cents (USD), etc.
  },

  currency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    default: 'INR'
  },

  durationInDays: {
    type: Number,
    default: 30
  },

  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },

  trialDays: {
    type: Number,
    default: 0,
    min: 0
  },

  features: {
    type: [String],
    default: [],
    enum: [
      'nutrition_tracker',
      'basic_workout_logging',
      'community_posts',
      'recipe_browsing',
      'basic_notifications',
      'view_workout_history',
      'view_personal_records',
      'ai_coach',
      'workout_logging',
      'workout_analytics',
      'weekly_reports',
      'advanced_notifications',
      'google_fit_sync',
      'personal_records_tracking',
      'workout_recommendations',
      'advanced_workout_logging',
      'full_workout_analytics',
      'priority_support',
      'custom_workout_plans',
      'monthly_analytics',
      'in-depth_progress_reports'
    ]
  },

  isPublic: {
    type: Boolean,
    default: true
  },

  isRecommended: {
    type: Boolean,
    default: false
  },

  sortOrder: {
    type: Number,
    default: 0,
    index: true
  },

  promo: {
    type: String,
    default: '',
    trim: true
  },

  highlightColor: {
    type: String,
    default: '',
    trim: true // e.g., "#A0AEC0"
  },

  gatewayProductId: {
    type: String,
    default: null,
    trim: true
  },

  isArchived: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  versionKey: false
});

// Add compound index for fast plan queries
PlanSchema.index({ isPublic: 1, sortOrder: 1, price: 1 });

module.exports = mongoose.model('Plan', PlanSchema);

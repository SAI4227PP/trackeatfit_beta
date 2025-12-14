const mongoose = require('mongoose');

const userGoalSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  caloriesGoal: { type: String },
  weightGoals: {
    currentWeight: { type: Number },
    targetWeight: { type: Number },
    weeklyGoal: { type: String, enum: ['gentle', 'moderate', 'aggressive'] },
    timeframe: { type: String, enum: ['12_weeks', '16_weeks', '24_weeks'] },
    weightUnit: { type: String, default: 'kg' },
    lastWeightUpdate: { type: Date },
    startDate: { type: Date },
    expectedEndDate: { type: Date }
  }
}, { timestamps: true });

const UserGoal = mongoose.model('UserGoal', userGoalSchema);

module.exports = UserGoal;

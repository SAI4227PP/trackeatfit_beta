const mongoose = require('mongoose');

const MacronutrientDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Assuming one record per user
  },
  carbsPercentage: {
    type: Number,
    required: true,
  },
  proteinsPercentage: {
    type: Number,
    required: true,
  },
  fatsPercentage: {
    type: Number,
    required: true,
  },
  carbsWeight: {
    type: String,
    required: true,
  },
  proteinsWeight: {
    type: String,
    required: true,
  },
  fatsWeight: {
    type: String,
    required: true,
  },
  totalPercentage: {
    type: Number,
    required: true,
  },
  weight: {
    type: String,
    required: true,
  },
});

const MacronutrientData = mongoose.model('MacronutrientData', MacronutrientDataSchema);

module.exports = MacronutrientData;

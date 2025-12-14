const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ['recipe', 'food'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique combinations of userId, itemType, and itemId
favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
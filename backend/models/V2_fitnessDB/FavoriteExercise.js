const mongoose = require('mongoose');

const FavoriteExerciseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'V3_exercises', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FavoriteExercise', FavoriteExerciseSchema);

const mongoose = require('mongoose');

const progressionLevelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    repsPerSet: { type: String, required: true }
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
    recommendedRepsPerSet: { type: String, required: true },
    recommendedSets: { type: Number, required: true },
    restTimeBetweenSets: { type: String, required: true },
    durationPerSet: { type: String, required: true }
}, { _id: false });

const progressionSchema = new mongoose.Schema({
    beginner: progressionLevelSchema,
    intermediate: progressionLevelSchema,
    advanced: progressionLevelSchema
}, { _id: false });

const mediaSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    videoUrl: { type: String, required: true }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Strength Training', 'Cardio', 'Flexibility', 'Balance']
    },
    subCategory: {
        type: String,
        required: true,
        enum: ['Upper Body', 'Lower Body', 'Core', 'Full Body']
    },
    muscleGroups: [{
        type: String,
        required: true
    }],
    equipment: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    intensity: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High']
    },
    caloriesBurnedPerMinute: {
        type: Number,
        required: true
    },
    workoutPlan: {
        type: workoutPlanSchema,
        required: true
    },
    workoutType: [{
        type: String,
        required: true,
        enum: ['Strength', 'Muscle Growth', 'Endurance', 'Power', 'Flexibility']
    }],
    progression: {
        type: progressionSchema,
        required: true
    },
    instructions: [{
        type: String,
        required: true
    }],
    media: {
        type: mediaSchema,
        required: true
    }
}, {
    timestamps: true
});

module.exports = exerciseSchema;

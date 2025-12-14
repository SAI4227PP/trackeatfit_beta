/**
 * WorkoutSession Model
 * Professional-grade schema for tracking individual workout sessions within a program.
 * Designed for extensibility, analytics, and integration with user progress and exercise libraries.
 * Follows best practices for large-scale fitness platforms.
 */
const mongoose = require('mongoose');

// --- Exercise Performance Subdocument ---
const ExercisePerformanceSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'V3_exercises', required: true },
  exerciseName: { type: String },
  order: { type: Number },
  // setsPlanned: { type: String },
  // repsPlanned: { type: String },
  setsCompleted: { type: String },
  repsCompleted: { type: String },
  weightUsed: { type: String }, // e.g. '20kg', 'bodyweight'
  // duration: { type: Number }, // seconds for time-based exercises
  // restBetweenSets: { type: String },
  notes: { type: String },
  skipped: { type: Boolean, default: false },
  performanceMetrics: {
    avgSetTime: { type: Number }, // seconds
    totalTime: { type: Number }, // seconds
    caloriesBurned: { type: Number },
    perceivedExertion: { type: Number, min: 1, max: 10 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// --- Workout Session Schema ---
const WorkoutSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // programId, programName, day, title, description are all optional for individual workouts
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseProgram', required: false },
  programName: { type: String, required: false },
  sessionDate: { type: Date, default: Date.now },
  day: { type: Number, required: false },
  title: { type: String, required: false },
  description: { type: String, required: false },
  exercises: [ExercisePerformanceSchema], // can be just one exercise for individual workouts
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'missed', 'rest'],
    default: 'not_started'
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  durationInMinutes: { type: Number },
  totalCaloriesBurned: { type: Number },
  rating: { type: Number, min: 0, max: 5 },
  energyLevel: { type: Number, min: 1, max: 5 },
  difficultyRating: { type: Number, min: 1, max: 5 },
  adjustmentSuggestion: { type: String, enum: ['easier', 'same', 'harder'], default: 'same' },
  isRecoveryDay: { type: Boolean, default: false },
  isMissed: { type: Boolean, default: false },
  isRestDay: { type: Boolean, default: false },
  notes: { type: String },
  feedback: { type: String },
  workoutAnalysis: {
    userTotal: { type: Number },
    standardTotalTime: { type: Number },
    diff: { type: Number },
    faster: { type: Boolean },
    setTimes: [{ type: Number }]
  },
  createdBy: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'workout_sessions',
  timestamps: true
});

// --- Individual Workout Session Schema ---
const IndividualExercisePerformanceSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'V3_exercises', required: true },
  exerciseName: { type: String }, // Added exerciseName
  repsCompleted: { type: String }, // Added repsCompleted
  skipped: { type: Boolean, default: false },
  performanceMetrics: {
    avgSetTime: { type: Number },
    totalTime: { type: Number },
    caloriesBurned: { type: Number },
    perceivedExertion: { type: Number, min: 1, max: 10 },
  }
}, { _id: false });

const IndividualWorkoutSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'missed', 'rest'], default: 'not_started' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  durationInMinutes: { type: Number },
  totalCaloriesBurned: { type: Number },
  rating: { type: Number, min: 0, max: 5 },
  energyLevel: { type: Number, min: 1, max: 5 },
  difficultyRating: { type: Number, min: 1, max: 5 },
  adjustmentSuggestion: { type: String, enum: ['easier', 'same', 'harder'], default: 'same' },
  notes: { type: String },
  feedback: { type: String },
  exercises: [IndividualExercisePerformanceSchema],
  workoutAnalysis: {
    userTotal: { type: Number },
    standardTotalTime: { type: Number },
    diff: { type: Number },
    faster: { type: Boolean },
    setTimes: [{ type: Number }]
  }
}, {
  collection: 'workout_sessions',
  timestamps: true
});

// Use the same collection for both models
const WorkoutSession = mongoose.model('WorkoutSession', WorkoutSessionSchema, 'workout_sessions');
const IndividualWorkoutSession = mongoose.model('IndividualWorkoutSession', IndividualWorkoutSessionSchema, 'workout_sessions');

// Indexes for analytics and performance
WorkoutSessionSchema.index({ userId: 1, programId: 1, day: 1 });
WorkoutSessionSchema.index({ sessionDate: 1 });

// Fix: Only export the models and schemas, do not add any route logic here
module.exports = {
  ExercisePerformanceSchema,
  WorkoutSessionSchema,
  WorkoutSession,
  IndividualWorkoutSessionSchema,
  IndividualWorkoutSession
};

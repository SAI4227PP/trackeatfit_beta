const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  programName: { type: String, required: true },
  description: { type: String, required: true },

  category: {
    type: String,
    enum: ['CARDIO', 'STRENGTH', 'PLYOMETRICS', 'STRETCHING', 'YOGA', 'WEIGHTLIFTING', 'AEROBIC'],
    required: true
  },

  targetMuscleGroups: {
    type: [String],
    enum: ['upper body', 'lower body', 'core', 'full body'],
    required: true
  },

  goal: {
    type: String,
    enum: ['fat loss', 'muscle gain', 'endurance', 'mobility', 'general fitness'],
    required: true
  },
  trainingStyle: {
    type: String,
    enum: ['HIIT', 'Circuit', 'Strength Split', 'Full-Body', 'Yoga', 'Custom'],
    default: 'Full-Body'
  },

  duration: {
    weeks: { type: Number, required: true, min: 1 },
    sessionsPerWeek: { type: Number, required: true, min: 1, max: 7 }
  },

  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },

  environment: {
    type: String,
    enum: ['home', 'gym', 'all'],
    default: 'all'
  },

  genderSuitability: {
    type: String,
    enum: ['male', 'female', 'all'],
    default: 'all'
  },

  recommendedEquipment: [{ type: String }], // Optional array of strings

  tags: [{ type: String }], // searchable tags like ['cardio', 'core', 'low impact']

  thumbnail: { type: String }, // e.g. cover image from S3/Cloudflare

  schedule: [
    {
      day: { type: Number, required: true }, // 1 (Mon) to 7 (Sun)
      title: { type: String, required: true },
      description: { type: String },

      exercises: [
        {
          exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'V3_exercises', required: true },
          exerciseName: { type: String }, // Optional, for display
          order: { type: Number, required: true },
          sets: { type: String }, // '3', 'AMRAP', etc.
          reps: { type: String }, // '10', '45 sec', 'until failure'
          rest: { type: String }, // '30 sec'
          tempo: { type: String }, // e.g. '2-0-2'
          notes: { type: String }
        }
      ]
    }
  ],

  createdBy: { type: String, default: 'TrackEatFit AI' },
  verifiedByCoach: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'exercise_programs'
});

const ExerciseProgram = mongoose.model('ExerciseProgram', ProgramSchema);

module.exports = {
  ProgramSchema,
  ExerciseProgram
};

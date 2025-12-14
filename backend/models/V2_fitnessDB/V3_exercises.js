const mongoose = require('mongoose');

const V3_exerciseSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  mainImage: { type: String, required: true },
  
  mechanics: { type: String, enum: ['compound', 'isolation'], required: true },
  forceType: { type: String, enum: ['push', 'pull'], required: true },
  tempo: { type: String },
  repsRange: { type: String },
  setsRecommended: { type: String },
  restBetweenSets: { type: String },
  caloriesBurnedPerSet: { type: Number },
  duration: { type: Number }, // duration in seconds, optional

  category: { type: String, required: true }, // or replace with category object below
  // category: {
  //   _id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseCategory' },
  //   name: String,
  //   image: String
  // },

  bodyPart: { type: String, required: true },
  equipment: { type: String, required: true },
  target: { type: String, required: true },
  secondaryMuscles: [{ type: String }],

  safetyTips: [{ type: String }],
  commonMistakes: [{ type: String }],
  progressions: [{ type: String }],
  regressions: [{ type: String }],

  highlightMuscles: {
    front: [{ type: String }],
    back: [{ type: String }]
  },

  audioInstructionUrl: { type: String },
  isUnilateral: { type: Boolean, default: false },

  recommendedFor: [{ type: String }],
  trainingGoals: [{ type: String }],
  idealFor: [{ type: String, enum: ['beginner', 'intermediate', 'advanced'] }],
  genderSuitability: { type: String, enum: ['male', 'female', 'all'], default: 'all' },
  environment: { type: String, default: 'gym' },

  tags: [{ type: String }],
  rating: { type: Number, min: 0, max: 5 },
  coachNotes: { type: String },
  createdBy: { type: String, default: 'TrackEatFit AI' },
  verifiedByCoach: { type: Boolean, default: false },

  description: { type: String },
  instructions: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'V3_exercises' });

const V3_exercises = mongoose.model('V3_exercises', V3_exerciseSchema);

module.exports = {
  V3_exerciseSchema,
  V3_exercises
};

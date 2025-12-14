const mongoose = require('mongoose');

const v2ExerciseSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    bodyPart: { type: String, required: true },
    equipment: { type: String, required: true },
    target: { type: String, required: true },
    secondaryMuscles: [{ type: String }],
    instructions: [{ type: String }],
    description: { type: String },
    difficulty: { type: String },
    category: { type: String }
}, { collection: 'V2_exercises' });

module.exports = v2ExerciseSchema;

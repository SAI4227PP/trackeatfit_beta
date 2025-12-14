const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    exerciseId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    bodyParts: [{ type: String, required: true }],
    equipments: [{ type: String, required: true }],
    exerciseType: { type: String, required: true },
    targetMuscles: [{ type: String }],
    secondaryMuscles: [{ type: String }],
    keywords: [{ type: String }]
}, { collection: 'exercises' });

module.exports = exerciseSchema;

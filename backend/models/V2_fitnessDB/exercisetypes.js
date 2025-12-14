const mongoose = require('mongoose');

const exerciseTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }
}, { collection: 'exercisetypes' });

module.exports = exerciseTypeSchema;

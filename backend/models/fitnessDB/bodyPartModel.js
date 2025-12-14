const mongoose = require('mongoose');

const bodyPartSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Upper Body', 'Lower Body', 'Core', 'Full Body', 'Cardio']
    },
    subCategory: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Strength Training', 'Cardio', 'Flexibility', 'Balance']
    }
}, {
    timestamps: true
});

module.exports = bodyPartSchema;

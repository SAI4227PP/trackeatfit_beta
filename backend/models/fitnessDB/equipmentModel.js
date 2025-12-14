const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Bodyweight & Resistance Equipment',
            'Free Weights',
            'Machines',
            'Cardio Equipment',
            'Accessories'
        ]
    },
    type: {
        type: String,
        required: true,
        enum: [
            'Strength Training',
            'Cardio',
            'Mobility & Flexibility',
            'Recovery',
            'Multi-purpose'
        ]
    }
}, {
    timestamps: true
});

module.exports = equipmentSchema;

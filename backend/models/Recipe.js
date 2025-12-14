const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    recipe_name: {
        type: String,
        required: true
    },
    image: String,
    recipe: {
        uri: String,
        img_url: String
    },
    images: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    dietLabels: {
        type: [String],
        default: []
    },
    healthLabels: {
        type: [String],
        default: []
    },
    cautions: {
        type: [String],
        default: []
    },
    ingredientLines: {
        type: [String],
        required: true
    },
    ingredients: [{
        type: String,
        required: true
    }],
    calories_per_serving: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    totalCO2Emissions: Number,
    co2EmissionsClass: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    },
    totalWeight: Number,
    totalTime: {
        type: Number,
        default: 0
    },
    cuisineType: {
        type: [String],
        default: []
    },
    mealType: {
        type: [String],
        default: []
    },
    dishType: {
        type: [String],
        default: []
    },
    totalNutrients: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    recipe_id: {
        type: Number,
        unique: true,
        required: true
    }
});



module.exports = { schema: recipeSchema };

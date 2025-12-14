const mongoose = require('mongoose');

// Define the schema for the logged food
const loggedFoodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
    date: { type: String, required: true }, // Store the date as a string (e.g., "YYYY-MM-DD")
    foods: [
      {
        foodId: { 
          type: mongoose.Schema.Types.Mixed, // Accepts any type, both ObjectId and String
          ref: 'Food', 
          required: false 
        },
        recipeId: { 
          type: mongoose.Schema.Types.Mixed, // Accepts any type, both ObjectId and String
          ref: 'Recipe', 
          required: false 
        },
        mealType: { 
          type: String, 
          enum: ['breakfast', 'lunch', 'dinner', 'snacks'], // Changed 'snack' to 'snacks'
          required: true 
        },
        addedAt: { type: Date, default: Date.now }, // Timestamp when the food is logged
        entryId: { type: String, required: false },
        nutrition: {
          calories: { type: Number, required: false },
          carbs: { type: Number, required: false },
          protein: { type: Number, required: false },
          fats: { type: Number, required: false },
          servingSize: { type: String, required: false }
        }
      },
    ],
    water: [{
      amount: { type: Number, required: true }, // Amount in ml
      addedAt: { type: Date, default: Date.now }
    }],
    notes: [{
      content: { type: String, required: true },
      addedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const LoggedFood = mongoose.model('LoggedFood', loggedFoodSchema);

module.exports = LoggedFood;

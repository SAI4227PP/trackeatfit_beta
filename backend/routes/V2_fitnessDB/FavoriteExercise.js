const express = require('express');
const router = express.Router();
const { getV2FitnessConnection } = require('../../config/database');
const { V3_exerciseSchema } = require('../../models/V2_fitnessDB/V3_exercises');
const FavoriteExercise = require('../../models/V2_fitnessDB/FavoriteExercise');

let V3_exercise;

// Middleware to ensure V3_exercise model is initialized with the correct connection
router.use((req, res, next) => {
    if (!V3_exercise) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            V3_exercise = v2Conn.model('V3_exercise', V3_exerciseSchema, 'V3_exercises');
        }
    }
    next();
});

// Get all favorite exercises for a user
router.get('/:userId', async (req, res) => {
    try {
        const favorites = await FavoriteExercise.find({ userId: req.params.userId })
            .populate({
                path: 'exerciseId',
                model: V3_exercise,
                select: {
                    exerciseName: 1,
                    mainImage: 1,
                    caloriesBurnedPerSet: 1,
                    duration: 1,
                    category: 1,
                    bodyPart: 1,
                    equipment: 1,
                    target: 1,
                    secondaryMuscles: 1,
                    idealFor: 1,
                    rating: 1
                }
            });
        const CDN_URL = 'https://cdn.trackeatfit.me';
        const filteredFavorites = favorites
            .filter(fav => fav.exerciseId !== null)
            .map(fav => {
                if (fav.exerciseId && fav.exerciseId.mainImage) {
                    fav.exerciseId.mainImage = fav.exerciseId.mainImage.replace(
                        'https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com',
                        CDN_URL
                    );
                }
                return fav;
            });
        res.json(filteredFavorites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add or toggle a favorite exercise
router.post('/', async (req, res) => {
    try {
        const { userId, exerciseId } = req.body;

        // Input validation
        if (!userId || !exerciseId) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                details: 'Both userId and exerciseId are required' 
            });
        }

        // First check if the document already exists
        const existing = await FavoriteExercise.findOne({ userId, exerciseId }).lean();
        
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Already favorited',
                data: existing
            });
        }

        // If it doesn't exist, create a new one
        const newFavorite = await FavoriteExercise.create({ 
            userId, 
            exerciseId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Favorite added',
            data: newFavorite
        });

    } catch (err) {
        console.error('Error in favorite exercise:', err);
        res.status(500).json({
            error: 'Failed to process favorite',
            details: err.message
        });
    }
});

// Remove a favorite exercise
router.delete('/:userId/:exerciseId', async (req, res) => {
    try {
        const { userId, exerciseId } = req.params;

        // Input validation
        if (!userId || !exerciseId) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'Both userId and exerciseId are required'
            });
        }

        // Use findOneAndDelete for atomic operation
        const result = await FavoriteExercise.findOneAndDelete({
            userId,
            exerciseId
        }).lean(); // Use lean() for better performance as we don't need a full mongoose document
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found',
                details: 'The specified favorite exercise does not exist'
            });
        }
        
        res.json({
            success: true,
            message: 'Favorite removed successfully',
            data: result
        });

    } catch (err) {
        console.error('Error removing favorite:', err);
        res.status(500).json({
            error: 'Failed to remove favorite',
            details: err.message
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const compression = require('compression');
const exerciseSchema = require('../../models/fitnessDB/exerciseModel');

// Enable compression for all routes
router.use(compression());

let Exercise;

// Initialize model with fitness database connection and create compound indexes
router.use(async (req, res, next) => {
    if (!Exercise) {
        const fitnessConnection = mongoose.connections.find(
            conn => conn.name === 'fitnessAppDB'
        );
        if (fitnessConnection) {
            Exercise = fitnessConnection.model('Exercise', exerciseSchema);
            
            // Create compound indexes for common query patterns
            try {
                await Promise.all([
                    Exercise.collection.createIndex({ muscleGroups: 1, difficulty: 1 }),
                    Exercise.collection.createIndex({ category: 1, equipment: 1 }),
                    Exercise.collection.createIndex({ 'workoutType': 1, difficulty: 1 })
                ]);
                console.log('Exercise indexes created successfully');
            } catch (error) {
                console.error('Error creating exercise indexes:', error);
            }
        }
    }
    next();
});

// Reusable pagination function
const paginateResults = async (query, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
        query.skip(skip).limit(limit).lean().exec(),
        query.model.countDocuments(query.getQuery())
    ]);

    return {
        results,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasMore: skip + results.length < total
        }
    };
};

// Modify existing routes to use the new pagination function and add caching
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const query = Exercise.find({})
            .select('name category subCategory difficulty intensity media.imageUrl')
            .sort({ name: 1 });

        const result = await paginateResults(query, page, limit);
        
        // Set cache headers
        res.set('Cache-Control', 'public, max-age=300');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Optimized muscle group route
router.get('/muscle/:muscleGroup', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const query = Exercise.find({ muscleGroups: req.params.muscleGroup })
            .select('name category difficulty media.imageUrl')
            .sort({ difficulty: 1 });

        const result = await paginateResults(query, page, limit);
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Optimized equipment route
router.get('/equipment/:equipment', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const query = Exercise.find({ equipment: req.params.equipment })
            .select('name category difficulty media.imageUrl')
            .sort({ name: 1 });

        const result = await paginateResults(query, page, limit);
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Optimized difficulty route
router.get('/difficulty/:level', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const query = Exercise.find({ difficulty: req.params.level })
            .select('name category equipment media.imageUrl')
            .sort({ name: 1 });

        const result = await paginateResults(query, page, limit);
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get exercise by ID (with caching headers)
router.get('/:id', async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id).lean();
        
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Set simple cache control header
        res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

        res.json(exercise);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add paginated version
router.get('/preview/paginated', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [exercises, total] = await Promise.all([
            Exercise.find({})
                .select({
                    name: 1,
                    category: 1,
                    subCategory: 1,
                    muscleGroups: 1,
                    equipment: 1,
                    difficulty: 1,
                    intensity: 1,
                    caloriesBurnedPerMinute: 1
                })
                .skip(skip)
                .limit(limit)
                .lean(),
            Exercise.countDocuments()
        ]);

        res.json({
            exercises,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalExercises: total,
                hasMore: skip + exercises.length < total
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

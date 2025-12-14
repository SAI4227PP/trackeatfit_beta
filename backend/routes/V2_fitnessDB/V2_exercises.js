const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const router = express.Router();


// NodeCache removed
const { getV2FitnessConnection } = require('../../config/database');

// Cloudflare cache header middleware
const setCloudflareCacheHeader = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
  }
  next();
};

const v2ExerciseSchema = require('../../models/V2_fitnessDB/V2_exercises');
let V2Exercise;

router.use(compression());
router.use(setCloudflareCacheHeader);

router.use((req, res, next) => {
    if (!V2Exercise) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            V2Exercise = v2Conn.model('V2Exercise', v2ExerciseSchema, 'V2_exercises');
        }
    }
    next();
});

// Get all V2 exercises with pagination
router.get('/', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            V2Exercise.find({}).skip(skip).limit(limit),
            V2Exercise.countDocuments()
        ]);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercises = exercises.map(ex => ({
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        const response = {
            data: updatedExercises,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Get V2 exercises by bodyPart
router.get('/bodypart/:bodyPart', async (req, res) => {
    try {
        let { bodyPart } = req.params;
        // bodyPart = bodyPart.toUpperCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            V2Exercise.find({ bodyPart }).skip(skip).limit(limit),
            V2Exercise.countDocuments({ bodyPart })
        ]);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercises = exercises.map(ex => ({
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        const response = {
            data: updatedExercises,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get V2 exercises by equipment
router.get('/equipment/:equipment', async (req, res) => {
    try {
        let { equipment } = req.params;
        // equipment = equipment.toUpperCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            V2Exercise.find({ equipment }).skip(skip).limit(limit),
            V2Exercise.countDocuments({ equipment })
        ]);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercises = exercises.map(ex => ({
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        const response = {
            data: updatedExercises,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get V2 exercises by exerciseType
router.get('/exercisetype/:exerciseType', async (req, res) => {
    try {
        let { exerciseType } = req.params;
        exerciseType = exerciseType.toLowerCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            V2Exercise.find({ category: exerciseType }).skip(skip).limit(limit),
            V2Exercise.countDocuments({ category: exerciseType })
        ]);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercises = exercises.map(ex => ({
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        const response = {
            data: updatedExercises,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get V2 exercises by difficulty
router.get('/difficulty/:difficulty', async (req, res) => {
    try {
        let { difficulty } = req.params;
        difficulty = difficulty.toLowerCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            V2Exercise.find({ difficulty }).skip(skip).limit(limit),
            V2Exercise.countDocuments({ difficulty })
        ]);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercises = exercises.map(ex => ({
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        const response = {
            data: updatedExercises,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Search V2 exercises by name, description, or other fields
router.get('/search', async (req, res) => {
    try {
        const { q = '', page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        // Search in name, description, and tags fields (case-insensitive)
        const searchRegex = new RegExp(q, 'i');
        const searchQuery = {
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ]
        };
        const [exercises, total] = await Promise.all([
            V2Exercise.find(searchQuery).skip(skip).limit(parseInt(limit)),
            V2Exercise.countDocuments(searchQuery)
        ]);
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercises = exercises.map(ex => ({
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        const response = {
            data: updatedExercises,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get V2 exercise by _id (ObjectId) or custom id (string)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let ex = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            ex = await V2Exercise.findById(id);
        } else {
            ex = await V2Exercise.findOne({ id });
        }
        if (!ex) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedExercise = {
            ...ex.toObject(),
            image: ex.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        };
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(updatedExercise);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

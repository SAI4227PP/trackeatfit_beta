const express = require('express');
const compression = require('compression');
const router = express.Router();
// Cloudflare cache header middleware
const setCloudflareCacheHeader = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
  }
  next();
};

router.use(setCloudflareCacheHeader);
const { getV2FitnessConnection } = require('../../config/database');

const exerciseSchema = require('../../models/V2_fitnessDB/exercises');
let Exercise;

router.use(compression());
router.use((req, res, next) => {
    if (!Exercise) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            Exercise = v2Conn.model('Exercise', exerciseSchema, 'exercises');
        }
    }
    next();
});

// Get all exercises
router.get('/', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            Exercise.find({}).skip(skip).limit(limit),
            Exercise.countDocuments()
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

// Get exercises by bodyPart
router.get('/bodypart/:bodyPart', async (req, res) => {
    try {
        let { bodyPart } = req.params;
        bodyPart = bodyPart.toUpperCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            Exercise.find({ bodyParts: bodyPart }).skip(skip).limit(limit),
            Exercise.countDocuments({ bodyParts: bodyPart })
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

// Get exercises by equipment
router.get('/equipment/:equipment', async (req, res) => {
    try {
        let { equipment } = req.params;
        equipment = equipment.toUpperCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            Exercise.find({ equipments: equipment }).skip(skip).limit(limit),
            Exercise.countDocuments({ equipments: equipment })
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

// Get exercises by exerciseType
router.get('/exercisetype/:exerciseType', async (req, res) => {
    try {
        let { exerciseType } = req.params;
        exerciseType = exerciseType.toUpperCase();
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [exercises, total] = await Promise.all([
            Exercise.find({ exerciseType }).skip(skip).limit(limit),
            Exercise.countDocuments({ exerciseType })
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

module.exports = router;

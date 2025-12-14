const express = require('express');
const compression = require('compression');

// Cloudflare cache header middleware
const setCloudflareCacheHeader = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
  }
  next();
};

const router = express.Router();
router.use(setCloudflareCacheHeader);

const { getV2FitnessConnection } = require('../../config/database');

const muscleSchema = require('../../models/V2_fitnessDB/muscles');
let Muscle;

router.use(compression());

router.use((req, res, next) => {
    if (!Muscle) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            Muscle = v2Conn.model('Muscle', muscleSchema, 'muscles');
        }
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const [muscles, total] = await Promise.all([
            Muscle.find({}).skip(skip).limit(limit),
            Muscle.countDocuments()
        ]);
        const response = {
            data: muscles,
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

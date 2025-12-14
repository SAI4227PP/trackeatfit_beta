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

const exerciseTypeSchema = require('../../models/V2_fitnessDB/exercisetypes');
let ExerciseType;

router.use(compression());
router.use((req, res, next) => {
    if (!ExerciseType) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            ExerciseType = v2Conn.model('ExerciseType', exerciseTypeSchema, 'exercisetypes');
        }
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        const types = await ExerciseType.find({});
        const CDN_URL = 'https://cdn.trackeatfit.xyz';
        const updatedTypes = types.map(type => ({
            ...type.toObject(),
            image: type.image.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(updatedTypes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

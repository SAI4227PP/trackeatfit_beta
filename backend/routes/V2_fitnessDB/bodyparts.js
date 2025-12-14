const express = require('express');
const compression = require('compression');
// NodeCache removed
const router = express.Router();
const { getV2FitnessConnection } = require('../../config/database');

const bodyPartSchema = require('../../models/V2_fitnessDB/bodyparts');
let BodyPart;

// Cloudflare cache header middleware
const setCloudflareCacheHeader = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
  }
  next();
};

router.use(compression());
router.use(setCloudflareCacheHeader);
router.use((req, res, next) => {
    if (!BodyPart) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            BodyPart = v2Conn.model('BodyPart', bodyPartSchema, 'bodyparts');
        }
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        const bodyParts = await BodyPart.find({});
        const CDN_URL = 'https://cdn.trackeatfit.me';
        const updatedBodyParts = bodyParts.map(bp => ({
            ...bp.toObject(),
            image: bp.image.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(updatedBodyParts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

const express = require('express');
const compression = require('compression');
const router = express.Router();
const { getV2FitnessConnection } = require('../../config/database');

const equipmentSchema = require('../../models/V2_fitnessDB/equipments');
let Equipment;

router.use(compression());
router.use((req, res, next) => {
    if (!Equipment) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            Equipment = v2Conn.model('Equipment', equipmentSchema, 'equipments');
        }
    }
    next();
});

// Cloudflare cache header middleware
const setCloudflareCacheHeader = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
  }
  next();
};

router.use(setCloudflareCacheHeader);

router.get('/', async (req, res) => {
    try {
        const equipments = await Equipment.find({});
        const CDN_URL = 'https://cdn.trackeatfit.me';
        const updatedEquipments = equipments.map(eq => ({
            ...eq.toObject(),
            image: eq.image.replace('https://cdn.trackeatfit.me.s3.us-east-1.amazonaws.com', CDN_URL)
        }));
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
        res.json(updatedEquipments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

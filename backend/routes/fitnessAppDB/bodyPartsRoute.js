const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bodyPartSchema = require('../../models/fitnessDB/bodyPartModel');

// Get reference to fitness database connection
let BodyPart;

// Initialize model with fitness database connection
router.use((req, res, next) => {
    if (!BodyPart) {
        const fitnessConnection = mongoose.connections.find(
            conn => conn.name === 'fitnessAppDB'
        );
        if (fitnessConnection) {
            BodyPart = fitnessConnection.model('BodyPart', bodyPartSchema);
        }
    }
    next();
});

// Get all body parts
router.get('/', async (req, res) => {
    try {
        const bodyParts = await BodyPart.find({});
        res.json(bodyParts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new body part
router.post('/', async (req, res) => {
    try {
        const bodyPart = new BodyPart(req.body);
        const newBodyPart = await bodyPart.save();
        res.status(201).json(newBodyPart);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get body parts by category
router.get('/category/:category', async (req, res) => {
    try {
        const bodyParts = await BodyPart.find({ category: req.params.category });
        res.json(bodyParts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get body parts by type
router.get('/type/:type', async (req, res) => {
    try {
        const bodyParts = await BodyPart.find({ type: req.params.type });
        res.json(bodyParts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

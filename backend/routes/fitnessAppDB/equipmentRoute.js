const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const equipmentSchema = require('../../models/fitnessDB/equipmentModel');

// Get reference to fitness database connection
let Equipment;

// Initialize model with fitness database connection
router.use((req, res, next) => {
    if (!Equipment) {
        const fitnessConnection = mongoose.connections.find(
            conn => conn.name === 'fitnessAppDB'
        );
        if (fitnessConnection) {
            Equipment = fitnessConnection.model('Equipment', equipmentSchema);
        }
    }
    next();
});

// Get all equipment
router.get('/', async (req, res) => {
    try {
        const equipment = await Equipment.find({});
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new equipment
router.post('/', async (req, res) => {
    try {
        const equipment = new Equipment(req.body);
        const newEquipment = await equipment.save();
        res.status(201).json(newEquipment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get equipment by category
router.get('/category/:category', async (req, res) => {
    try {
        const equipment = await Equipment.find({ category: req.params.category });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get equipment by type
router.get('/type/:type', async (req, res) => {
    try {
        const equipment = await Equipment.find({ type: req.params.type });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

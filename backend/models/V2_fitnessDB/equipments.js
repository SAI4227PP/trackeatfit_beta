const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }
}, { collection: 'equipments' });

module.exports = equipmentSchema;

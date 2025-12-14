const mongoose = require('mongoose');

const bodyPartSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }
}, { collection: 'bodyparts' });

module.exports = bodyPartSchema;

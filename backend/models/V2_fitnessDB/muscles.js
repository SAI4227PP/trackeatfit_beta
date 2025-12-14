const mongoose = require('mongoose');

const muscleSchema = new mongoose.Schema({
    name: String,
    // Add other fields as needed
});

module.exports = muscleSchema;

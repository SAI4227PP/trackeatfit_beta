const mongoose = require('mongoose');
const User = require('./User')

// Store the active user session
const currentUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionToken: { type: String, required: true },
  deviceInfo: {
    deviceType: String,
    browser: String,
    platform: String,
    os: String,
    ip: String
  },
  createdAt: { type: Date, default: Date.now }, // This field tracks when the session was created
});

const CurrentUser = mongoose.model('CurrentUser', currentUserSchema);

module.exports = CurrentUser;

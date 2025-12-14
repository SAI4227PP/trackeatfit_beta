const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user's last active time
router.post('/update-activity', async (req, res) => {
  try {
    const { userId, lastActive } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    await User.findByIdAndUpdate(userId, {
      lastActive: lastActive || new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

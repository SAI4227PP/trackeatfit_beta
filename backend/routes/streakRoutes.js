const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const NotificationSettings = require('../models/NotificationSettings');

// Function to check if user has opened app today
const hasUserOpenedAppToday = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user?.lastActive) return false;

    const lastActive = new Date(user.lastActive);
    const today = new Date();
    
    return lastActive.getDate() === today.getDate() &&
           lastActive.getMonth() === today.getMonth() &&
           lastActive.getFullYear() === today.getFullYear();
  } catch (error) {
    console.error('Error checking user activity:', error);
    return false;
  }
};

// Check and send streak reminders
const checkAndSendStreakReminders = async () => {  try {
    const users = await User.find({
      streak: { $gt: 0 } // Only users with active streaks
    });

    for (const user of users) {
      try {
        // Check if user has opened app today
        const hasOpened = await hasUserOpenedAppToday(user._id);
        if (hasOpened) continue;

        // Check if notifications are enabled
        const settings = await NotificationSettings.findOne({ userId: user._id });
        if (!settings?.achievements?.streaks?.enabled) continue;

        // Send streak reminder
        await notificationService.sendStreakReminder(user._id, user.streak);
        
        console.log(`Sent streak reminder to user ${user._id} for ${user.streak}-day streak`);
      } catch (error) {
        console.error(`Error processing streak reminder for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendStreakReminders:', error);
  }
};

// Endpoint to manually trigger streak checks (for testing)
router.post('/check-streaks', async (req, res) => {
  try {
    await checkAndSendStreakReminders();
    res.json({ success: true, message: 'Streak check completed' });
  } catch (error) {
    console.error('Error checking streaks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  router,
  checkAndSendStreakReminders
};

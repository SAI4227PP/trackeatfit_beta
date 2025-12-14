const express = require('express');
const router = express.Router();
const SleepData = require('../models/SleepData');
const NotificationSettings = require('../models/NotificationSettings');
const NodeCache = require('node-cache');

// Initialize cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

// Get sleep data for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Check cache first
    const cacheKey = `sleep_${userId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Use lean() for better performance and only select needed fields
    const [notificationSettings, todayRecord, lastNightRecord] = await Promise.all([
      NotificationSettings.findOne({ userId }).select('health.sleepSchedule.enabled').lean(),
      SleepData.findOne({
        userId,
        date: { $gte: today }
      }).select('-__v').lean(),
      SleepData.findOne({
        userId,
        date: { $gte: yesterday, $lt: today }
      }).select('-__v').sort({ date: -1 }).lean()
    ]);

    const sleepNotificationsEnabled = notificationSettings?.health?.sleepSchedule?.enabled ?? true;

    const response = {
      success: true,
      data: [todayRecord || await createDefaultRecord(userId, sleepNotificationsEnabled)],
      lastNightSleep: lastNightRecord || null,
      notificationsEnabled: sleepNotificationsEnabled
    };

    // Cache the response
    cache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to create default record
async function createDefaultRecord(userId, notificationsEnabled) {
  const defaultRecord = {
    userId,
    bedTime: new Date().setHours(22, 0, 0, 0),
    wakeTime: new Date().setHours(6, 0, 0, 0),
    quality: 'good',
    duration: 480,
    date: new Date(),
    settings: {
      notifications: notificationsEnabled,
      smartAlarm: true,
      sleepGoal: 8,
      trackMovement: true
    }
  };

  return await SleepData.create(defaultRecord);
}

// Add/Update sleep record
router.post('/', async (req, res) => {
  try {
    const { userId, bedTime, wakeTime, quality, notes, settings } = req.body;

    if (!userId || !bedTime || !wakeTime || !quality) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate duration with next day handling
    let duration = (new Date(wakeTime) - new Date(bedTime)) / (1000 * 60);
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours in minutes
    }

    // Update or create today's record
    const sleepData = await SleepData.findOneAndUpdate(
      {
        userId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      },
      {
        bedTime,
        wakeTime,
        quality,
        notes,
        duration,
        settings,
        date: new Date()
      },
      {
        new: true,
        upsert: true
      }
    );

    // Invalidate cache
    cache.del(`sleep_${userId}`);

    res.json({
      success: true,
      data: sleepData
    });
  } catch (error) {
    console.error('Error saving sleep data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update sleep notifications in both Sleep and Notification settings
router.put('/notifications', async (req, res) => {
  try {
    const { userId, enabled } = req.body;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Update notification settings
    await NotificationSettings.findOneAndUpdate(
      { userId },
      { 
        $set: { 'health.sleepSchedule.enabled': enabled }
      },
      { new: true }
    );

    // Update sleep settings
    const sleepData = await SleepData.findOneAndUpdate(
      { userId },
      { 
        $set: { 'settings.notifications': enabled }
      },
      { new: true }
    );

    // Invalidate cache
    cache.del(`sleep_${userId}`);

    res.json({
      success: true,
      message: 'Sleep notifications updated successfully',
      data: {
        sleepData,
        notificationsEnabled: enabled
      }
    });
  } catch (error) {
    console.error('Error updating sleep notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sleep notifications',
      error: error.message
    });
  }
});

// Update sleep settings
router.put('/settings', async (req, res) => {
  try {
    const { userId, settings } = req.body;
    if (!userId || !settings) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and settings are required' 
      });
    }

    const updatedData = await SleepData.findOneAndUpdate(
      { userId },
      { settings },
      { new: true }
    );

    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating sleep settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update sleep settings',
      error: error.message 
    });
  }
});

module.exports = router;

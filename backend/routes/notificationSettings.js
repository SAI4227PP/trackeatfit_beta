const express = require('express');
const router = express.Router();
const NotificationSettings = require('../models/NotificationSettings');

// Get user notification settings
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;  // Changed from req.body to req.query
    console.log('Received GET request for userId:', userId);

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    let settings = await NotificationSettings.findOne({ userId });
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = new NotificationSettings({
        userId,
        nutrition: {
          mealReminders: {
            enabled: true,
            description: 'Get reminded about your scheduled meals',
            icon: 'silverware-fork-knife',
            color: '#15803d',
          },
          waterReminders: { enabled: true },
          snackAlerts: { enabled: false }
        },
        health: {
          weightTracking: { enabled: true },
          exerciseReminders: { enabled: true },
          sleepSchedule: { enabled: false }
        },
        achievements: {
          milestones: { enabled: true },
          weeklyReport: { enabled: true }
        },
        payment: {
          success: {
            enabled: true,
            description: 'Get notified when your payment is successful',
            icon: 'credit-card-check',
            color: '#2563eb'
          },
          failed: {
            enabled: true,
            description: 'Get notified when your payment fails',
            icon: 'credit-card-remove',
            color: '#ef4444'
          }
        }
      });
      settings = await defaultSettings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch settings',
      error: error.message 
    });
  }
});

// Update notification settings
router.put('/', async (req, res) => {
  try {
    const { userId, ...settingsData } = req.body;
    console.log('Received PUT request for userId:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId },
      { $set: settingsData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this new route after the existing PUT route
router.put('/sleep-notifications', async (req, res) => {
  try {
    const { userId, enabled } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          'health.sleepSchedule.enabled': enabled,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Update sleep notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

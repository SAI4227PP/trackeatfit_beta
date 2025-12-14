const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const UserToken = require('../models/UserToken');
const NotificationSettings = require('../models/NotificationSettings');

// Store active user schedules
const userSchedules = new Map();

// --- Global Cron Scheduling Logic (Professional Version) ---

/**
 * Sends meal reminders to all users who have enabled meal reminders for the specified meal type.
 * Logs detailed information for monitoring and debugging, and handles errors gracefully.
 * @param {string} mealType - The type of meal (e.g., 'Breakfast', 'Lunch', 'Dinner').
 */
const sendMealReminders = async (mealType) => {
  console.info(`[GlobalCron] Initiating ${mealType} reminder broadcast to eligible users.`);
  try {
    const tokens = await UserToken.find({});
    if (!tokens.length) {
      console.warn(`[GlobalCron] No user tokens found. Skipping ${mealType} reminders.`);
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    for (const tokenDoc of tokens) {
      const userId = tokenDoc.userId;
      try {
        const settings = await NotificationSettings.findOne({ userId });
        if (settings?.nutrition?.mealReminders?.enabled) {
          console.info(`[GlobalCron] [${mealType}] Sending reminder to userId: ${userId}`);
          const result = await notificationService.sendMealReminder(userId, mealType);
          if (result) {
            sentCount++;
            console.info(`[GlobalCron] [${mealType}] Reminder sent successfully to userId: ${userId}`);
          } else {
            skippedCount++;
            console.warn(`[GlobalCron] [${mealType}] Failed to send reminder to userId: ${userId}`);
          }
        } else {
          skippedCount++;
          console.info(`[GlobalCron] [${mealType}] Meal reminders disabled for userId: ${userId}`);
        }
      } catch (userErr) {
        skippedCount++;
        console.error(`[GlobalCron] [${mealType}] Error processing userId: ${userId}:`, userErr);
      }
    }
    console.info(`[GlobalCron] [${mealType}] Meal reminder broadcast complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);
  } catch (err) {
    console.error(`[GlobalCron] [${mealType}] Critical error during meal reminder broadcast:`, err);
  }
};

const scheduleMealReminder = (cronTime, mealType) =>
  cron.schedule(cronTime, async () => {
    console.info(`[GlobalCron] [${mealType}] Cron triggered at ${new Date().toISOString()}`);
    await sendMealReminders(mealType);
  });

const globalBreakfastSchedule = scheduleMealReminder('0 2  * * *', 'Breakfast'); // 8:00 AM IST
const globalLunchSchedule = scheduleMealReminder('0 7  * * *', 'Lunch');      // 1:00 PM IST
const globalDinnerSchedule = scheduleMealReminder('0 13 * * *', 'Dinner');    // 7:00 PM IST
userSchedules.set('globalMealReminders', [globalBreakfastSchedule, globalLunchSchedule, globalDinnerSchedule]);

/**
 * Sends water reminders to all users who have enabled water reminders.
 * Logs detailed information for monitoring and debugging, and handles errors gracefully.
 */
const sendWaterReminders = async () => {
  console.info('[GlobalCron] Initiating water reminder broadcast to eligible users.');
  try {
    const tokens = await UserToken.find({});
    if (!tokens.length) {
      console.warn('[GlobalCron] No user tokens found. Skipping water reminders.');
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    for (const tokenDoc of tokens) {
      const userId = tokenDoc.userId;
      try {
        const settings = await NotificationSettings.findOne({ userId });
        if (settings?.nutrition?.waterReminders?.enabled) {
          console.info(`[GlobalCron] [Water] Sending reminder to userId: ${userId}`);
          const result = await notificationService.sendWaterReminder(userId);
          if (result) {
            sentCount++;
            console.info(`[GlobalCron] [Water] Reminder sent successfully to userId: ${userId}`);
          } else {
            skippedCount++;
            console.warn(`[GlobalCron] [Water] Failed to send reminder to userId: ${userId}`);
          }
        } else {
          skippedCount++;
          console.info(`[GlobalCron] [Water] Water reminders disabled for userId: ${userId}`);
        }
      } catch (userErr) {
        skippedCount++;
        console.error(`[GlobalCron] [Water] Error processing userId: ${userId}:`, userErr);
      }
    }
    console.info(`[GlobalCron] [Water] Water reminder broadcast complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);
  } catch (err) {
    console.error('[GlobalCron] [Water] Critical error during water reminder broadcast:', err);
  }
};

const globalWaterSchedule = cron.schedule('0 */2 * * *', async () => {
  console.info(`[GlobalCron] [Water] Cron triggered at ${new Date().toISOString()}`);
  await sendWaterReminders();
});
userSchedules.set('globalWaterReminder', [globalWaterSchedule]);

// Register FCM token
router.post('/register-token', async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    
    if (!userId || !fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and fcmToken are required' 
      });
    }

    await UserToken.findOneAndUpdate(
      { userId },
      { 
        userId,
        fcmToken,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'FCM token registered successfully. Notifications will be managed automatically.'
    });
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to register token',
      error: error.message 
    });
  }
});

// Update notification settings
router.put('/settings', async (req, res) => {
  try {
    const { userId, settings } = req.body;
    if (!userId || !settings) {
      return res.status(400).json({ error: 'User ID and settings are required' });
    }

    const updatedSettings = await NotificationSettings.findOneAndUpdate(
      { userId },
      { $set: settings },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Notification settings updated successfully.',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send meal reminder
router.post('/send/meal-reminder', async (req, res) => {
  try {
    const { userId, mealType } = req.body;
    
    if (!userId || !mealType) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and mealType are required' 
      });
    }

    const result = await notificationService.sendMealReminder(userId, mealType);
    res.json(result);
  } catch (error) {
    console.error('Error sending meal reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send meal reminder',
      error: error.message 
    });
  }
});

// Send water reminder
router.post('/send/water-reminder', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const result = await notificationService.sendWaterReminder(userId);
    res.json(result);
  } catch (error) {
    console.error('Error sending water reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send water reminder',
      error: error.message 
    });
  }
});

// Send exercise reminder
router.post('/send/exercise-reminder', async (req, res) => {
  try {
    const { userId, activity } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const result = await notificationService.sendExerciseReminder(userId, activity);
    res.json(result);
  } catch (error) {
    console.error('Error sending exercise reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send exercise reminder',
      error: error.message 
    });
  }
});

// Send sleep reminder
router.post('/send/sleep-reminder', async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and type are required' 
      });
    }

    const result = await notificationService.sendSleepReminder(userId, type);
    res.json(result);
  } catch (error) {
    console.error('Error sending sleep reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send sleep reminder',
      error: error.message 
    });
  }
});

// Send achievement notification
router.post('/send/achievement', async (req, res) => {
  try {
    const { userId, achievement } = req.body;
    
    if (!userId || !achievement) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and achievement are required' 
      });
    }

    const result = await notificationService.sendMilestoneAchieved(userId, achievement);
    res.json(result);
  } catch (error) {
    console.error('Error sending achievement notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send achievement notification',
      error: error.message 
    });
  }
});

// Send weekly report
router.post('/send/weekly-report', async (req, res) => {
  try {
    const { userId, stats } = req.body;
    
    if (!userId || !stats) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and stats are required' 
      });
    }

    const result = await notificationService.sendWeeklyReport(userId, stats);
    res.json(result);
  } catch (error) {
    console.error('Error sending weekly report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send weekly report',
      error: error.message 
    });
  }
});

// Send chat notification
router.post('/send/chat', async (req, res) => {
  try {
    const { userId, senderName, message } = req.body;
    
    if (!userId || !senderName || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, senderName, and message are required' 
      });
    }

    const result = await notificationService.sendChatNotification(userId, senderName, message);
    res.json(result);
  } catch (error) {
    console.error('Error sending chat notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send chat notification',
      error: error.message 
    });
  }
});

module.exports = router;

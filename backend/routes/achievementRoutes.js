const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const NotificationSettings = require('../models/NotificationSettings');
const notificationService = require('../services/notificationService');
const { notifyAllClients } = require('../middleware/sseMiddleware');

// Utility function to send achievement notifications
const sendAchievementNotifications = async (userId, achievements) => {
  try {
    // Check if achievement notifications are enabled
    const settings = await NotificationSettings.findOne({ userId });
    if (!settings?.achievements?.milestones?.enabled) {
      console.log('Achievement notifications disabled for user:', userId);
      return;
    }

    // Send notifications for each achievement
    for (const achievement of achievements) {
      try {
        await notificationService.sendMilestoneAchieved(userId, achievement);
      } catch (error) {
        console.error(`Error sending notification for achievement ${achievement.title}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendAchievementNotifications:', error);
  }
};

// Initialize or update user achievements
router.post('/init', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    let userAchievements = await Achievement.findOne({ userId });

    if (!userAchievements) {
      // Create initial achievement document
      userAchievements = new Achievement({
        userId,
        achievements: [],
        stats: {
          totalUnlocked: 0,
          streakAchievements: 0,
          mealAchievements: 0,
          levelAchievements: 0
        }
      });
    }

    await userAchievements.save();

    // Notify clients about the initialization
    notifyAllClients('achievements', {
      type: 'init',
      userId,
      achievements: userAchievements
    });

    res.status(200).json({
      success: true,
      achievements: userAchievements
    });

  } catch (error) {
    console.error('Error initializing achievements:', error);
    res.status(500).json({ error: 'Failed to initialize achievements' });
  }
});

router.post('/update-progress', async (req, res) => {
  try {
    const { userId, achievements } = req.body;

    if (!userId || !achievements || !Array.isArray(achievements)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request format' 
      });
    }

    let userAchievements = await Achievement.findOne({ userId });
    if (!userAchievements) {
      userAchievements = new Achievement({
        userId,
        achievements: [],
        stats: { totalUnlocked: 0 }
      });
    }

    const updatedAchievements = [];
    const now = new Date();

    // Create a Set of already unlocked achievement titles for this user
    const unlockedTitles = new Set(
      userAchievements.achievements
        .filter(a => a.isUnlocked)
        .map(a => a.title)
    );

    // Also, track titles being updated in this batch to avoid duplicates in the same request
    const batchTitles = new Set();

    for (const achievement of achievements) {
      const { achievementTitle, description, type, icon } = achievement;

      // Skip if already unlocked or already processed in this batch
      if (unlockedTitles.has(achievementTitle) || batchTitles.has(achievementTitle)) {
        continue;
      }

      const existingIndex = userAchievements.achievements.findIndex(
        a => a.title === achievementTitle
      );

      const achievementData = {
        title: achievementTitle,
        description: description || '',
        type: type || 'meals',
        isUnlocked: true,
        unlockedAt: now,
        icon: icon || 'trophy'
      };

      if (existingIndex === -1) {
        userAchievements.achievements.push(achievementData);
        updatedAchievements.push(achievementData);
      } else if (!userAchievements.achievements[existingIndex].isUnlocked) {
        userAchievements.achievements[existingIndex] = {
          ...userAchievements.achievements[existingIndex],
          ...achievementData
        };
        updatedAchievements.push(achievementData);
      }

      // Mark as processed in this batch
      batchTitles.add(achievementTitle);
    }

    // Deduplicate the achievements array by title (keep the latest unlocked if duplicates exist)
    const deduped = [];
    const seen = new Set();
    for (let i = userAchievements.achievements.length - 1; i >= 0; i--) {
      const a = userAchievements.achievements[i];
      if (!seen.has(a.title)) {
        deduped.unshift(a);
        seen.add(a.title);
      }
    }
    userAchievements.achievements = deduped;

    await userAchievements.save();

    // Send notifications for newly unlocked achievements
    if (updatedAchievements.length > 0) {
      await sendAchievementNotifications(userId, updatedAchievements);
    }

    // Notify clients about batch update
    notifyAllClients('achievements', {
      type: 'achievements-unlocked',
      userId,
      achievements: updatedAchievements,
      timestamp: now.toISOString()
    });

    res.status(200).json({
      success: true,
      achievements: updatedAchievements
    });

  } catch (error) {
    console.error('Achievement update error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get user achievements
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userAchievements = await Achievement.findOne({ userId });
    
    if (!userAchievements) {
      return res.status(404).json({ error: 'User achievements not found' });
    }

    res.status(200).json({
      success: true,
      achievements: userAchievements.achievements,
      stats: userAchievements.stats
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Add achievement
router.post('/add', async (req, res) => {
  const { userId, achievement } = req.body;

  try {
    const userAchievements = await Achievement.findOne({ userId });
    
    if (!userAchievements) {
      return res.status(404).json({ error: 'User achievements not found' });
    }

    // Prevent adding duplicate achievements by title
    if (userAchievements.achievements.some(a => a.title === achievement.title)) {
      return res.status(409).json({ error: 'Achievement already exists for this user' });
    }

    userAchievements.achievements.push({
      ...achievement,
      progress: { current: 0, target: 100 },
      isUnlocked: false
    });

    // Deduplicate after push (defensive)
    const deduped = [];
    const seen = new Set();
    for (let i = userAchievements.achievements.length - 1; i >= 0; i--) {
      const a = userAchievements.achievements[i];
      if (!seen.has(a.title)) {
        deduped.unshift(a);
        seen.add(a.title);
      }
    }
    userAchievements.achievements = deduped;

    await userAchievements.save();

    // Notify clients about the new achievement
    notifyAllClients('achievements', {
      type: 'achievement-added',
      userId,
      achievement
    });

    res.status(201).json({
      success: true,
      achievement: userAchievements.achievements[userAchievements.achievements.length - 1]
    });

  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ error: 'Failed to add achievement' });
  }
});

module.exports = router;

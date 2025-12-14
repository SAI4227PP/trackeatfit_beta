const admin = require('firebase-admin');
const UserToken = require('../models/UserToken');
const NotificationSettings = require('../models/NotificationSettings');

class NotificationService {
  async sendNotification(userId, type, category, title, body, data = {}) {
    try {
      console.log(`[sendNotification] Called for userId: ${userId}, type: ${type}, category: ${category}`);
      // Get user's notification settings
      const settings = await NotificationSettings.findOne({ userId });
      console.log(`[sendNotification] Notification settings for userId ${userId}:`, JSON.stringify(settings));
      if (!settings) {
        console.log('[sendNotification] No notification settings found for user:', userId);
        return false;
      }

      // Check if this type of notification is enabled
      const [mainCategory, subCategory] = type.split('.');
      if (!settings[mainCategory]?.[subCategory]?.enabled) {
        console.log(`[sendNotification] Notifications of type ${type} are disabled for user:`, userId);
        return false;
      }

      // Get user's FCM token
      const userToken = await UserToken.findOne({ userId });
      console.log(`[sendNotification] UserToken for userId ${userId}:`, JSON.stringify(userToken));
      if (!userToken || !userToken.fcmToken) {
        console.log('[sendNotification] No FCM token found for user:', userId);
        return false;
      }

      // Ensure all data values are strings for FCM
      const stringData = Object.fromEntries(
        Object.entries({
          type,
          category,
          ...data,
          timestamp: new Date().toISOString(),
        }).map(([k, v]) => [k, v != null ? String(v) : ''])
      );

      const notificationMessage = {
        notification: {
          title,
          body,
        },
        data: stringData,
        token: userToken.fcmToken,
        android: {
          priority: 'high',
          notification: {
            channelId: category,
            sound: 'default',
            priority: 'max',
            visibility: 'public',
            // vibrationPattern removed due to FCM payload error
            color: category === 'achievement' ? '#FFD700' : '#2563eb',
            ticker: title, // Helps with accessibility and notifications when app is closed
            tag: category, // Group similar notifications
          },
          // Enable direct boot and high priority
          directBootOk: true,
          priority: 'high'
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert', // Changed from background to alert for iOS
            'apns-expiration': '0'  // The message should be sent immediately
          },
          payload: {
            aps: {
              sound: category === 'achievement' ? 'achievement.caf' : 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1,
              'interruption-level': 'active', // High priority for iOS
              category: category,
              'thread-id': category // Group similar notifications
            }
          }
        }
      };

      console.log('[sendNotification] Sending notification with message:', JSON.stringify(notificationMessage));
      const response = await admin.messaging().send(notificationMessage);
      console.log('[sendNotification] Notification sent successfully:', response);
      return true;
    } catch (error) {
      console.error('[sendNotification] Error sending notification:', error);
      return false;
    }
  }

  // Nutrition notifications
  async sendMealReminder(userId, mealType) {
    const messages = {
      Breakfast: {
        title: '🍳 Time for Breakfast!',
        body: "Start your day with a healthy breakfast. Don't forget to log your meal!"
      },
      Lunch: {
        title: '🍽️ Lunch Time!',
        body: "Take a break and enjoy your lunch. Remember to log what you eat!"
      },
      Dinner: {
        title: '🌙 Dinner Time!',
        body: "Time for dinner! Keep track of your evening meal."
      }
    };

    const message = messages[mealType] || {
      title: `Time for ${mealType}!`,
      body: `Don't forget to log your ${mealType.toLowerCase()} meal!`
    };

    return this.sendNotification(
      userId,
      'nutrition.mealReminders',
      'meal_reminder',
      message.title,
      message.body,
      { mealType }
    );
  }

  async sendWaterReminder(userId) {
    console.log(`[sendWaterReminder] Called for userId: ${userId}`);
    const result = await this.sendNotification(
      userId,
      'nutrition.waterReminders',
      'water_reminder',
      '💧 Stay Hydrated!',
      'Time to drink some water! Track your intake to meet your daily goal.',
      { reminderType: 'water' }
    );
    console.log(`[sendWaterReminder] sendNotification result for userId: ${userId}:`, result);
    return result;
  }

  // Health notifications
  async sendWeightTrackingReminder(userId) {
    return this.sendNotification(
      userId,
      'health.weightTracking',
      'weight_tracking',
      'Weight Check-in',
      'Time for your weekly weight check-in!'
    );
  }

  async sendExerciseReminder(userId, activity = null) {
    const message = activity 
      ? `Time for your scheduled ${activity}`
      : 'Remember to stay active today!';
    
    return this.sendNotification(
      userId,
      'health.exerciseReminders',
      'exercise_reminder',
      'Exercise Reminder',
      message
    );
  }

  async sendSleepReminder(userId, type = 'bedtime') {
    const title = type === 'bedtime' ? 'Bedtime Reminder' : 'Wake-up Time';
    const message = type === 'bedtime' 
      ? 'Time to prepare for bed and get quality sleep!'
      : 'Good morning! Time to start your day.';

    return this.sendNotification(
      userId,
      'health.sleepSchedule',
      'sleep_reminder',
      title,
      message
    );
  }
  // Achievement notifications
  async sendMilestoneAchieved(userId, achievement) {
    try {
      // Create engaging achievement title based on type
      let title = '';
      let body = '';
      
      switch(achievement.type) {
        case 'level':
          title = '🌟 Level Up Achievement!';
          body = `Incredible! You've reached ${achievement.title}. Keep pushing your limits!`;
          break;
        case 'streak':
          title = '🔥 Streak Achievement!';
          body = `Amazing consistency! You've unlocked "${achievement.title}"!`;
          break;
        case 'meals':
          title = '🍳 Nutrition Achievement!';
          body = `Fantastic progress! You've earned "${achievement.title}"!`;
          break;
        default:
          title = '🏆 Achievement Unlocked!';
          body = `Congratulations! You've unlocked "${achievement.title}"!`;
      }

      return await this.sendNotification(
        userId,
        'achievements.milestones',
        'achievement',
        title,
        body,
        {
          achievementId: achievement._id?.toString(),
          achievementType: achievement.type,
          achievementTitle: achievement.title,
          achievementDescription: achievement.description,
          icon: achievement.icon,
          unlockedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error sending achievement notification:', error);
      return false;
    }
  }

  async sendWeeklyReport(userId, stats) {
    return this.sendNotification(
      userId,
      'achievements.weeklyReport',
      'weekly_report',
      'Your Weekly Progress Report',
      'Check out your achievements and progress this week!',
      { stats }
    );
  }

  // Chat notifications
  async sendChatNotification(userId, senderName, message) {
    return this.sendNotification(
      userId,
      'social.chat',
      'chat',
      `New message from ${senderName}`,
      message.content || 'New message',
      {
        senderId: message.sender ? message.sender.toString() : undefined,
        chatId: message.chatId ? message.chatId.toString() : undefined,
        messageId: message._id ? message._id.toString() : undefined,
        timestamp: message.timestamp ? message.timestamp.toISOString() : new Date().toISOString()
      }
    );
  }

  async sendStreakReminder(userId, currentStreak) {
    const title = '🔥 Keep Your Streak Going!';
    const body = currentStreak > 0 
      ? `Don't break your ${currentStreak}-day streak! Open the app to log today's meals.`
      : `Start a new streak today! Open the app to log your meals.`;

    return this.sendNotification(
      userId,
      'achievements.streaks',
      'streak_reminder',
      title,
      body,
      {
        type: 'streak_reminder',
        currentStreak,
        lastReminderSent: new Date().toISOString()
      }
    );
  }
}

// Add a test notification sender for server-side test cron
// NotificationService.prototype.sendTestNotification = async function(userId, fcmToken, title, body) {
//   try {
//     if (!fcmToken) {
//       // Try to fetch from DB if not provided
//       const userToken = await UserToken.findOne({ userId });
//       if (!userToken || !userToken.fcmToken) {
//         console.log('No FCM token found for user:', userId);
//         return false;
//       }
//       fcmToken = userToken.fcmToken;
//     }
//     const notificationMessage = {
//       notification: {
//         title,
//         body
//       },
//       data: {
//         type: 'test',
//         category: 'test',
//         timestamp: new Date().toISOString(),
//         test: 'true'
//       },
//       token: fcmToken,
//       android: {
//         priority: 'high',
//         notification: {
//           channelId: 'test',
//           sound: 'default',
//           priority: 'max',
//           visibility: 'public',
//           color: '#2563eb',
//           ticker: title,
//           tag: 'test',
//         },
//         directBootOk: true,
//         priority: 'high'
//       },
//       apns: {
//         headers: {
//           'apns-priority': '10',
//           'apns-push-type': 'alert',
//           'apns-expiration': '0'
//         },
//         payload: {
//           aps: {
//             sound: 'default',
//             badge: 1,
//             'content-available': 1,
//             'mutable-content': 1,
//             'interruption-level': 'active',
//             category: 'test',
//             'thread-id': 'test'
//           }
//         }
//       }
//     };
//     const response = await admin.messaging().send(notificationMessage);
//     console.log('[TestNotification] Sent:', response);
//     return true;
//   } catch (error) {
//     console.error('[TestNotification] Error:', error);
//     return false;
//   }
// };

// Export an instance of the service and the schedule function
const notificationService = new NotificationService();
module.exports = notificationService;

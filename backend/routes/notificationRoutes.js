const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const notificationService = require("../services/notificationService");
const UserToken = require("../models/UserToken");
const NotificationSettings = require("../models/NotificationSettings");
const User = require("../models/User");

// Store active user schedules
const userSchedules = new Map();

// --- Dynamic Per-User Meal Reminder Scheduling ---

/**
 * Converts a Date object to cron time format (minutes and hours)
 * @param {Date} time - The time to convert
 * @returns {string} Cron time string (e.g., "30 8" for 8:30)
 */
const dateToCronTime = (time) => {
  const date = new Date(time);
  // Validate date
  if (isNaN(date.getTime())) {
    console.error("[dateToCronTime] Invalid date provided:", time);
    return "0 0"; // Default to midnight if invalid
  }
  const minutes = date.getMinutes();
  const hours = date.getHours();
  return `${minutes} ${hours}`;
};

/**
 * Creates cron jobs for a user's custom water reminder schedule
 * @param {string} userId - The user's ID
 * @param {Object} waterSchedule - Water reminder schedule with intervalHours, startTime, endTime, enabled
 */
const scheduleUserWaterReminders = (userId, waterSchedule) => {
  const waterScheduleKey = `${userId}_water`;

  // Clear existing water schedules for this user
  if (userSchedules.has(waterScheduleKey)) {
    const existingSchedules = userSchedules.get(waterScheduleKey);
    existingSchedules.forEach((schedule) => schedule.stop());
    userSchedules.delete(waterScheduleKey);
  }

  if (!waterSchedule) {
    console.log(`[WaterSchedule] No water schedule for userId: ${userId}`);
    return;
  }

  // Check NotificationSettings to see if water reminders are enabled
  NotificationSettings.findOne({ userId })
    .then((settings) => {
      if (!settings?.nutrition?.waterReminders?.enabled) {
        console.log(
          `[WaterSchedule] Water reminders disabled in settings for userId: ${userId}`,
        );
        return;
      }
    })
    .catch((err) => {
      console.error(
        `[WaterSchedule] Error checking settings for userId: ${userId}:`,
        err,
      );
    });

  const intervalHours = waterSchedule.intervalHours || 2;

  // Schedule water reminder to run every X hours
  const cronPattern = `0 */${intervalHours} * * *`; // Every X hours at minute 0

  if (!cron.validate(cronPattern)) {
    console.error(
      `[WaterSchedule] Invalid cron pattern: ${cronPattern} for userId: ${userId}`,
    );
    return;
  }

  const schedule = cron.schedule(cronPattern, async () => {
    // Check if current time is within user's preferred time range
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;

    if (waterSchedule.startTime && waterSchedule.endTime) {
      const startDate = new Date(waterSchedule.startTime);
      const endDate = new Date(waterSchedule.endTime);
      const startTimeInMinutes =
        startDate.getHours() * 60 + startDate.getMinutes();
      const endTimeInMinutes = endDate.getHours() * 60 + endDate.getMinutes();

      if (
        currentTimeInMinutes < startTimeInMinutes ||
        currentTimeInMinutes > endTimeInMinutes
      ) {
        console.log(
          `[WaterSchedule] Current time ${currentHour}:${currentMinutes} is outside user's preferred range (${startDate.getHours()}:${startDate.getMinutes()} - ${endDate.getHours()}:${endDate.getMinutes()}) for userId: ${userId}`,
        );
        return;
      }
    }

    console.log(
      `[WaterSchedule] Sending water reminder to userId: ${userId} at ${now.toISOString()}`,
    );
    try {
      const settings = await NotificationSettings.findOne({ userId });
      if (settings?.nutrition?.waterReminders?.enabled) {
        await notificationService.sendWaterReminder(userId);
        console.log(`[WaterSchedule] Water reminder sent to userId: ${userId}`);
      } else {
        console.log(
          `[WaterSchedule] Water reminders disabled in settings for userId: ${userId}`,
        );
      }
    } catch (error) {
      console.error(
        `[WaterSchedule] Error sending water reminder to userId: ${userId}:`,
        error,
      );
    }
  });

  userSchedules.set(waterScheduleKey, [schedule]);
  console.log(
    `[WaterSchedule] Scheduled water reminders every ${intervalHours} hours for userId: ${userId}`,
  );
};

/**
 * Creates cron jobs for a user's custom meal schedule
 * @param {string} userId - The user's ID
 * @param {Array} meals - Array of meal objects with type, time, and enabled properties
 */
const scheduleUserMealReminders = (userId, meals) => {
  // Clear existing schedules for this user
  if (userSchedules.has(userId)) {
    const existingSchedules = userSchedules.get(userId);
    existingSchedules.forEach((schedule) => schedule.stop());
    userSchedules.delete(userId);
  }

  if (!meals || meals.length === 0) {
    console.log(`[UserSchedule] No meals to schedule for userId: ${userId}`);
    return;
  }

  const schedules = [];

  meals.forEach((meal) => {
    // Validate meal object
    if (!meal || !meal.type || !meal.time) {
      console.warn(
        `[UserSchedule] Invalid meal object for userId: ${userId}:`,
        meal,
      );
      return;
    }

    const cronTime = dateToCronTime(meal.time);

    // Validate cron time format (5 fields: minute hour day month weekday)
    if (!cron.validate(`${cronTime} * * * *`)) {
      console.error(
        `[UserSchedule] Invalid cron format: ${cronTime} for meal: ${meal.type}`,
      );
      return;
    }

    const schedule = cron.schedule(`${cronTime} * * * *`, async () => {
      console.log(
        `[UserSchedule] Checking ${meal.type} reminder for userId: ${userId} at ${new Date().toISOString()}`,
      );
      try {
        const settings = await NotificationSettings.findOne({ userId });
        if (settings?.nutrition?.mealReminders?.enabled) {
          await notificationService.sendMealReminder(userId, meal.type);
          console.log(
            `[UserSchedule] ${meal.type} reminder sent to userId: ${userId}`,
          );
        } else {
          console.log(
            `[UserSchedule] Meal reminders disabled in settings for userId: ${userId}`,
          );
        }
      } catch (error) {
        console.error(
          `[UserSchedule] Error sending ${meal.type} reminder to userId: ${userId}:`,
          error,
        );
      }
    });

    schedules.push(schedule);
    console.log(
      `[UserSchedule] Scheduled ${meal.type} at ${cronTime} for userId: ${userId}`,
    );
  });

  userSchedules.set(userId, schedules);
  console.log(
    `[UserSchedule] Total ${schedules.length} meal reminders scheduled for userId: ${userId}`,
  );
};

/**
 * Initializes meal and water reminder schedules for all users on server start
 */
const initializeAllUserSchedules = async () => {
  console.log("[UserSchedule] Initializing schedules for all users...");
  try {
    const users = await User.find({});
    let mealScheduledCount = 0;
    let waterScheduledCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Schedule meal reminders
        if (user.mealSchedule?.meals && user.mealSchedule.meals.length > 0) {
          scheduleUserMealReminders(
            user._id.toString(),
            user.mealSchedule.meals,
          );
          mealScheduledCount++;
        }

        // Schedule water reminders
        if (user.waterReminderSchedule) {
          scheduleUserWaterReminders(
            user._id.toString(),
            user.waterReminderSchedule,
          );
          waterScheduledCount++;
        }
      } catch (userError) {
        errorCount++;
        console.error(
          `[UserSchedule] Error scheduling for user ${user._id}:`,
          userError,
        );
        // Continue with next user
      }
    }

    console.log(
      `[UserSchedule] Initialized schedules - Meals: ${mealScheduledCount}, Water: ${waterScheduledCount}, Errors: ${errorCount}`,
    );
  } catch (error) {
    console.error("[UserSchedule] Error initializing user schedules:", error);
  }
};

// Initialize schedules on server start
initializeAllUserSchedules();

// --- Global Cron Scheduling Logic (Professional Version) ---

/**
 * Sends meal reminders to all users who have enabled meal reminders for the specified meal type.
 * This is used for users who don't have custom meal schedules.
 * Logs detailed information for monitoring and debugging, and handles errors gracefully.
 * @param {string} mealType - The type of meal (e.g., 'Breakfast', 'Lunch', 'Dinner').
 */
const sendMealReminders = async (mealType) => {
  console.info(
    `[GlobalCron] Initiating ${mealType} reminder broadcast to users without custom schedules.`,
  );
  try {
    const tokens = await UserToken.find({});
    if (!tokens.length) {
      console.warn(
        `[GlobalCron] No user tokens found. Skipping ${mealType} reminders.`,
      );
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    for (const tokenDoc of tokens) {
      const userId = tokenDoc.userId;
      try {
        // Check if user has custom meal schedule
        const user = await User.findById(userId);
        if (user?.mealSchedule?.meals && user.mealSchedule.meals.length > 0) {
          console.info(
            `[GlobalCron] [${mealType}] User ${userId} has custom schedule, skipping global reminder`,
          );
          skippedCount++;
          continue;
        }

        const settings = await NotificationSettings.findOne({ userId });
        if (settings?.nutrition?.mealReminders?.enabled) {
          console.info(
            `[GlobalCron] [${mealType}] Sending reminder to userId: ${userId}`,
          );
          const result = await notificationService.sendMealReminder(
            userId,
            mealType,
          );
          if (result) {
            sentCount++;
            console.info(
              `[GlobalCron] [${mealType}] Reminder sent successfully to userId: ${userId}`,
            );
          } else {
            skippedCount++;
            console.warn(
              `[GlobalCron] [${mealType}] Failed to send reminder to userId: ${userId}`,
            );
          }
        } else {
          skippedCount++;
          console.info(
            `[GlobalCron] [${mealType}] Meal reminders disabled for userId: ${userId}`,
          );
        }
      } catch (userErr) {
        skippedCount++;
        console.error(
          `[GlobalCron] [${mealType}] Error processing userId: ${userId}:`,
          userErr,
        );
      }
    }
    console.info(
      `[GlobalCron] [${mealType}] Meal reminder broadcast complete. Sent: ${sentCount}, Skipped: ${skippedCount}`,
    );
  } catch (err) {
    console.error(
      `[GlobalCron] [${mealType}] Critical error during meal reminder broadcast:`,
      err,
    );
  }
};

const scheduleMealReminder = (cronTime, mealType) =>
  cron.schedule(cronTime, async () => {
    console.info(
      `[GlobalCron] [${mealType}] Cron triggered at ${new Date().toISOString()}`,
    );
    await sendMealReminders(mealType);
  });

const globalBreakfastSchedule = scheduleMealReminder("0 2  * * *", "Breakfast"); // 8:00 AM IST
const globalLunchSchedule = scheduleMealReminder("0 7  * * *", "Lunch"); // 1:00 PM IST
const globalDinnerSchedule = scheduleMealReminder("0 13 * * *", "Dinner"); // 7:00 PM IST
userSchedules.set("globalMealReminders", [
  globalBreakfastSchedule,
  globalLunchSchedule,
  globalDinnerSchedule,
]);

/**
 * Sends water reminders to users who DON'T have custom water schedules.
 * This is the global fallback that runs every 2 hours.
 */
const sendWaterReminders = async () => {
  // Check if current time is within reasonable hours (8 AM - 10 PM by default)
  const now = new Date();
  const currentHour = now.getHours();
  const defaultStartHour = 8;
  const defaultEndHour = 22;

  if (currentHour < defaultStartHour || currentHour >= defaultEndHour) {
    console.info(
      `[GlobalCron] [Water] Current hour ${currentHour} is outside default range (${defaultStartHour}-${defaultEndHour}). Skipping global water reminders.`,
    );
    return;
  }

  console.info(
    "[GlobalCron] Initiating water reminder broadcast to users without custom schedules.",
  );
  try {
    const tokens = await UserToken.find({});
    if (!tokens.length) {
      console.warn(
        "[GlobalCron] No user tokens found. Skipping water reminders.",
      );
      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    for (const tokenDoc of tokens) {
      const userId = tokenDoc.userId;
      try {
        // Check if user has custom water reminder schedule
        const user = await User.findById(userId);
        if (user?.waterReminderSchedule?.intervalHours) {
          console.info(
            `[GlobalCron] [Water] User ${userId} has custom schedule, skipping global reminder`,
          );
          skippedCount++;
          continue;
        }

        const settings = await NotificationSettings.findOne({ userId });
        if (settings?.nutrition?.waterReminders?.enabled) {
          console.info(
            `[GlobalCron] [Water] Sending reminder to userId: ${userId}`,
          );
          const result = await notificationService.sendWaterReminder(userId);
          if (result) {
            sentCount++;
            console.info(
              `[GlobalCron] [Water] Reminder sent successfully to userId: ${userId}`,
            );
          } else {
            skippedCount++;
            console.warn(
              `[GlobalCron] [Water] Failed to send reminder to userId: ${userId}`,
            );
          }
        } else {
          skippedCount++;
          console.info(
            `[GlobalCron] [Water] Water reminders disabled for userId: ${userId}`,
          );
        }
      } catch (userErr) {
        skippedCount++;
        console.error(
          `[GlobalCron] [Water] Error processing userId: ${userId}:`,
          userErr,
        );
      }
    }
    console.info(
      `[GlobalCron] [Water] Water reminder broadcast complete. Sent: ${sentCount}, Skipped: ${skippedCount}`,
    );
  } catch (err) {
    console.error(
      "[GlobalCron] [Water] Critical error during water reminder broadcast:",
      err,
    );
  }
};

const globalWaterSchedule = cron.schedule("0 */2 * * *", async () => {
  console.info(
    `[GlobalCron] [Water] Cron triggered at ${new Date().toISOString()}`,
  );
  await sendWaterReminders();
});
userSchedules.set("globalWaterReminder", [globalWaterSchedule]);

// Register FCM token
router.post("/register-token", async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: "userId and fcmToken are required",
      });
    }

    await UserToken.findOneAndUpdate(
      { userId },
      {
        userId,
        fcmToken,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true },
    );

    res.json({
      success: true,
      message:
        "FCM token registered successfully. Notifications will be managed automatically.",
    });
  } catch (error) {
    console.error("Error registering token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register token",
      error: error.message,
    });
  }
});

// Save meal schedule and update notification times
/**
 * Expected request body:
 * {
 *   userId: string,
 *   mealSchedule: {
 *     meals: [{
 *       id: number,
 *       type: string,
 *       time: ISO string or Date,
 *       enabled: boolean
 *     }],
 *     preferences: {
 *       reminders: boolean,
 *       reminderTime: number,
 *       waterReminders: boolean,
 *       weekendSchedule: boolean
 *     }
 *   }
 * }
 */
router.post("/meal-schedule", async (req, res) => {
  try {
    const { userId, mealSchedule } = req.body;

    console.log("[meal-schedule POST] Received request:", {
      userId,
      mealSchedule: mealSchedule
        ? {
            mealsCount: mealSchedule.meals?.length,
            hasPreferences: !!mealSchedule.preferences,
            meals: mealSchedule.meals,
          }
        : null,
    });

    if (!userId || !mealSchedule) {
      console.error("[meal-schedule POST] Missing userId or mealSchedule");
      return res.status(400).json({
        success: false,
        message: "userId and mealSchedule are required",
      });
    }

    // Validate mealSchedule structure
    if (!mealSchedule.meals || !Array.isArray(mealSchedule.meals)) {
      console.error(
        "[meal-schedule POST] Invalid meals array:",
        mealSchedule.meals,
      );
      return res.status(400).json({
        success: false,
        message: "mealSchedule.meals must be an array",
      });
    }

    // Validate each meal object
    console.log(
      "[meal-schedule POST] Validating meals:",
      mealSchedule.meals.map((m) => ({
        hasType: !!m.type,
        hasTime: !!m.time,
      })),
    );

    const invalidMeals = mealSchedule.meals.filter(
      (meal) => !meal.type || !meal.time,
    );
    if (invalidMeals.length > 0) {
      console.error("[meal-schedule POST] Invalid meals found:", invalidMeals);
      return res.status(400).json({
        success: false,
        message: "Each meal must have type and time properties",
        invalidMeals: invalidMeals,
      });
    }

    console.log(
      "[meal-schedule POST] All validations passed. Updating user...",
    );

    // Update user's meal schedule in database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        mealSchedule,
        "meta.lastUpdated": new Date(),
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Schedule notifications based on the new meal times
    if (mealSchedule.meals && mealSchedule.meals.length > 0) {
      try {
        scheduleUserMealReminders(userId, mealSchedule.meals);
      } catch (scheduleError) {
        console.error(
          `[meal-schedule] Error scheduling reminders for userId: ${userId}:`,
          scheduleError,
        );
        // Continue - schedule was saved even if cron setup failed
      }
    }

    res.json({
      success: true,
      message: "Meal schedule saved and notifications updated successfully",
      data: user.mealSchedule,
    });
  } catch (error) {
    console.error("Error saving meal schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save meal schedule",
      error: error.message,
    });
  }
});

// Get user's meal schedule
router.get("/meal-schedule", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Also fetch notification settings for water and meal reminders
    let notificationSettings = await NotificationSettings.findOne({ userId });

    // Create default settings if they don't exist
    if (!notificationSettings) {
      notificationSettings = await NotificationSettings.create({
        userId,
        nutrition: {
          mealReminders: { enabled: true },
          waterReminders: { enabled: true },
          snackAlerts: { enabled: false },
        },
      });
      console.log(
        `[GET meal-schedule] Created default notification settings for userId: ${userId}`,
      );
    }

    res.json({
      success: true,
      data: {
        ...(user.mealSchedule?.toObject?.() ||
          user.mealSchedule || { meals: [], preferences: {} }),
        notificationSettings: {
          mealReminders:
            notificationSettings.nutrition?.mealReminders?.enabled ?? true,
          waterReminders:
            notificationSettings.nutrition?.waterReminders?.enabled ?? true,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching meal schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meal schedule",
      error: error.message,
    });
  }
});

// Save water reminder schedule
router.post("/water-reminder-schedule", async (req, res) => {
  try {
    const { userId, waterReminderSchedule } = req.body;

    console.log("[water-reminder-schedule POST] Received request:", {
      userId,
      waterReminderSchedule,
    });

    if (!userId || !waterReminderSchedule) {
      return res.status(400).json({
        success: false,
        message: "userId and waterReminderSchedule are required",
      });
    }

    // Validate intervalHours
    if (
      waterReminderSchedule.intervalHours &&
      (waterReminderSchedule.intervalHours < 1 ||
        waterReminderSchedule.intervalHours > 12)
    ) {
      return res.status(400).json({
        success: false,
        message: "intervalHours must be between 1 and 12",
      });
    }

    // Update user's water reminder schedule
    const user = await User.findByIdAndUpdate(
      userId,
      {
        waterReminderSchedule,
        "meta.lastUpdated": new Date(),
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Schedule water reminders based on the new settings
    try {
      scheduleUserWaterReminders(userId, waterReminderSchedule);
    } catch (scheduleError) {
      console.error(
        `[water-reminder-schedule] Error scheduling reminders for userId: ${userId}:`,
        scheduleError,
      );
      // Continue - schedule was saved even if cron setup failed
    }

    res.json({
      success: true,
      message: "Water reminder schedule saved successfully",
      data: user.waterReminderSchedule,
    });
  } catch (error) {
    console.error("Error saving water reminder schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save water reminder schedule",
      error: error.message,
    });
  }
});

// Get water reminder schedule
router.get("/water-reminder-schedule", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user.waterReminderSchedule || {
        intervalHours: 2,
        startTime: "08:00",
        endTime: "22:00",
      },
    });
  } catch (error) {
    console.error("Error fetching water reminder schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch water reminder schedule",
      error: error.message,
    });
  }
});

// Update notification settings
router.put("/settings", async (req, res) => {
  try {
    const { userId, settings } = req.body;
    if (!userId || !settings) {
      return res
        .status(400)
        .json({ error: "User ID and settings are required" });
    }

    const updatedSettings = await NotificationSettings.findOneAndUpdate(
      { userId },
      { $set: settings },
      { new: true, upsert: true },
    );

    res.json({
      success: true,
      message: "Notification settings updated successfully.",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send meal reminder
router.post("/send/meal-reminder", async (req, res) => {
  try {
    const { userId, mealType } = req.body;

    if (!userId || !mealType) {
      return res.status(400).json({
        success: false,
        message: "userId and mealType are required",
      });
    }

    const result = await notificationService.sendMealReminder(userId, mealType);
    res.json(result);
  } catch (error) {
    console.error("Error sending meal reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send meal reminder",
      error: error.message,
    });
  }
});

// Send water reminder
router.post("/send/water-reminder", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const result = await notificationService.sendWaterReminder(userId);
    res.json(result);
  } catch (error) {
    console.error("Error sending water reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send water reminder",
      error: error.message,
    });
  }
});

// Send exercise reminder
router.post("/send/exercise-reminder", async (req, res) => {
  try {
    const { userId, activity } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const result = await notificationService.sendExerciseReminder(
      userId,
      activity,
    );
    res.json(result);
  } catch (error) {
    console.error("Error sending exercise reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send exercise reminder",
      error: error.message,
    });
  }
});

// Send sleep reminder
router.post("/send/sleep-reminder", async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: "userId and type are required",
      });
    }

    const result = await notificationService.sendSleepReminder(userId, type);
    res.json(result);
  } catch (error) {
    console.error("Error sending sleep reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send sleep reminder",
      error: error.message,
    });
  }
});

// Send achievement notification
router.post("/send/achievement", async (req, res) => {
  try {
    const { userId, achievement } = req.body;

    if (!userId || !achievement) {
      return res.status(400).json({
        success: false,
        message: "userId and achievement are required",
      });
    }

    const result = await notificationService.sendMilestoneAchieved(
      userId,
      achievement,
    );
    res.json(result);
  } catch (error) {
    console.error("Error sending achievement notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send achievement notification",
      error: error.message,
    });
  }
});

// Send weekly report
router.post("/send/weekly-report", async (req, res) => {
  try {
    const { userId, stats } = req.body;

    if (!userId || !stats) {
      return res.status(400).json({
        success: false,
        message: "userId and stats are required",
      });
    }

    const result = await notificationService.sendWeeklyReport(userId, stats);
    res.json(result);
  } catch (error) {
    console.error("Error sending weekly report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send weekly report",
      error: error.message,
    });
  }
});

// Send chat notification
router.post("/send/chat", async (req, res) => {
  try {
    const { userId, senderName, message } = req.body;

    if (!userId || !senderName || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, senderName, and message are required",
      });
    }

    const result = await notificationService.sendChatNotification(
      userId,
      senderName,
      message,
    );
    res.json(result);
  } catch (error) {
    console.error("Error sending chat notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send chat notification",
      error: error.message,
    });
  }
});

module.exports = router;

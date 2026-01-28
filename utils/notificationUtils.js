import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PermissionsAndroid, Platform } from "react-native";

// Add logging utility
const NOTIFICATION_LOGS_KEY = "userNotifications";

const logEvent = async (event, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
  };

  try {
    const logs = (await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY)) || "[]";
    const parsedLogs = JSON.parse(logs);
    parsedLogs.unshift(logEntry);
    await AsyncStorage.setItem(
      NOTIFICATION_LOGS_KEY,
      JSON.stringify(parsedLogs.slice(0, 100)),
    );
    console.log(`[Notification] ${event}:`, details);
  } catch (error) {
    console.error("[Notification Log Error]:", error);
  }
};

// Helper function to store a notification
export const storeNotification = async (notification) => {
  try {
    console.log("[Notification] Storing notification:", notification);
    const logsString = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY);
    let logs = [];
    try {
      logs = logsString ? JSON.parse(logsString) : [];
    } catch (e) {
      console.error("[Notification] Error parsing existing logs:", e);
    }

    if (!Array.isArray(logs)) logs = [];

    // Add unique ID if not present
    const notificationWithId = {
      ...notification,
      id:
        notification.id ||
        `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to beginning of array
    logs.unshift(notificationWithId);

    // Keep only last 100 notifications
    const trimmedLogs = logs.slice(0, 100);

    await AsyncStorage.setItem(
      NOTIFICATION_LOGS_KEY,
      JSON.stringify(trimmedLogs),
    );
    console.log("[Notification] Successfully stored notification");
    return true;
  } catch (error) {
    console.error("[Notification] Error storing notification:", error);
    return false;
  }
};

// Configure notification channels (Android)
const configureChannels = async () => {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: "default",
      name: "Default",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500], // even number, positive values
      lights: true,
      lightColor: "#FF231F7C",
      visibility: AndroidVisibility.PUBLIC,
    });
    await notifee.createChannel({
      id: "meal_reminder",
      name: "Meal Reminders",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500], // even number, positive values
      lights: true,
      lightColor: "#2563eb",
      visibility: AndroidVisibility.PUBLIC,
    });
    await notifee.createChannel({
      id: "achievement",
      name: "Achievements",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [500, 110, 500, 110], // even number, positive values
      lights: true,
      lightColor: "#FFD700",
      visibility: AndroidVisibility.PUBLIC,
    });
    await notifee.createChannel({
      id: "chat",
      name: "Chat Messages",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500], // even number, positive values
      lights: true,
      lightColor: "#2563eb",
      visibility: AndroidVisibility.PUBLIC,
    });
    await notifee.createChannel({
      id: "water_reminder",
      name: "Water Reminders",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500], // even number, positive values
      lights: true,
      lightColor: "#2563eb",
      visibility: AndroidVisibility.PUBLIC,
    });
    await logEvent("ANDROID_CHANNELS_CREATED", {});
  }
};

/**
 * Checks if notification permissions are granted.
 * Handles both iOS and Android, and logs all outcomes.
 */
export const checkNotificationPermission = async () => {
  try {
    let isEnabled = false;
    let storedStatus = await AsyncStorage.getItem("notificationEnabled");

    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        isEnabled = granted;
      } else {
        isEnabled = true;
      }
    } else {
      // For iOS, we'll rely on notifee's permission check in the future
      isEnabled = true;
    }

    isEnabled = isEnabled && storedStatus === "true";
    await logEvent("CHECK_PERMISSION", { storedStatus, isEnabled });
    return isEnabled;
  } catch (error) {
    await logEvent("CHECK_PERMISSION_ERROR", { error: error.message });
    return false;
  }
};

/**
 * Requests notification permissions from the user.
 * Handles both iOS and Android, with robust error handling and logging.
 */
export const requestNotificationPermission = async () => {
  try {
    await logEvent("REQUEST_PERMISSION_START", {});
    await configureChannels();

    let permissionGranted = false;

    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        permissionGranted = true;
      }
    } else {
      // For iOS, we'll use notifee's permission request in the future
      permissionGranted = true;
    }

    await logEvent("PERMISSION_REQUEST", {
      platform: Platform.OS,
      permissionGranted,
    });

    if (permissionGranted) {
      await AsyncStorage.setItem("notificationEnabled", "true");
      await logEvent("PERMISSION_GRANTED", {});
      return true;
    } else {
      await AsyncStorage.setItem("notificationEnabled", "false");
      await logEvent("PERMISSION_DENIED", {});
      return false;
    }
  } catch (error) {
    await logEvent("PERMISSION_REQUEST_ERROR", { error: error.message });
    return false;
  }
};

/**
 * Registers for push notifications, ensuring permissions are handled robustly.
 */
export const registerForPushNotifications = async () => {
  try {
    await logEvent("REGISTER_START", { platform: Platform.OS });
    await configureChannels();

    // Check and request permission if needed
    let permissionOk = await checkNotificationPermission();
    if (!permissionOk) {
      permissionOk = await requestNotificationPermission();
    }

    if (!permissionOk) {
      await logEvent("PERMISSION_DENIED", { platform: Platform.OS });
      return null;
    }

    // Get FCM token from Firebase
    const messaging = (await import("@react-native-firebase/messaging"))
      .default;
    const fcmToken = await messaging().getToken();

    if (!fcmToken) {
      await logEvent("FCM_TOKEN_ERROR", { error: "No token received" });
      return null;
    }

    await AsyncStorage.setItem("notificationEnabled", "true");
    await AsyncStorage.setItem("notificationTimestamp", Date.now().toString());
    await logEvent("REGISTRATION_SUCCESS", { tokenLength: fcmToken.length });
    return fcmToken;
  } catch (error) {
    await logEvent("REGISTRATION_ERROR", { error: error.message });
    return null;
  }
};

const formatNotificationTime = () => {
  const now = new Date();
  const minutes = Math.floor(now.getTime() / 60000);

  if (minutes < 60) {
    return `${minutes} min ago`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hr ago`;
  }
  return now.toLocaleDateString();
};

// Generate a unique ID combining timestamp and random string
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${randomStr}`;
};

// Format achievement notification for display
const formatAchievementNotification = (data) => {
  const { achievementTitle, achievementType, achievementDescription, icon } =
    data;
  return {
    title: achievementTitle || "Achievement Unlocked!",
    message: achievementDescription || "You have earned a new achievement!",
    icon: icon || "trophy-variant",
    type: "achievement",
    category: "achievement",
    priority: "high",
  };
};

export const logNotification = async (notification, action = "received") => {
  try {
    // notification: { title, body, data }
    const { data, title, body } = notification;
    let formattedNotification;

    if (data?.type === "achievement") {
      formattedNotification = formatAchievementNotification(data);
    } else {
      formattedNotification = {
        id: data?.id || generateUniqueId(),
        type: data?.type || "system",
        title: title || "Notification",
        message: body || "",
        time: formatNotificationTime(),
        read: false,
        timestamp: new Date().toISOString(),
        action,
        data,
      };
    }

    await logEvent("NOTIFICATION_RECEIVED", {
      id: formattedNotification.id,
      type: formattedNotification.type,
      action,
    });

    const existingLogsString = await AsyncStorage.getItem("notificationLogs");
    const existingLogs = existingLogsString
      ? JSON.parse(existingLogsString)
      : [];
    const updatedLogs = [formattedNotification, ...existingLogs].slice(0, 50);
    await AsyncStorage.setItem("notificationLogs", JSON.stringify(updatedLogs));
    return updatedLogs;
  } catch (error) {
    await logEvent("NOTIFICATION_LOG_ERROR", { error: error.message });
    return [];
  }
};

export const loadNotificationHistory = async () => {
  try {
    const logs = await AsyncStorage.getItem("notificationLogs");
    const parsedLogs = logs ? JSON.parse(logs) : [];
    await logEvent("HISTORY_LOADED", { count: parsedLogs.length });
    return parsedLogs;
  } catch (error) {
    await logEvent("HISTORY_LOAD_ERROR", { error: error.message });
    return [];
  }
};

export const clearNotificationHistory = async () => {
  try {
    await AsyncStorage.setItem("notificationLogs", JSON.stringify([]));
    await logEvent("HISTORY_CLEARED", {});
    return true;
  } catch (error) {
    await logEvent("HISTORY_CLEAR_ERROR", { error: error.message });
    return false;
  }
};

// Display a local notification using notifee
export const displayLocalNotification = async ({
  title,
  body,
  data = {},
  androidChannelId = "default",
}) => {
  try {
    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: androidChannelId,
        smallIcon: "ic_launcher", // ensure you have this icon in your project
        pressAction: { id: "default" },
      },
    });
    await logEvent("LOCAL_NOTIFICATION_DISPLAYED", { title, body, data });
  } catch (error) {
    await logEvent("LOCAL_NOTIFICATION_ERROR", { error: error.message });
  }
};

// Handle chat notifications
const handleChatNotification = async (notification) => {
  const { data } = notification.request.content;
  if (data?.type === "chat") {
    try {
      // Navigate to chat when notification is tapped
      if (data.chatId) {
        const friendData = await getFriendDataFromChatId(data.chatId);
        if (friendData) {
          router.push({
            pathname: "/Home/friends/Chat",
            params: {
              friend: encodeURIComponent(JSON.stringify(friendData)),
            },
          });
        }
      }
    } catch (error) {
      console.error("Error handling chat notification:", error);
    }
  }
};

// Helper function to get friend data from chat ID
const getFriendDataFromChatId = async (chatId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(
      `https://healthifyme-o9qv.onrender.com/api/chats/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) throw new Error("Failed to fetch chat data");

    const chatData = await response.json();
    const otherParticipant = chatData.participants.find(
      (p) => p._id !== user?._id,
    );

    return otherParticipant;
  } catch (error) {
    console.error("Error fetching friend data:", error);
    return null;
  }
};

// Placeholder for future push notification service
export const setupBackgroundHandler = () => {
  // To be implemented with a different push notification service
  console.log(
    "Background handler will be implemented with a different service",
  );
};

/**
 * Creates notification settings document for the user if not exists.
 * This can be called after permission is granted, even if the notification screen is never opened.
 */
export const createNotificationSettingsIfNotExists = async (
  userId,
  defaultNotificationData,
) => {
  try {
    // Check if doc exists
    const response = await fetch(
      `https://healthifyme-o9qv.onrender.com/api/notification-settings?userId=${userId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status === 404) {
      // Create the document with all enabled by default
      const createRes = await fetch(
        "https://healthifyme-o9qv.onrender.com/api/notification-settings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            ...Object.fromEntries(
              Object.entries(defaultNotificationData).map(
                ([category, items]) => [
                  category,
                  Object.fromEntries(
                    Object.entries(items).map(([key, item]) => [
                      key,
                      { enabled: true },
                    ]),
                  ),
                ],
              ),
            ),
          }),
        },
      );
      if (!createRes.ok)
        throw new Error("Failed to create notification settings");
      return true;
    }
    // Already exists
    return true;
  } catch (error) {
    console.error("Error in createNotificationSettingsIfNotExists:", error);
    return false;
  }
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotifications } from "../utils/notificationUtils";

const API_URL = "https://trackeatfit.onrender.com";

export const registerFCMToken = async () => {
  try {
    console.log("[Notification] TOKEN_REGISTRATION_START");
    // Check for auth token first
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      console.warn("[Notification] NO_AUTH_TOKEN");
      return false;
    }

    // Get the user ID
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "[Notification] NO_USER_ID - Make sure userId is set in AsyncStorage after login.",
      );
      // Optionally: trigger a user/session refresh here
      return false;
    }

    // Always get a fresh token
    const token = await registerForPushNotifications();
    console.log("[Notification] TOKEN_RECEIVED:", {
      token: token ? "exists" : "null",
    });

    if (token) {
      // Always try to register the token with the server
      console.log("[Notification] SENDING_TOKEN_TO_SERVER");
      try {
        const response = await fetch(
          `${API_URL}/api/notifications/register-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              userId: userId,
              fcmToken: token,
            }),
          },
        );

        if (!response.ok) {
          console.error(
            "[Notification] SERVER_REGISTRATION_FAILED:",
            await response.text(),
          );
          throw new Error("Failed to register FCM token with server");
        }

        console.log("[Notification] SERVER_REGISTRATION_SUCCESS");

        // Save both the token and a timestamp
        await AsyncStorage.setItem("pushToken", token);
        await AsyncStorage.setItem("pushTokenTimestamp", Date.now().toString());
        await AsyncStorage.setItem("pushTokenUserId", userId);

        return true;
      } catch (error) {
        console.error("[Notification] SERVER_REGISTRATION_ERROR:", error);
        throw error;
      }
    }

    console.log("[Notification] NO_VALID_TOKEN");
    return false;
  } catch (error) {
    console.error("Error in registerFCMToken:", error);
    return false;
  }
};

export const refreshFCMToken = async () => {
  try {
    const token = await registerForPushNotifications();
    if (token) {
      return await registerFCMToken();
    }
    return false;
  } catch (error) {
    console.error("Error refreshing FCM token:", error);
    return false;
  }
};

// All FCM token logic uses the modular API via registerForPushNotifications in notificationUtils.js

// Function to cancel all scheduled notifications
export const cancelAllScheduledNotifications = async () => {
  try {
    const module = require("@notifee/react-native");
    const notifee = module?.default;
    if (!notifee) return false;

    await notifee.cancelAllNotifications();
    return true;
  } catch (error) {
    console.error("Error canceling notifications:", error);
    return false;
  }
};

// Helper to get the next trigger time for a given hour/minute (today or tomorrow)
function getNextTriggerTime(hour, minute) {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger.getTime();
}

export const validateStoredToken = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("pushToken");
    const storedUserId = await AsyncStorage.getItem("pushTokenUserId");
    const currentUserId = await AsyncStorage.getItem("userId");
    const tokenTimestamp = await AsyncStorage.getItem("pushTokenTimestamp");

    // Check if token exists and belongs to current user
    if (!storedToken || !storedUserId || storedUserId !== currentUserId) {
      console.log(
        "[Notification] TOKEN_INVALID: User mismatch or missing token",
      );
      return false;
    }

    // Check if token is more than 7 days old
    if (tokenTimestamp) {
      const age = Date.now() - parseInt(tokenTimestamp);
      if (age > 7 * 24 * 60 * 60 * 1000) {
        // 7 days
        console.log("[Notification] TOKEN_EXPIRED");
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("[Notification] TOKEN_VALIDATION_ERROR:", error);
    return false;
  }
};

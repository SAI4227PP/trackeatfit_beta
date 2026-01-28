import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useTheme } from "../../../context/ThemeContext";

const API_URL = "https://trackeatfit.onrender.com";

const WaterReminderSchedule = () => {
  const { user } = useGlobalContext();
  const userId = user?.$id || user._id;
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(true);

  const [schedule, setSchedule] = useState({
    intervalHours: 2,
    startTime: "08:00",
    endTime: "22:00",
  });

  const intervalOptions = [
    { value: 1, label: "Every 1 hour" },
    { value: 2, label: "Every 2 hours" },
    { value: 3, label: "Every 3 hours" },
    { value: 4, label: "Every 4 hours" },
    { value: 6, label: "Every 6 hours" },
    { value: 8, label: "Every 8 hours" },
  ];

  // Fetch water reminder schedule and notification settings
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!userId) {
        console.log("[WaterReminder] No userId available, skipping fetch");
        setInitialLoading(false);
        return;
      }

      try {
        console.log(
          "[WaterReminder] Fetching water reminder schedule for userId:",
          userId,
        );

        // Fetch schedule
        const scheduleResponse = await fetch(
          `${API_URL}/api/notifications/water-reminder-schedule?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log(
          "[WaterReminder] Schedule response status:",
          scheduleResponse.status,
        );

        if (!scheduleResponse.ok) {
          throw new Error(
            `Failed to fetch schedule: ${scheduleResponse.status}`,
          );
        }

        const scheduleData = await scheduleResponse.json();
        console.log(
          "[WaterReminder] Schedule data:",
          JSON.stringify(scheduleData, null, 2),
        );

        if (scheduleData.success && scheduleData.data) {
          setSchedule(scheduleData.data);
          console.log("[WaterReminder] Schedule loaded successfully");
        }

        // Fetch notification settings for enable/disable
        const settingsResponse = await fetch(
          `${API_URL}/api/notifications/meal-schedule?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data?.notificationSettings) {
            setWaterReminderEnabled(
              settingsData.data.notificationSettings.waterReminders,
            );
            console.log(
              "[WaterReminder] Water reminders enabled:",
              settingsData.data.notificationSettings.waterReminders,
            );
          }
        }
      } catch (error) {
        console.error("[WaterReminder] Error fetching schedule:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSchedule();
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log("[WaterReminder] Saving schedule:", {
        userId,
        schedule,
        waterReminderEnabled,
      });

      // Save schedule
      const schedulePayload = {
        userId,
        waterReminderSchedule: schedule,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const scheduleResponse = await fetch(
        `${API_URL}/api/notifications/water-reminder-schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(schedulePayload),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      console.log(
        "[WaterReminder] Schedule response status:",
        scheduleResponse.status,
      );

      if (!scheduleResponse.ok) {
        const errorData = await scheduleResponse.json().catch(() => null);
        console.error("[WaterReminder] Error response:", errorData);
        throw new Error(
          `Server responded with status ${scheduleResponse.status}: ${errorData?.message || "Unknown error"}`,
        );
      }

      // Save notification settings
      const settingsPayload = {
        userId,
        settings: {
          "nutrition.waterReminders.enabled": waterReminderEnabled,
        },
      };

      const settingsResponse = await fetch(
        `${API_URL}/api/notifications/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settingsPayload),
        },
      );

      if (!settingsResponse.ok) {
        console.error("[WaterReminder] Failed to save notification settings");
      }

      const data = await scheduleResponse.json();
      console.log("[WaterReminder] Response data:", data);

      if (data.success) {
        setHasUnsavedChanges(false);

        Alert.alert(
          "Success",
          "Water reminder schedule saved! You'll receive reminders at your preferred interval.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to save water reminder schedule",
        );
      }
    } catch (error) {
      console.error("Error saving water reminder schedule:", error);

      let errorMessage =
        "Failed to save water reminder schedule. Please try again.";

      if (error.name === "AbortError") {
        errorMessage =
          "Request timed out. Please check your internet connection and try again.";
      } else if (error.message.includes("Network request failed")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message.includes("status")) {
        errorMessage = "Server error. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (key, value) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  if (initialLoading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 justify-center items-center">
          <Text
            className={`text-lg ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
          >
            Loading water reminder settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <View
        className={`flex-row items-center justify-between px-4 py-4 border-b ${isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-white border-gray-100"}`}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full"
          >
            <Icon
              name="chevron-back"
              size={24}
              color={isDarkMode ? "#D1D5DB" : "#374151"}
            />
          </TouchableOpacity>
          <Text
            className={`text-xl font-bold ml-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
          >
            Water Reminders
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Enable/Disable */}
        <View
          className={`rounded-2xl p-4 mb-4 shadow-sm ${isDarkMode ? "bg-gray-800/80 border border-gray-700" : "bg-white"}`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text
                className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
              >
                Water Reminders
              </Text>
              <Text
                className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Get notified to drink water throughout the day
              </Text>
            </View>
            <Switch
              value={waterReminderEnabled}
              onValueChange={(value) => {
                setWaterReminderEnabled(value);
                setHasUnsavedChanges(true);
              }}
              trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
              thumbColor={waterReminderEnabled ? "#047857" : "#9CA3AF"}
            />
          </View>
        </View>

        {/* Interval Selection */}
        {waterReminderEnabled && (
          <View
            className={`rounded-2xl p-4 mb-4 shadow-sm ${isDarkMode ? "bg-gray-800/80 border border-gray-700" : "bg-white"}`}
          >
            <Text
              className={`text-base font-semibold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
            >
              Reminder Interval
            </Text>
            {intervalOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => updateSchedule("intervalHours", option.value)}
                className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${schedule.intervalHours === option.value ? (isDarkMode ? "bg-emerald-900/30 border-2 border-emerald-700" : "bg-emerald-50 border-2 border-emerald-500") : isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="water"
                    size={24}
                    color={
                      schedule.intervalHours === option.value
                        ? "#047857"
                        : "#9CA3AF"
                    }
                  />
                  <Text
                    className={`ml-3 text-base font-medium ${schedule.intervalHours === option.value ? (isDarkMode ? "text-emerald-300" : "text-emerald-700") : isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    {option.label}
                  </Text>
                </View>
                {schedule.intervalHours === option.value && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="#047857"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Card */}
        {waterReminderEnabled && (
          <View
            className={`rounded-2xl p-4 mb-4 ${isDarkMode ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}
          >
            <View className="flex-row">
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <View className="flex-1 ml-3">
                <Text
                  className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
                >
                  You'll receive water reminders every {schedule.intervalHours}{" "}
                  {schedule.intervalHours === 1 ? "hour" : "hours"} throughout
                  the day to help you stay hydrated.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="mb-6"
        >
          <LinearGradient
            colors={
              hasUnsavedChanges
                ? ["#15803d", "#166534"]
                : ["#6B7280", "#4B5563"]
            }
            className="py-4 rounded-2xl"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading
                ? "Saving..."
                : hasUnsavedChanges
                  ? "Save Settings *"
                  : "Save Settings"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WaterReminderSchedule;

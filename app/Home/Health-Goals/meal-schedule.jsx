import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Animated as RNAnimated,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useTheme } from "../../../context/ThemeContext";

const API_URL = "https://trackeatfit.onrender.com";

const MealSchedule = () => {
  const { user, updateUser } = useGlobalContext();
  const userId = user?.$id || user._id;
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [addMealModalVisible, setAddMealModalVisible] = useState(false);
  const [newMealType, setNewMealType] = useState("");
  const [newMealTime, setNewMealTime] = useState(new Date());
  const [showNewMealTimePicker, setShowNewMealTimePicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const infoAnim = React.useRef(new RNAnimated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const [schedule, setSchedule] = useState({
    meals: [],
    preferences: {
      reminderTime: 15,
      weekendSchedule: true,
    },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    mealReminders: true,
    waterReminders: true,
  });

  // Fetch user's meal schedule on component mount
  useEffect(() => {
    const fetchMealSchedule = async () => {
      if (!userId) {
        console.log("[MealSchedule] No userId available, skipping fetch");
        setInitialLoading(false);
        return;
      }

      try {
        console.log(
          "[MealSchedule] Fetching meal schedule for userId:",
          userId,
        );

        const response = await fetch(
          `${API_URL}/api/notifications/meal-schedule?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("[MealSchedule] GET response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        console.log(
          "[MealSchedule] GET response data:",
          JSON.stringify(data, null, 2),
        );

        if (
          data.success &&
          data.data?.meals &&
          Array.isArray(data.data.meals)
        ) {
          console.log("[MealSchedule] Found meals:", data.data.meals.length);

          // Convert time strings back to Date objects
          const mealsWithDates = data.data.meals.map((meal, index) => ({
            id: meal.id || index + 1,
            type: meal.type,
            time: new Date(meal.time),
          }));

          setSchedule({
            meals: mealsWithDates,
            preferences: data.data.preferences || {
              reminderTime: 15,
              weekendSchedule: true,
            },
          });

          if (data.data.notificationSettings) {
            setNotificationSettings(data.data.notificationSettings);
            console.log(
              "[MealSchedule] Notification settings loaded:",
              data.data.notificationSettings,
            );
          } else {
            console.log(
              "[MealSchedule] No notification settings in response, using defaults",
            );
          }
          console.log(
            "[MealSchedule] Schedule set with",
            mealsWithDates.length,
            "meals",
          );
        } else {
          console.log(
            "[MealSchedule] No meals found or invalid data structure",
          );
        }
      } catch (error) {
        console.error("[MealSchedule] Error fetching meal schedule:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMealSchedule();
  }, [userId]);

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime && selectedMealIndex !== null) {
      const updatedMeals = [...schedule.meals];
      updatedMeals[selectedMealIndex] = {
        ...updatedMeals[selectedMealIndex],
        time: selectedTime,
      };
      setSchedule((prev) => ({ ...prev, meals: updatedMeals }));
      setHasUnsavedChanges(true);
    }
  };

  const deleteMeal = (index) => {
    // Prevent deleting if only one meal remains
    if (schedule.meals.length <= 1) {
      Alert.alert(
        "Cannot Delete",
        "You must have at least one meal in your schedule.",
      );
      return;
    }

    Alert.alert(
      "Delete Meal",
      `Are you sure you want to delete ${schedule.meals[index].type}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedMeals = schedule.meals.filter((_, i) => i !== index);
            setSchedule((prev) => ({ ...prev, meals: updatedMeals }));
            setHasUnsavedChanges(true);
          },
        },
      ],
    );
  };

  const updatePreference = (key, value) => {
    setSchedule((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate schedule before sending
      if (!schedule.meals || schedule.meals.length === 0) {
        Alert.alert("Error", "Please add at least one meal to your schedule");
        setLoading(false);
        return;
      }

      // Validate each meal has required fields
      const invalidMeals = schedule.meals.filter(
        (meal) => !meal.type || !meal.time,
      );
      if (invalidMeals.length > 0) {
        Alert.alert("Error", "Each meal must have a type and time");
        setLoading(false);
        return;
      }

      console.log("[MealSchedule] Saving schedule:", {
        userId,
        mealsCount: schedule.meals.length,
        meals: schedule.meals.map((m) => ({
          type: m.type,
          time: m.time,
          enabled: m.enabled,
        })),
      });

      const payload = {
        userId,
        mealSchedule: {
          meals: schedule.meals.map((meal) => ({
            id: meal.id,
            type: meal.type,
            time:
              meal.time instanceof Date ? meal.time.toISOString() : meal.time,
          })),
          preferences: schedule.preferences,
        },
      };

      console.log(
        "[MealSchedule] Payload being sent:",
        JSON.stringify(payload, null, 2),
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        `${API_URL}/api/notifications/meal-schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      console.log("[MealSchedule] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("[MealSchedule] Error response:", errorData);
        throw new Error(
          `Server responded with status ${response.status}: ${errorData?.message || "Unknown error"}`,
        );
      }

      const data = await response.json();
      console.log("[MealSchedule] Response data:", data);

      // Save notification settings
      if (data.success) {
        try {
          const settingsPayload = {
            userId,
            settings: {
              "nutrition.mealReminders.enabled":
                notificationSettings.mealReminders,
              "nutrition.waterReminders.enabled":
                notificationSettings.waterReminders,
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
            console.warn("[MealSchedule] Failed to save notification settings");
          }
        } catch (settingsError) {
          console.warn(
            "[MealSchedule] Error saving notification settings:",
            settingsError,
          );
        }
      }

      if (data.success) {
        // Update user context with new meal schedule if updateUser is available
        if (updateUser && typeof updateUser === "function") {
          try {
            const updatedUserData = {
              ...user,
              mealSchedule: schedule,
              lastUpdated: new Date().toISOString(),
            };
            await updateUser(updatedUserData);
          } catch (updateError) {
            console.warn("Failed to update user context:", updateError);
            // Continue anyway - the backend save was successful
          }
        }

        // Reset unsaved changes flag
        setHasUnsavedChanges(false);

        Alert.alert(
          "Success",
          "Meal schedule saved! You'll receive notifications at your custom times.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert("Error", data.message || "Failed to save meal schedule");
      }
    } catch (error) {
      console.error("Error saving meal schedule:", error);

      let errorMessage = "Failed to save meal schedule. Please try again.";

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

  // Show dropdown info message
  const showInfo = () => {
    setInfoVisible(true);
    RNAnimated.timing(infoAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      RNAnimated.timing(infoAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setInfoVisible(false));
    }, 2000);
  };

  const MealSlot = ({ meal, index, drag, isActive }) => {
    if (!meal) return null; // Guard clause to prevent undefined meal errors

    // Log meal and index for debugging
    console.log("MealSlot:", { meal, index });

    // Animated style for drag feedback
    const animatedStyle = useAnimatedStyle(() => ({
      elevation: isActive ? 8 : 0,
      opacity: isActive ? 0.85 : 1,
      transform: [{ scale: isActive ? 1.03 : 1 }],
    }));

    return (
      <Animated.View
        className={`rounded-2xl mb-3 overflow-hidden ${isActive ? "bg-emerald-100" : isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}
        style={animatedStyle}
      >
        <View className="flex-row items-center p-4">
          {/* Drag Handle */}
          <TouchableOpacity
            onPress={showInfo}
            onLongPress={drag}
            disabled={isActive}
            className="mr-3 p-1.5"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="drag-vertical"
              size={24}
              color={isActive ? "#047857" : "#9CA3AF"}
            />
          </TouchableOpacity>

          {/* Time and Meal Type */}
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => {
                setSelectedMealIndex(index);
                setShowTimePicker(true);
              }}
              className="mb-1"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color={isDarkMode ? "#10B981" : "#059669"}
                />
                <Text
                  className={`text-lg font-bold ml-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                >
                  {meal.time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
            <Text
              className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {meal.type}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-2">
            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => deleteMeal(index)}
              className={`p-2.5 rounded-xl ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={22}
                color="#DC2626"
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // FlatList footer for preferences and save button
  const renderFooter = () => (
    <View>
      {/* Preferences */}
      <View
        className={`rounded-2xl p-4 mb-4 shadow-sm ${isDarkMode ? "bg-gray-800/80 border border-gray-700" : "bg-white"}`}
      >
        <Text
          className={`text-base font-semibold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
        >
          Reminder Preferences
        </Text>

        <View className="flex-row items-center justify-between py-3">
          <Text
            className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            Meal Reminders
          </Text>
          <Switch
            value={notificationSettings.mealReminders}
            onValueChange={(value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                mealReminders: value,
              }));
              setHasUnsavedChanges(true);
            }}
            trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
            thumbColor={
              notificationSettings.mealReminders ? "#047857" : "#9CA3AF"
            }
          />
        </View>

        <View className="flex-row items-center justify-between py-3">
          <Text
            className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            Water Intake Reminders
          </Text>
          <Switch
            value={notificationSettings.waterReminders}
            onValueChange={(value) => {
              setNotificationSettings((prev) => ({
                ...prev,
                waterReminders: value,
              }));
              setHasUnsavedChanges(true);
            }}
            trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
            thumbColor={
              notificationSettings.waterReminders ? "#047857" : "#9CA3AF"
            }
          />
        </View>

        <View className="flex-row items-center justify-between py-3">
          <Text
            className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            Weekend Schedule
          </Text>
          <Switch
            value={schedule.preferences.weekendSchedule}
            onValueChange={(value) =>
              updatePreference("weekendSchedule", value)
            }
            trackColor={{ false: "#D1D5DB", true: "#A7F3D0" }}
            thumbColor={
              schedule.preferences.weekendSchedule ? "#047857" : "#9CA3AF"
            }
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={loading}
        className="mb-6"
      >
        <LinearGradient
          colors={
            hasUnsavedChanges ? ["#15803d", "#166534"] : ["#6B7280", "#4B5563"]
          }
          className="py-4 rounded-2xl"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading
              ? "Saving..."
              : hasUnsavedChanges
                ? "Save Schedule *"
                : "Save Schedule"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // FlatList header for meal slots
  const renderHeader = () => (
    <View
      className={`rounded-2xl p-4 mb-4 shadow-sm ${isDarkMode ? "bg-gray-800/80 border border-gray-700" : "bg-white"}`}
    >
      <Text
        className={`text-base font-semibold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
      >
        Daily Meals
      </Text>
      <DraggableFlatList
        data={schedule.meals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, drag, isActive }) => {
          const index = schedule.meals.findIndex((m) => m.id === item.id);
          return (
            <MealSlot
              meal={item}
              index={index}
              drag={drag}
              isActive={isActive}
            />
          );
        }}
        onDragEnd={({ data }) =>
          setSchedule((prev) => ({ ...prev, meals: data }))
        }
        activationDistance={12} // smoother drag start
        containerStyle={{ paddingBottom: 8 }}
        animationConfig={{ duration: 180 }} // smooth transition
        dragItemOverflow={false}
      />
      <TouchableOpacity
        onPress={() => setAddMealModalVisible(true)}
        className={`flex-row items-center justify-center p-4 rounded-2xl mt-2 ${isDarkMode ? "bg-emerald-900/20 border border-emerald-900/30" : "bg-emerald-100"}`}
      >
        <MaterialCommunityIcons
          name="plus-circle-outline"
          size={24}
          color="#047857"
        />
        <Text
          className={`font-medium ml-2 ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}
        >
          Add Meal
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleAddMealSubmit = () => {
    if (!newMealType.trim()) {
      Alert.alert("Error", "Please enter a meal type");
      return;
    }
    const newMeal = {
      id:
        (schedule.meals.length > 0
          ? Math.max(...schedule.meals.map((m) => m.id || 0))
          : 0) + 1,
      type: newMealType.trim(),
      time: newMealTime,
      enabled: true,
    };
    setSchedule((prev) => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Reset form fields
    setNewMealType("");
    setNewMealTime(new Date());
    setAddMealModalVisible(false);

    // Show confirmation and remind to save
    Alert.alert(
      "Meal Added",
      "Don't forget to tap 'Save Schedule' to save your changes!",
      [{ text: "OK" }],
    );
  };

  // Show loading indicator while fetching initial data
  if (initialLoading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="flex-1 justify-center items-center">
          <Text
            className={`text-lg ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
          >
            Loading meal schedule...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        {/* Dropdown info message */}
        {infoVisible && (
          <RNAnimated.View
            style={{
              position: "absolute",
              top: insets.top + 12,
              left: 0,
              right: 0,
              zIndex: 100,
              alignItems: "center",
              opacity: infoAnim,
              transform: [
                {
                  translateY: infoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                  }),
                },
              ],
            }}
            pointerEvents="none"
          >
            <View className="bg-emerald-700 rounded-xl py-2.5 px-6 shadow-lg">
              <Text className="text-white font-semibold text-base">
                Hold to drag
              </Text>
            </View>
          </RNAnimated.View>
        )}
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
              Meal Schedule
            </Text>
          </View>
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Add Meal Modal */}
        <Modal
          visible={addMealModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setAddMealModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-gray-900/70">
            <View
              className={`w-[92%] rounded-3xl shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              {/* Title Bar */}
              <View
                className={`flex-row items-center justify-between px-5 pt-5 pb-2 border-b rounded-t-3xl ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"}`}
              >
                <Text
                  className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Add Meal
                </Text>
                <TouchableOpacity onPress={() => setAddMealModalVisible(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={isDarkMode ? "#fff" : "#222"}
                  />
                </TouchableOpacity>
              </View>
              {/* Content */}
              <View className="p-5">
                <Text
                  className={`text-base font-semibold mb-2 ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}
                >
                  Meal Type
                </Text>
                <TextInput
                  placeholder="e.g. Snack"
                  value={newMealType}
                  onChangeText={setNewMealType}
                  className={`border rounded-xl px-3 py-3 mb-4 text-base ${isDarkMode ? "border-gray-700 bg-gray-900 text-white" : "border-gray-300 bg-gray-50 text-gray-900"}`}
                  placeholderTextColor={isDarkMode ? "#6EE7B7" : "#888"}
                />
                <Text
                  className={`text-base font-semibold mb-2 ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}
                >
                  Meal Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowNewMealTimePicker(true)}
                  className={`border flex-row items-center rounded-xl px-3 py-3 mb-4 ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-300 bg-gray-50"}`}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color={isDarkMode ? "#A7F3D0" : "#047857"}
                  />
                  <Text
                    className={`ml-2 text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {newMealTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
                {showNewMealTimePicker && (
                  <DateTimePicker
                    value={newMealTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      setShowNewMealTimePicker(false);
                      if (selectedTime) setNewMealTime(selectedTime);
                    }}
                  />
                )}
                {/* Action Buttons */}
                <View className="flex-row justify-end mt-2">
                  <TouchableOpacity
                    onPress={() => setAddMealModalVisible(false)}
                    className={`py-2 px-4 rounded-xl mr-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
                  >
                    <Text
                      className={`font-bold text-base ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddMealSubmit}
                    className="py-2 px-4 rounded-xl bg-emerald-700 shadow-sm"
                  >
                    <Text className="font-bold text-base text-white">Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {showTimePicker && (
          <DateTimePicker
            value={schedule.meals[selectedMealIndex].time}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default MealSchedule;

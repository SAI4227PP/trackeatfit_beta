import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EventSource from "react-native-event-source";
import * as Progress from "react-native-progress";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import LogoutDialog from "../../components/LogoutDialog";
import AchievementSkeleton from "../../components/Skeletons/AchievementSkeleton";
import { useCaloriesContext } from "../../context/CaloriesContext";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { achievementCache } from "../../utils/achievementCache";

const API_URL = "https://trackeatfit.onrender.com";

const ProfileOption = ({
  icon,
  iconFamily = "Ionicons",
  title,
  onPress,
  showBorder = true,
}) => {
  const { isDarkMode } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="flex-row justify-between items-center py-4"
        >
          <View className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-2xl items-center justify-center ${
                isDarkMode ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              {iconFamily === "MaterialCommunity" ? (
                <MaterialCommunityIcons
                  name={icon}
                  size={18}
                  color={isDarkMode ? "#F9FAFB" : "#374151"}
                />
              ) : (
                <Icon
                  name={icon}
                  size={18}
                  color={isDarkMode ? "#F9FAFB" : "#374151"}
                />
              )}
            </View>
            <Text
              className={`font-medium text-base ml-3 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              {title}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Animated.View>
      {showBorder && (
        <View
          className={`h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
        />
      )}
    </>
  );
};

const StatsCard = ({ title, value, unit, icon, color }) => {
  const { isDarkMode } = useTheme();
  return (
    <View
      className={`rounded-xl p-4 flex-1 mx-1 shadow-sm ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className={`font-medium text-sm ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {title}
        </Text>
        <View
          className={`w-8 h-8 rounded-2xl items-center justify-center ${
            isDarkMode
              ? color === "emerald"
                ? "bg-emerald-800"
                : "bg-blue-800"
              : color === "emerald"
                ? "bg-emerald-100"
                : "bg-blue-100"
          }`}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={
              isDarkMode
                ? color === "emerald"
                  ? "#34d399"
                  : "#60a5fa"
                : color === "emerald"
                  ? "#047857"
                  : "#0369a1"
            }
          />
        </View>
      </View>
      <View className="flex-row items-baseline mt-2">
        <Text
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </Text>
        <Text
          className={`ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
};

const Profile = () => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { user, signOut, authToken } = useGlobalContext(); // Add authToken here
  const {
    goalCalories,
    foodCalories,
    carbs,
    protein,
    fats,
    waterIntake,
    clearCaloriesData,
  } = useCaloriesContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const lastEventId = useRef("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clearingProgress, setClearingProgress] = useState(0);
  const [clearingMessage, setClearingMessage] = useState("");
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Update auth check to use both tokens
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if ((!token && !authToken) || !user) {
        console.log("No auth tokens or user, redirecting to sign-in...");
        router.replace("/sign-in");
      }
    };
    checkAuth();
  }, [user, authToken]);

  // Add navigation blocking
  useEffect(() => {
    if (isLoggingOut) {
      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        e.preventDefault();
      });
      return () => unsubscribe && unsubscribe();
    }
  }, [isLoggingOut, navigation]);

  const navigateToAuth = () => {
    try {
      const hasValidAuth = authToken || AsyncStorage.getItem("authToken");
      if (!hasValidAuth) {
        router.replace({
          pathname: "/sign-in",
          params: { reset: true },
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.replace("/sign-in");
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Start clearing data with animation
      setClearingMessage("Clearing calories data...");
      setClearingProgress(0.2);
      await clearCaloriesData();

      setClearingMessage("Clearing user preferences...");
      setClearingProgress(0.4);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate clearing

      setClearingMessage("Clearing achievements...");
      setClearingProgress(0.6);
      await achievementCache.clear(user?._id);

      setClearingMessage("Clearing session data...");
      setClearingProgress(0.8);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate clearing

      setClearingMessage("Finalizing logout...");
      setClearingProgress(1);
      await signOut();
      // Always redirect to sign-in after sign out
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to sign out completely. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setClearingProgress(0);
      setClearingMessage("");
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    setShowLogoutAnimation(true);
    setIsLoggingOut(true);

    try {
      setClearingMessage("Clearing calories data...");
      setClearingProgress(0.2);
      await clearCaloriesData();

      setClearingMessage("Clearing user preferences...");
      setClearingProgress(0.4);
      await achievementCache.clear(user?._id);

      setClearingMessage("Clearing session data...");
      setClearingProgress(0.8);

      setClearingMessage("Finalizing logout...");
      setClearingProgress(1);
      await signOut();

      // Force immediate navigation
      router.push("/(auth)/sign-in");
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to sign out completely. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutAnimation(false);
      setClearingProgress(0);
      setClearingMessage("");
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const LoadingOverlay = () => (
    <Modal transparent visible={showLogoutAnimation}>
      <View className="flex-1 justify-center items-center bg-black/30">
        <LinearGradient
          colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.98)"]}
          className="p-6 rounded-2xl items-center shadow-lg w-4/5 max-w-sm"
        >
          <ActivityIndicator size="large" color="#15803d" />
          <Text className="mt-4 text-lg font-semibold text-gray-900">
            Signing Out
          </Text>
          <Text className="mt-2 text-sm text-gray-500 text-center">
            {clearingMessage}
          </Text>
          <View className="mt-4">
            <Progress.Bar
              progress={clearingProgress}
              width={200}
              color="#15803d"
              unfilledColor="#e5e7eb"
              borderWidth={0}
            />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );

  const formatMemberSince = (dateString) => {
    if (!dateString) return `${t("profile.memberSince")} N/A`;
    const date = new Date(dateString);
    return `${t("profile.memberSince")} ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  };

  const getLevelStatus = (level) => {
    const statuses = [
      { level: 1, status: "Nutrition Novice", color: "#9ca3af" },
      { level: 2, status: "Health Explorer", color: "#60a5fa" },
      { level: 3, status: "Wellness Seeker", color: "#34d399" },
      { level: 4, status: "Fitness Enthusiast", color: "#a78bfa" },
      { level: 5, status: "Health Champion", color: "#f59e0b" },
      { level: 6, status: "Nutrition Pro", color: "#ec4899" },
      { level: 7, status: "Wellness Warrior", color: "#6366f1" },
      { level: 8, status: "Health Expert", color: "#8b5cf6" },
      { level: 9, status: "Elite Achiever", color: "#ef4444" },
      { level: 10, status: "Wellness Master", color: "#f59e0b" },
    ];
    return statuses.find((s) => s.level === level) || statuses[0];
  };

  const getStatusTranslation = (level) => {
    const statusMap = {
      1: "novice",
      2: "explorer",
      3: "seeker",
      4: "enthusiast",
      5: "champion",
      6: "pro",
      7: "warrior",
      8: "expert",
      9: "elite",
      10: "master",
    };
    return t(`profile.status.${statusMap[level] || "novice"}`);
  };

  // Add subscription utility functions
  const getSubscriptionPlan = () => {
    if (!user?.subscriptions || user.subscriptions.length === 0) {
      return "FREE";
    }
    return user.subscriptions[0].plan || "FREE";
  };

  const getSubscriptionDisplay = (plan) => {
    switch (plan) {
      case "PREMIUM":
        return {
          name: "Premium Member",
          icon: "crown",
          colors: ["#f59e0b", "#d97706"],
          textColor: "#92400e",
        };
      case "BASIC":
        return {
          name: "Basic Member",
          icon: "star",
          colors: ["#3b82f6", "#2563eb"],
          textColor: "#1d4ed8",
        };
      case "FREE":
      default:
        return {
          name: "Free Member",
          icon: "account",
          colors: ["#6b7280", "#4b5563"],
          textColor: "#374151",
        };
    }
  };

  const getXPProgress = () => {
    if (!user?.xp || !user?.nextLevelXP) return 0;
    return (user.xp / user.nextLevelXP) * 100;
  };

  const nutritionStats = [
    {
      title: t("profile.dailyCalories"),
      value: goalCalories.toLocaleString(),
      unit: "kcal",
      icon: "fire",
      color: "emerald",
    },
    {
      title: t("profile.waterIntake"),
      value: waterIntake.toFixed(1),
      unit: "L",
      icon: "water",
      color: "blue",
    },
    {
      title: t("profile.activeDays"),
      value: user?.streak || 0,
      unit: t("profile.stats.week"),
      icon: "run",
      color: "emerald",
    },
    {
      title: t("profile.protein"),
      value: protein.toFixed(1),
      unit: "g",
      icon: "arm-flex",
      color: "blue",
    },
  ];

  // Add useEffect for fetching initial achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user?._id) return;

      try {
        // Try to get cached data first
        const cachedAchievements = await achievementCache.get(user._id);
        if (cachedAchievements) {
          setAchievements(cachedAchievements);
          setIsInitialLoading(false);
        }

        // Fetch fresh data
        setIsRefreshing(true);
        const response = await fetch(`${API_URL}/achievements/${user._id}`);
        const data = await response.json();

        if (data.success) {
          setAchievements(data.achievements || []);
          await achievementCache.set(user._id, data.achievements || []);
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchAchievements();
  }, [user?._id]);

  // Add SSE listener for achievement updates
  useEffect(() => {
    let eventSource;
    let isSubscribed = true;

    if (user?._id) {
      eventSource = new EventSource(`${API_URL}/achievements/events`);

      eventSource.addEventListener("achievements", async (event) => {
        try {
          const data = JSON.parse(event.data);

          // Prevent duplicate events
          if (data.eventId && data.eventId === lastEventId.current) {
            return;
          }
          lastEventId.current = data.eventId;

          if (!isSubscribed || data.userId !== user._id) return;

          // Update achievements based on event type
          switch (data.type) {
            case "achievements-unlocked":
              setAchievements((prev) => {
                const updated = [...prev];
                data.achievements.forEach((newAchievement) => {
                  const index = updated.findIndex(
                    (a) => a.title === newAchievement.title,
                  );
                  if (index !== -1) {
                    updated[index] = { ...updated[index], ...newAchievement };
                  } else {
                    updated.push(newAchievement);
                  }
                });
                return updated;
              });

              // Update cache with new achievements
              data.achievements.forEach(async (achievement) => {
                await achievementCache.update(user._id, achievement);
              });
              break;
          }
        } catch (error) {
          console.error("Error handling achievement event:", error);
        }
      });
    }

    return () => {
      isSubscribed = false;
      // Safely close eventSource if it exists and is not null
      try {
        if (eventSource && typeof eventSource.close === "function") {
          eventSource.close();
        }
      } catch (err) {
        // Silently ignore any errors from close
      }
    };
  }, [user?._id]);

  // Add Achievement Card component
  const AchievementCard = memo(({ title, description, icon, isUnlocked }) => (
    <View
      className={`mr-3 rounded-xl p-3 min-w-[160px] shadow-sm ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <View className="items-center">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center mb-3 ${
            isUnlocked
              ? isDarkMode
                ? "bg-emerald-800"
                : "bg-emerald-100"
              : isDarkMode
                ? "bg-gray-700"
                : "bg-gray-100"
          }`}
        >
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={
              isUnlocked
                ? isDarkMode
                  ? "#34d399"
                  : "#047857"
                : isDarkMode
                  ? "#6b7280"
                  : "#9ca3af"
            }
          />
        </View>

        <Text
          className={`text-sm font-semibold mb-1 text-center ${
            isUnlocked
              ? isDarkMode
                ? "text-white"
                : "text-gray-900"
              : isDarkMode
                ? "text-gray-400"
                : "text-gray-500"
          }`}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View
          className={`px-2 py-1 rounded-full ${
            isUnlocked ? "bg-emerald-100" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isUnlocked ? "text-emerald-600" : "text-gray-500"
            }`}
          >
            {isUnlocked ? "Unlocked" : "Locked"}
          </Text>
        </View>
      </View>
    </View>
  ));

  const renderAchievementsSection = () => (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4 px-4">
        <Text
          className={`text-lg font-bold ${
            isDarkMode ? "text-gray-200" : "text-gray-900"
          }`}
        >
          {t("profile.achievements")}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home/Achievements")}
          className="flex-row items-center"
        >
          <Text
            className={`font-medium text-sm mr-1 ${
              isDarkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            {t("profile.seeAll")}
          </Text>
          <Icon
            name="chevron-forward"
            size={16}
            color={isDarkMode ? "#34d399" : "#059669"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {isInitialLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => (
              <View
                key={index}
                className={`mr-3 rounded-xl h-32 w-40 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <AchievementSkeleton />
              </View>
            ))
        ) : (
          <>
            {achievements
              .filter((achievement) => achievement.isUnlocked)
              .slice(0, 5)
              .map((achievement) => (
                <AchievementCard key={achievement.title} {...achievement} />
              ))}

            {achievements.filter((a) => a.isUnlocked).length === 0 && (
              <View
                className={`rounded-xl p-6 items-center justify-center min-w-[200px] ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-3 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={24}
                    color={isDarkMode ? "#6b7280" : "#9ca3af"}
                  />
                </View>
                <Text
                  className={`text-sm font-medium text-center mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {t("profile.noAchievements")}
                </Text>
                <Text
                  className={`text-xs text-center ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Complete goals to unlock
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  // Add these navigation handlers
  const handleUserDetails = () =>
    router.push("/Home/Health-Goals/user-details");
  const handleWeightGoal = () => router.push("/Home/Health-Goals/weight-goal");
  const handleMealSchedule = () =>
    router.push("/Home/Health-Goals/meal-schedule");
  const handleWaterReminder = () =>
    router.push("/Home/Health-Goals/water-reminder-schedule");
  const handleDietaryPreferences = () =>
    router.push("/Home/Health-Goals/dietary-preferences");

  const handleChangeEmail = () => router.push("/Home/settings/change-email");
  const handleResetPassword = () =>
    router.push("/Home/settings/change-password");
  const handlePhoneNumber = () => router.push("/Home/settings/phone-number");
  const handleSubscriptionHistory = () =>
    router.push("/Home/settings/subscription-history"); // renamed handler

  const handleProgressReports = () => router.push("/Home/statistics");
  const handleConnectedApps = () =>
    router.push("/Home/tracking/connected-apps");
  const handleConnectedDevices = () =>
    router.push("/Home/tracking/connected-devices");
  const handleExportData = () => router.push("/Home/tracking/export-data");

  const handleNotifications = () =>
    router.push("/Home/preferences/notifications");
  const handleLanguage = () => router.push("/Home/preferences/language");
  const handleDarkMode = () => router.push("/Home/preferences/theme");

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
    >
      <LoadingOverlay />
      <LogoutDialog
        visible={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
      <LinearGradient
        colors={isDarkMode ? ["#1f2937", "#111827"] : ["#ffffff", "#f8fafc"]}
        className="flex-1"
      >
        <View
          className={`px-4 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-100"
          }`}
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
              <Icon
                name="chevron-back"
                size={24}
                color={isDarkMode ? "#D1D5DB" : "#374151"}
              />
            </TouchableOpacity>
            <Text
              className={`text-xl font-bold ml-2 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              {t("profile.title")}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-4 pt-6">
              {/* Profile Header */}
              <View className="items-center mb-8">
                <View className="relative">
                  <TouchableOpacity
                    onPress={() => router.push("/Community/EditProfile")}
                  >
                    <View className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                      <Image
                        source={{
                          uri:
                            user?.avatar ||
                            "https://example.com/default-avatar.png",
                        }}
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-md">
                      <Icon name="camera" size={18} color="#15803d" />
                    </View>
                  </TouchableOpacity>
                </View>

                <View className="mt-4 items-center">
                  <Text
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {user?.username || t("profile.guest")}
                  </Text>
                  {/* Add Level and Status display */}
                  {user?.level && (
                    <View className="flex-row items-center mt-2">
                      <View className="bg-amber-500 px-3 py-1 rounded-full mr-2 border-2 border-white">
                        <Text className="text-gray-900 font-semibold">
                          {t("profile.level")} {user.level}
                        </Text>
                      </View>
                      <View
                        className="px-3 py-1 rounded-full border-2 border-white"
                        style={{
                          backgroundColor: `${getLevelStatus(user.level).color}20`,
                        }}
                      >
                        <Text
                          className="font-semibold"
                          style={{
                            color: getLevelStatus(user.level).color,
                          }}
                        >
                          {getStatusTranslation(user.level)}
                        </Text>
                      </View>
                    </View>
                  )}
                  <Text
                    className={`text-sm font-medium mt-2 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatMemberSince(user?.createdAt)}
                  </Text>
                </View>

                {/* Membership Badge */}
                <View className="mt-4">
                  <View
                    className="px-3 py-1 rounded-full border-2 border-white"
                    style={{
                      backgroundColor: `${getSubscriptionDisplay(getSubscriptionPlan()).colors[0]}20`,
                    }}
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons
                        name={
                          getSubscriptionDisplay(getSubscriptionPlan()).icon
                        }
                        size={16}
                        color={
                          getSubscriptionDisplay(getSubscriptionPlan())
                            .colors[0]
                        }
                      />
                      <Text
                        className="font-semibold text-sm ml-1.5"
                        style={{
                          color: getSubscriptionDisplay(getSubscriptionPlan())
                            .colors[0],
                        }}
                      >
                        {getSubscriptionDisplay(getSubscriptionPlan()).name}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Stats Grid */}
              <View className="mb-6">
                <Text
                  className={`text-lg font-bold mb-4 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {t("profile.nutritionOverview")}
                </Text>
                <View className="flex-row flex-wrap justify-between">
                  {nutritionStats.map((stat, index) => (
                    <View key={index} className="w-[48%] pb-4">
                      <StatsCard {...stat} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Achievements Section */}
              {renderAchievementsSection()}

              {/* Health Goals */}
              <View
                className={`rounded-2xl shadow-sm mb-6 p-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {t("profile.sections.healthGoals")}
                </Text>
                <ProfileOption
                  icon="account-edit"
                  iconFamily="MaterialCommunity"
                  title={t("profile.options.userDetails")}
                  onPress={handleUserDetails}
                />
                <ProfileOption
                  icon="scale"
                  iconFamily="MaterialCommunity"
                  title={t("profile.options.weightGoal")}
                  onPress={handleWeightGoal}
                />
                <ProfileOption
                  icon="calendar-clock"
                  iconFamily="MaterialCommunity"
                  title={t("profile.options.mealSchedule")}
                  onPress={handleMealSchedule}
                />
                <ProfileOption
                  icon="water-outline"
                  title={t("profile.options.waterReminder")}
                  onPress={handleWaterReminder}
                  showBorder={false}
                />
              </View>

              {/* Account Settings */}
              <View
                className={`rounded-2xl shadow-sm mb-6 p-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {t("profile.sections.accountSettings")}
                </Text>
                <ProfileOption
                  icon="mail-outline"
                  title={t("profile.options.changeEmail")}
                  onPress={handleChangeEmail}
                />
                <ProfileOption
                  icon="key-outline"
                  title={t("profile.options.changePassword")}
                  onPress={handleResetPassword}
                />
                <ProfileOption
                  icon="call-outline"
                  title={t("profile.options.addPhoneNumber")}
                  onPress={handlePhoneNumber}
                />
                <ProfileOption
                  icon="card-outline"
                  title="Subscription History"
                  onPress={handleSubscriptionHistory}
                  showBorder={false}
                />
              </View>

              {/* Tracking & Analysis */}
              <View
                className={`rounded-2xl shadow-sm mb-6 p-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {t("profile.sections.trackingAnalysis")}
                </Text>
                <ProfileOption
                  icon="chart-line-variant"
                  iconFamily="MaterialCommunity"
                  title={t("profile.options.progressReports")}
                  onPress={handleProgressReports}
                />
                <ProfileOption
                  icon="sync"
                  title={t("profile.options.connectedApps")}
                  onPress={handleConnectedApps}
                />
                <ProfileOption
                  icon="phone-portrait-outline"
                  title={t("profile.options.connectedDevices")}
                  onPress={handleConnectedDevices}
                />
                <ProfileOption
                  icon="download"
                  title={t("profile.options.exportData")}
                  onPress={handleExportData}
                  showBorder={false}
                />
              </View>

              {/* Preferences */}
              <View
                className={`rounded-2xl shadow-sm mb-6 p-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {t("profile.sections.preferences")}
                </Text>
                <ProfileOption
                  icon="notifications-outline"
                  title={t("profile.options.notifications")}
                  onPress={handleNotifications}
                />
                <ProfileOption
                  icon="globe-outline"
                  title={t("profile.options.language")}
                  onPress={handleLanguage}
                />
                <ProfileOption
                  icon="moon-outline"
                  title={t("profile.options.darkMode")}
                  onPress={handleDarkMode}
                  showBorder={false}
                />
              </View>
            </View>
          </ScrollView>

          {/* Sign Out Button - Outside ScrollView */}
          <View
            className={`px-4 py-4 border-t ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <TouchableOpacity
              onPress={handleLogout}
              disabled={showLogoutAnimation || showLogoutDialog}
              className="overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                className="py-4"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {showLogoutAnimation
                    ? "Signing Out..."
                    : t("profile.options.signOut")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Profile;

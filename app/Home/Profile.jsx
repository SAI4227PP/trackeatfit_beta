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
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                alignItems: "center",
                justifyContent: "center",
              }}
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
              style={{
                fontWeight: "500",
                fontSize: 16,
                marginLeft: 12,
                color: isDarkMode ? "#e5e7eb" : "#374151",
              }}
            >
              {title}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Animated.View>
      {showBorder && (
        <View
          style={{
            height: 1,
            backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
          }}
        />
      )}
    </>
  );
};

const StatsCard = ({ title, value, unit, icon, color }) => {
  const { isDarkMode } = useTheme();
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        flex: 1,
        marginHorizontal: 4,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 14,
            color: isDarkMode ? "#d1d5db" : "#4b5563",
          }}
        >
          {title}
        </Text>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDarkMode
              ? color === "emerald"
                ? "#065f46"
                : "#1e40af"
              : color === "emerald"
                ? "#d1fae5"
                : "#dbeafe",
          }}
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: isDarkMode ? "#ffffff" : "#111827",
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            marginLeft: 4,
            color: isDarkMode ? "#9ca3af" : "#6b7280",
          }}
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.98)"]}
          style={{
            padding: 24,
            borderRadius: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            width: "80%",
            maxWidth: 400,
          }}
        >
          <ActivityIndicator size="large" color="#15803d" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
            }}
          >
            Signing Out
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {clearingMessage}
          </Text>
          <View style={{ marginTop: 16 }}>
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
    <LinearGradient
      colors={
        isUnlocked
          ? isDarkMode
            ? ["#1e293b", "#065f46"]
            : ["#f0fdf4", "#bbf7d0"]
          : isDarkMode
            ? ["#1e293b", "#334155"]
            : ["#f8fafc", "#e5e7eb"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        marginRight: 12,
        borderRadius: 16,
        padding: 14,
        shadowColor: isDarkMode ? "#000" : "#0000001a",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.13,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: isUnlocked ? 1.2 : 1,
        borderColor: isUnlocked
          ? isDarkMode
            ? "#34d399"
            : "#059669"
          : isDarkMode
            ? "#334155"
            : "#e5e7eb",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          backgroundColor: isUnlocked
            ? isDarkMode
              ? "#065f46"
              : "#bbf7d0"
            : isDarkMode
              ? "#334155"
              : "#e5e7eb",
        }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={
            isUnlocked
              ? isDarkMode
                ? "#34d399"
                : "#059669"
              : isDarkMode
                ? "#64748b"
                : "#a3a3a3"
          }
        />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: isUnlocked
            ? isDarkMode
              ? "#34d399"
              : "#059669"
            : isDarkMode
              ? "#cbd5e1"
              : "#64748b",
          marginBottom: 4,
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "400",
          color: isDarkMode ? "#94a3b8" : "#64748b",
          lineHeight: 18,
        }}
        numberOfLines={2}
      >
        {description}
      </Text>
    </LinearGradient>
  ));

  const renderAchievementsSection = () => (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: isDarkMode ? "#e5e7eb" : "#111827",
          }}
        >
          {t("profile.achievements")}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home/Achievements")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#065f46" : "#f0fdf4",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 9999,
          }}
        >
          <Text
            style={{
              fontWeight: "500",
              color: isDarkMode ? "#34d399" : "#059669",
              marginRight: 4,
            }}
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
        style={{ paddingLeft: 16 }}
      >
        {isInitialLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => <AchievementSkeleton key={index} />)
        ) : (
          <>
            {achievements
              .filter((achievement) => achievement.isUnlocked)
              .slice(0, 5)
              .map((achievement) => (
                <AchievementCard key={achievement.title} {...achievement} />
              ))}
            {achievements.filter((a) => a.isUnlocked).length === 0 && (
              <LinearGradient
                colors={
                  isDarkMode
                    ? ["#1f293730", "#1f293750"]
                    : ["#f8fafc", "#f1f5f9"]
                }
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 32,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  width: 200,
                }}
              >
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={40}
                  color={isDarkMode ? "#4b5563" : "#9ca3af"}
                />
                <Text
                  style={{
                    color: isDarkMode ? "#cbd5e1" : "#64748b",
                    fontSize: 16,
                    marginTop: 8,
                    textAlign: "center",
                    fontWeight: "500",
                  }}
                >
                  {t("profile.noAchievements")}
                </Text>
              </LinearGradient>
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
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#111827" : "#ffffff",
      }}
    >
      <LoadingOverlay />
      <LogoutDialog
        visible={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
      <LinearGradient
        colors={isDarkMode ? ["#1f2937", "#111827"] : ["#ffffff", "#f8fafc"]}
        style={{ flex: 1 }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: isDarkMode ? "#374151" : "#f3f4f6",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                padding: 8,
                marginLeft: -8,
              }}
            >
              <Icon
                name="chevron-back"
                size={24}
                color={isDarkMode ? "#D1D5DB" : "#374151"}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginLeft: 8,
                color: isDarkMode ? "#e5e7eb" : "#374151",
              }}
            >
              {t("profile.title")}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              {/* Profile Header */}
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <View
                  style={{
                    position: "relative",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => router.push("/Community/EditProfile")}
                  >
                    <View
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        borderWidth: 4,
                        borderColor: "#ffffff",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            user?.avatar ||
                            "https://example.com/default-avatar.png",
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 48,
                        }}
                        resizeMode="cover"
                      />
                    </View>
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        padding: 4,
                        borderRadius: 9999,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }}
                    >
                      <Icon name="camera" size={18} color="#15803d" />
                    </View>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    marginTop: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: isDarkMode ? "#e5e7eb" : "#111827",
                    }}
                  >
                    {user?.username || t("profile.guest")}
                  </Text>

                  {/* Add Level and Status display */}
                  {user?.level && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#f59e0b",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 9999,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#111827",
                            fontWeight: "600",
                          }}
                        >
                          {t("profile.level")} {user.level}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 9999,
                          backgroundColor: `${getLevelStatus(user.level).color}20`,
                        }}
                      >
                        <Text
                          style={{
                            color: getLevelStatus(user.level).color,
                            fontWeight: "600",
                          }}
                        >
                          {getStatusTranslation(user.level)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      marginTop: 8,
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {formatMemberSince(user?.createdAt)}
                  </Text>
                </View>

                {/* Premium Badge */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 16,
                    backgroundColor: "#f59e0b",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 9999,
                  }}
                >
                  <MaterialCommunityIcons
                    name="crown"
                    size={16}
                    color="#b45309"
                  />
                  <Text
                    style={{
                      color: "#111827",
                      fontWeight: "500",
                      fontSize: 14,
                      marginLeft: 4,
                    }}
                  >
                    Premium Member
                  </Text>
                </View>
              </View>

              {/* Quick Stats Grid */}
              <View
                style={{
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 16,
                    color: isDarkMode ? "#e5e7eb" : "#111827",
                  }}
                >
                  {t("profile.nutritionOverview")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  {nutritionStats.map((stat, index) => (
                    <View
                      key={index}
                      style={{ width: "48%", paddingBottom: 16 }}
                    >
                      <StatsCard {...stat} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Achievements Section */}
              {renderAchievementsSection()}

              {/* Health Goals */}
              <View
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  marginBottom: 24,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 12,
                    color: isDarkMode ? "#e5e7eb" : "#111827",
                  }}
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
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  marginBottom: 24,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 12,
                    color: isDarkMode ? "#e5e7eb" : "#111827",
                  }}
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
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  marginBottom: 24,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 12,
                    color: isDarkMode ? "#e5e7eb" : "#111827",
                  }}
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
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  marginBottom: 24,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 12,
                    color: isDarkMode ? "#e5e7eb" : "#111827",
                  }}
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
            style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: isDarkMode ? "#111827" : "#ffffff",
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? "#374151" : "#f3f4f6",
            }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              disabled={showLogoutAnimation || showLogoutDialog}
              style={{
                overflow: "hidden",
                borderRadius: 12,
              }}
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                style={{
                  paddingVertical: 16,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
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

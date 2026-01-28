import "../global.css";

import notifee, { AndroidImportance } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  SplashScreen,
  Stack,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "../constants/images";
import { CaloriesProvider } from "../context/CaloriesContext";
import GlobalProvider from "../context/GlobalProvider";
import { GoogleFitProvider } from "../context/GoogleFitContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ThemeProvider } from "../context/ThemeContext";
import { storeNotification } from "../utils/notificationUtils";

// Background notification handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("[FCM] Background message received:", remoteMessage);

  // Store notification for history
  await storeNotification({
    title: remoteMessage.notification?.title || "Notification",
    message: remoteMessage.notification?.body || "",
    time: new Date().toISOString(),
    type: remoteMessage.data?.type || remoteMessage.data?.category || "system",
    data: remoteMessage.data,
    read: false,
  });

  // Display notification using notifee
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || "Notification",
    body: remoteMessage.notification?.body || "",
    data: remoteMessage.data,
    android: {
      channelId: remoteMessage.data?.category || "default",
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: "default",
      },
    },
  });
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log("[Notifee] Background event:", type, detail);
});

const linking = {
  prefixes: ["https://trackeatfit.xyz", "com.inc.TrackEatFit://"],
  config: {
    screens: {
      "(auth)": {
        screens: {
          login: "login",
          register: "register",
        },
      },
      "(tabs)": {
        screens: {
          home: "home",
          profile: "profile",
        },
      },
      PostDetails: "posts/:postId",
      index: "",
    },
  },
};

const FONTS = {
  "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
  "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
  "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
  "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
  "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
  "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
  "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
  "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
  "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
};

const RootLayout = () => {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [hasError, setHasError] = React.useState(false);
  const routeNameRef = useRef();
  const screenEnterTimeRef = useRef(Date.now());
  const homeLoadedFiredRef = useRef(false);

  // Helper function to get nested route name
  const getActiveRouteName = useCallback((state) => {
    const route = state.routes?.[state.index];
    if (route?.state) {
      return getActiveRouteName(route.state);
    }
    return route?.name;
  }, []);

  const checkAuthAndNavigate = useCallback(async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("user"),
      ]);

      const isAuthenticated = !!(token && userStr);
      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";
      const isProfileScreen = segments.includes("Profile");
      const isIndexScreen = segments.length === 0 || segments[0] === "index";

      if (isAuthenticated) {
        if (inAuthGroup || isIndexScreen) {
          router.replace("/(tabs)/home");
        }
      } else {
        if (!isIndexScreen && !inAuthGroup) {
          if (isProfileScreen || inTabsGroup) {
            console.log("Unauthorized access, redirecting to index...");
            router.replace("/");
          }
        }
      }
    } catch (error) {
      console.error("Navigation check failed:", error);
      router.replace("/");
    }
  }, [segments]);

  // Set user ID in analytics after authentication
  // useEffect(() => {
  //   const setAnalyticsUserId = async () => {
  //     try {
  //       const userStr = await AsyncStorage.getItem('user');
  //       if (userStr) {
  //         const user = JSON.parse(userStr);
  //         if (user?.id || user?.uid) {
  //           await analytics.setUserId(user.id || user.uid);
  //         }
  //       }
  //     } catch (_) {
  //       // Ignore errors
  //     }
  //   };
  //   setAnalyticsUserId();
  // }, [/* runs once on mount, or add dependencies if needed */]);

  useEffect(() => {
    if (fontError) {
      setHasError(true);
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (!navigationState?.key || !fontsLoaded) return;
    checkAuthAndNavigate();
  }, [segments, navigationState, checkAuthAndNavigate, fontsLoaded]);

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.97,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [fadeAnim, scaleAnim, fontsLoaded, fontError]);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log("[Notifications] Initializing notification system...");

        // Request notification permissions
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log("[Notifications] Permission granted:", authStatus);
        } else {
          console.warn("[Notifications] Permission denied");
        }

        // Create notification channels
        await notifee.createChannel({
          id: "default",
          name: "Default Channel",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "meal_reminder",
          name: "Meal Reminders",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "water_reminder",
          name: "Water Reminders",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "exercise_reminder",
          name: "Exercise Reminders",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "weight_tracking",
          name: "Weight Tracking",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "sleep_reminder",
          name: "Sleep Reminders",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "milestone_achievement",
          name: "Achievements",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "weekly_report",
          name: "Weekly Reports",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "streak_reminder",
          name: "Streak Reminders",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "payment_success",
          name: "Payment Success",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "payment_failed",
          name: "Payment Failed",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
        await notifee.createChannel({
          id: "chat",
          name: "Chat Messages",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });

        console.log("[Notifications] All notification channels created");
      } catch (error) {
        console.error("[Notifications] Initialization error:", error);
      }
    };

    initializeNotifications();
  }, []);

  // FCM foreground message handler
  useEffect(() => {
    console.log("[FCM] Setting up foreground message handler...");

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log(
        "[FCM] Foreground message received:",
        JSON.stringify(remoteMessage, null, 2),
      );

      try {
        // Store notification for history
        await storeNotification({
          title: remoteMessage.notification?.title || "Notification",
          message: remoteMessage.notification?.body || "",
          time: new Date().toISOString(),
          type:
            remoteMessage.data?.type ||
            remoteMessage.data?.category ||
            "system",
          data: remoteMessage.data,
          read: false,
        });
        console.log("[FCM] Notification stored successfully");

        // Display notification in foreground using notifee
        const notificationId = await notifee.displayNotification({
          title: remoteMessage.notification?.title || "Notification",
          body: remoteMessage.notification?.body || "",
          data: remoteMessage.data,
          android: {
            channelId: remoteMessage.data?.category || "default",
            importance: AndroidImportance.HIGH,
            sound: "default",
            pressAction: {
              id: "default",
            },
          },
        });
        console.log("[FCM] Notification displayed with ID:", notificationId);
      } catch (error) {
        console.error("[FCM] Error handling notification:", error);
      }
    });

    console.log("[FCM] Foreground message handler registered");
    return () => {
      console.log("[FCM] Unsubscribing from foreground messages");
      unsubscribe();
    };
  }, []);

  // Navigation observer
  useEffect(() => {
    if (!navigationState) return;
    const currentRouteName = getActiveRouteName(navigationState);

    if (routeNameRef.current !== currentRouteName && currentRouteName) {
      routeNameRef.current = currentRouteName;
      screenEnterTimeRef.current = Date.now();

      // Track home page visit
      if (currentRouteName === "home" && !homeLoadedFiredRef.current) {
        homeLoadedFiredRef.current = true;
      }
    }
  }, [navigationState, getActiveRouteName]);

  if (hasError) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <Text style={{ color: "#ef4444" }}>
          Something went wrong. Please restart the app.
        </Text>
      </SafeAreaView>
    );
  }

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <LinearGradient
          colors={["rgba(255,215,0,0.1)", "rgba(255,215,0,0.05)"]}
          style={{ padding: 32, borderRadius: 24, alignItems: "center" }}
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          >
            <Image
              source={images.Premium_icon}
              style={{ width: 112, height: 112, marginBottom: 24 }}
              resizeMode="contain"
            />
            <View style={{ alignItems: "center", rowGap: 12 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "#1a202c" }}
              >
                Track<Text style={{ color: "#FFD700" }}>EatFit</Text>
              </Text>
              <Text
                style={{ fontSize: 14, color: "#718096", textAlign: "center" }}
              >
                Initializing your wellness journey...
              </Text>
            </View>
            <View style={{ marginTop: 32, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#FFA000" />
            </View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <GlobalProvider>
      <CaloriesProvider>
        <ThemeProvider>
          <LanguageProvider>
            <GoogleFitProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen
                  name="(auth)"
                  options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
                {[
                  "index",
                  "Search",
                  "Nutrition",
                  "Goal",
                  "Micronutrients",
                  "FoodDetails",
                  "RecipeDetails",
                  "RecipeSearch",
                  "Meals_complete",
                  "favorite",
                  "Adddevice",
                  "Posts",
                  "geminichat",
                  "DietPlanner",
                  "GoogleFitApi",
                  "BluetoothHealthTracker",
                  "Community/EditProfile",
                  "EditMealCard",
                ].map((screen) => (
                  <Stack.Screen
                    key={screen}
                    name={screen}
                    options={{ headerShown: false }}
                  />
                ))}
              </Stack>
            </GoogleFitProvider>
          </LanguageProvider>
        </ThemeProvider>
      </CaloriesProvider>
    </GlobalProvider>
  );
};

export { linking };
export default RootLayout;

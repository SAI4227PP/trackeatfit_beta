import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import images from '../../constants/images';
import { useCaloriesContext } from '../../context/CaloriesContext';
import { useGlobalContext } from '../../context/GlobalProvider';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoogleFit } from '../../context/GoogleFitContext';
import { useTheme } from '../../context/ThemeContext';
import { registerFCMToken } from '../../services/notificationService';
import { checkNotificationPermission, createNotificationSettingsIfNotExists, requestNotificationPermission } from '../../utils/notificationUtils';
import Notificationpermission from '../notification/Notificationpermission';
// import analytics, { useScreenAnalytics } from '../../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

const defaultNotificationData = {
  nutrition: {
    mealReminders: {
      description: 'Get reminded about your scheduled meals',
      icon: 'silverware-fork-knife',
      color: '#15803d',
    },
    waterReminders: {
      description: 'Regular reminders to stay hydrated',
      icon: 'water',
      color: '#0284c7',
    },
    snackAlerts: {
      description: 'Smart reminders for healthy snacking',
      icon: 'food-apple',
      color: '#ea580c',
    },
  },
  health: {
    weightTracking: {
      description: 'Weekly weight check-in reminders',
      icon: 'scale-bathroom',
      color: '#7c3aed',
    },
    exerciseReminders: {
      description: 'Daily workout and activity reminders',
      icon: 'run',
      color: '#db2777',
    },
    sleepSchedule: {
      description: 'Bedtime and wake-up reminders',
      icon: 'sleep',
      color: '#4f46e5',
    },
  },
  achievements: {
    milestones: {
      description: 'Notifications for achieved goals',
      icon: 'trophy',
      color: '#ca8a04',
    },
    streaks: {
      description: 'Daily reminders to maintain your streak',
      icon: 'fire',
      color: '#ef4444',
    },
    weeklyReport: {
      description: 'Weekly progress and statistics',
      icon: 'chart-line',
      color: '#059669',
    },
  },
  social: {
    chat: {
      description: 'Message notifications from chats',
      icon: 'chat',
      color: '#0ea5e9',
    }
  }
};

const Home = () => {
  // Track Home screen view and time
  // useScreenAnalytics('Home');
  const navigation = useNavigation();
  const router = useRouter();
  const [activeCard, setActiveCard] = useState(0);
  const hasCheckedRef = useRef(false);
  const { isDarkMode } = useTheme();

  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const { user, setUser, isLoggedIn, loading, updateUserLevel, showNotification, setShowNotification } = useGlobalContext();
  const { goalCalories, foodCalories, carbs, fats, protein } = useCaloriesContext();
  const { authorized: googleFitConnected, stepsSummary, authorizeGoogleFit, isLoading: googleFitLoading, fitnessData } = useGoogleFit();

  // Remove all weekly/per-day/selectedDayIdx logic
  // Only use today's steps for the chart and summary
  const stepsGoal = 10000; // Daily goal
  const todaySteps = googleFitConnected && stepsSummary?.day ? stepsSummary.day : 0;

  // Use today's exercise calories from workoutStats if available, fallback to exerciseCalories.cal, then 0
  const exerciseCalories =
    user?.workoutStats?.cal ??
    user?.exerciseCalories?.cal ??
    0;

  // Calculate calories burned from steps (example: 0.04 kcal per step)
  const stepsCalories = fitnessData?.calories || 0; // Use fitnessData if available, otherwise fallback to 0
  // Add steps calories to exercise calories for summary
  const totalExerciseCalories = exerciseCalories + stepsCalories;

  // Update these calculations
  const netCalories = foodCalories - totalExerciseCalories;
  const isOverBudget = netCalories > goalCalories;
  const Remaining = isOverBudget ? 0 : goalCalories - netCalories;
  const overAmount = isOverBudget ? netCalories - goalCalories : 0;

  // Update progress calculations to handle over-budget scenario
  const progressPercentage = (foodCalories / goalCalories) * 100;
  const exerciseOffset = (totalExerciseCalories / goalCalories) * 100;

  const totalAnglecalories = 360;
  const GoalAngle = totalAnglecalories;
  const FoodAngle = (progressPercentage / 100) * totalAnglecalories;
  const ExceriseAngle = (exerciseOffset / 100) * totalAnglecalories;

  const totalMacronutrients = carbs + protein + fats;

  const carbsPercentage = totalMacronutrients > 0 ? (carbs / totalMacronutrients) * 100 : 0;
  const proteinPercentage = totalMacronutrients > 0 ? (protein / totalMacronutrients) * 100 : 0;
  const fatsPercentage = totalMacronutrients > 0 ? (fats / totalMacronutrients) * 100 : 0;

  const totalAnglemacros = 360;
  const carbsAngle = (carbsPercentage / 100) * totalAnglemacros;
  const proteinAngle = (proteinPercentage / 100) * totalAnglemacros;
  const fatsAngle = (fatsPercentage / 100) * totalAnglemacros;


  useEffect(() => {
    if (!isLoggedIn) {
      // Redirect to sign-in page if user is not logged in
      router.replace('/sign-in');
    }
  }, [isLoggedIn, navigation]);

  // Log custom event when Home is loaded for a logged-in user with a defined user object
  useEffect(() => {
    // Log custom event when Home is loaded for a logged-in user with a defined user object
    if (isLoggedIn && user && user._id) {
      (async () => {
        try {
          // await analytics.logEvent('home_loaded', {
          //   userId: user._id,
          //   subscription: user?.subscriptions?.[0]?.plan,
          //   appVersion: DeviceInfo.getVersion(),
          // });
        } catch (e) {
          // Optionally log error
        }
      })();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    console.log("User info:", user); // Log user object to see if it's being correctly set
  }, [user]);
  

  useEffect(() => {
    const initializeNotifications = async () => {
      const isEnabled = await checkNotificationPermission();
      setNotificationEnabled(isEnabled);
      if (!isEnabled && !hasCheckedRef.current) {
        setShowNotification(true);
        hasCheckedRef.current = true;
      }
      // Ensure notification settings doc exists after permission check
      if (user && user._id) {
        await createNotificationSettingsIfNotExists(user._id, defaultNotificationData);
      }
    };
    initializeNotifications();
  }, [user]);

  // Robust notification permission handler
  const handleNotificationClose = async (enabled) => {
    try {
      if (enabled) {
        const isGranted = await requestNotificationPermission();
        if (isGranted) {
          // Register FCM token with backend after permission is granted
          const registered = await registerFCMToken();
          if (registered) {
            setNotificationEnabled(true);
            setShowNotification(false);
          } else {
            // Registration failed, optionally show error or retry
            console.warn('FCM token registration with backend failed.');
            setShowNotification(false);
          }
        } else {
          // Permission denied
          setShowNotification(false);
        }
      } else {
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error handling notifications:', error);
      setShowNotification(false);
    }
  };

  useEffect(() => {
    // Sync userId in AsyncStorage for notification registration
    if (user && user._id) {
      AsyncStorage.setItem('userId', user._id.toString());
    }
  }, [user]);

  // --- Intraday Steps Chart Logic (copied/adapted from GoogleFitApi.jsx) ---
  const [intradayLog, setIntradayLog] = useState([]);
  // Helper: aggregate steps into 6 slots (4 hours each) with unique keys, no am/pm in labels
  function aggregateStepsBy4HourSlot(rawSteps) {
    const slots = Array(6).fill(0);
    // Use 24h format labels, no am/pm
    const slotLabels = [
      '0-4', '4-8', '8-12', '12-16', '16-20', '20-24'
    ];
    rawSteps.forEach(rs => {
      if (typeof rs.startDate === 'number' && typeof rs.endDate === 'number' && typeof rs.steps === 'number') {
        const start = new Date(rs.startDate);
        const end = new Date(rs.endDate);
        const totalDuration = end - start;
        if (totalDuration <= 0) return;
        let curr = new Date(start);
        while (curr < end) {
          const slotIdx = Math.floor(curr.getHours() / 4);
          const slotEnd = new Date(curr);
          slotEnd.setHours((Math.floor(curr.getHours() / 4) + 1) * 4, 0, 0, 0);
          const overlapEnd = slotEnd < end ? slotEnd : end;
          const overlapDuration = overlapEnd - curr;
          const stepsForSlot = rs.steps * (overlapDuration / totalDuration);
          slots[slotIdx] += stepsForSlot;
          curr = overlapEnd;
        }
      }
    });
    return slots.map((value, idx) => ({
      label: slotLabels[idx],
      value: Math.round(value)
    }));
  }

  // Fetch intraday steps for today
  useEffect(() => {
    const fetchIntradaySteps = async () => {
      if (!googleFitConnected) {
        setIntradayLog([]);
        return;
      }
      try {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
        const options = {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          bucketUnit: 'HOUR',
          bucketInterval: 1,
        };
        const samples = await require('react-native-google-fit').default.getDailyStepCountSamples(options);
        let slotData = [];
        if (Array.isArray(samples)) {
          let preferredSample = samples.find(
            s => s.source === 'com.google.android.gms:estimated_steps'
          );
          if (!preferredSample && samples.length > 0) {
            preferredSample = samples[0];
          }
          if (preferredSample && Array.isArray(preferredSample.rawSteps) && preferredSample.rawSteps.length > 0) {
            slotData = aggregateStepsBy4HourSlot(preferredSample.rawSteps);
          } else if (preferredSample && Array.isArray(preferredSample.steps)) {
            const stepsArr = preferredSample.steps.map(s => ({
              startDate: typeof s.startDate === 'string' ? new Date(s.startDate).getTime() : undefined,
              endDate: typeof s.endDate === 'string' ? new Date(s.endDate).getTime() : undefined,
              steps: s.value || 0,
            })).filter(s => s.startDate && s.endDate && s.steps);
            slotData = aggregateStepsBy4HourSlot(stepsArr);
          }
        }
        setIntradayLog(slotData);
      } catch (e) {
        setIntradayLog([]);
      }
    };
    fetchIntradaySteps();
  }, [googleFitConnected, stepsSummary?.day]);

  // BarGraph component for intraday steps (6 slots)
  const IntradayBarGraph = ({ data }) => {
    if (!data || data.length === 0) {
      return <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }} />;
    }
    const max = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.max(18, Math.floor((Dimensions.get('window').width * 0.8) / (data.length || 1)) - 8);
    const barColor = '#2563EB';
    // Animate bars
    const [animatedValues, setAnimatedValues] = useState(data.map(() => new Animated.Value(0)));
    useEffect(() => {
      if (animatedValues.length !== data.length) {
        setAnimatedValues(data.map(() => new Animated.Value(0)));
        return;
      }
      Animated.stagger(
        60,
        animatedValues.map((anim, i) =>
          Animated.timing(anim, {
            toValue: Math.max(10, (data[i]?.value / max) * 80),
            duration: 400,
            useNativeDriver: false,
          })
        )
      ).start();
      // eslint-disable-next-line
    }, [data.map(d => d.value).join(','), data.length]);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, marginLeft: 8 }}>
        {data.map((d, idx) => (
          <View key={d.label + '-' + idx} style={{ alignItems: 'center', marginHorizontal: 4, justifyContent: 'flex-end' }}>
            <Text style={{
              fontSize: 11,
              color: barColor,
              fontWeight: 'bold',
              marginBottom: 2,
              minHeight: 16,
            }}>
              {d.value > 0 ? d.value : ''}
            </Text>
            <Animated.View
              style={{
                width: barWidth,
                height: animatedValues[idx],
                backgroundColor: barColor,
                borderRadius: 8,
                marginBottom: 4,
                justifyContent: 'flex-end',
                alignItems: 'center',
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            />
            <Text style={{
              fontSize: 10,
              color: isDarkMode ? '#9CA3AF' : '#6b7280',
              maxWidth: barWidth + 8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Place loading check and return here, after all hooks
  if (loading || !user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const handleProfile = () => {
    navigation.navigate('Home/Profile');
  };

  const handleNotificationScreen = () => {
    navigation.navigate('notification/NotificationScreen');
  };

  const handlesteps = () => {
    navigation.navigate('Home/steps');
  };

  const handleexecrise = () => {
    navigation.navigate('Home/execrise');
  };

  const handleworkout = () => {
    navigation.navigate('Workout');
  };

  const handleplanner = () => {
    navigation.navigate('Home/SyncUp');
  };

  const handlesleep = () => {
    navigation.navigate('Home/Sleep');
  };

  const handlerecipe = () => {
    navigation.navigate('recipe');
  };

  const handlecommunity = () => {
    navigation.navigate('community');
  };

  const handleStatistics = () => {
    navigation.navigate('Home/statistics');
  };

  const handleSubscription = () => {
    navigation.navigate('Payment/subscription');
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const cardWidth = 300; // Adjust this value based on your card width
    const activeIndex = Math.round(scrollPosition / cardWidth);
    setActiveCard(activeIndex);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good night';
  };

  // Add to navigation handlers
  const handleLevelProgress = () => {
    // navigation.navigate('Home/LevelProgress');
        navigation.navigate('Payment/subscription');

  };

  // Add new handler for calorie goal navigation
  const handleCalorieGoal = () => {
    navigation.navigate('Goal');
  };

  const handleFriends = () => {
    navigation.navigate('Home/friends/friends');
  };

  // Add the CompleteProfile handler
  const handleCompleteProfile = () => {
    router.push('/CompleteProfile');
  };

  // Update CompleteProfile button component
  const CompleteProfileButton = () => (
    <TouchableOpacity 
      onPress={handleCompleteProfile}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isDarkMode 
          ? ['#1e40af', '#1e3a8a'] 
          : ['#ffffff', '#f0f9ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginBottom: 16,
          padding: 20,
          borderRadius: 24,
          shadowColor: isDarkMode ? '#000' : '#3b82f6',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.5 : 0.2,
          shadowRadius: 10,
          elevation: 7
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            borderRadius: 16,
            padding: 12,
            backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)'
          }}>
            <Ionicons 
              name="rocket-outline" 
              size={32} 
              color={isDarkMode ? "#93c5fd" : "#2563eb"} 
            />
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginRight: 8,
                color: isDarkMode ? '#f3f4f6' : '#111827'
              }}>
                Complete Profile
              </Text>
              <View style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor: user?.completionPercentage >= 80 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)'
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: user?.completionPercentage >= 80 ? '#16a34a' : '#f59e0b'
                }}>
                  {user?.completionPercentage || 0}%
                </Text>
              </View>
            </View>

            <Text style={{
              fontSize: 14,
              color: isDarkMode ? '#93c5fd' : '#2563eb'
            }}>
              Get personalized recommendations
            </Text>
          </View>

          <View style={{
            borderRadius: 9999,
            padding: 8,
            marginTop: 24,
            backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)'
          }}>
            <Ionicons 
              name="arrow-forward" 
              size={24} 
              color={isDarkMode ? "#93c5fd" : "#2563eb"} 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <>
      <Notificationpermission
        visible={showNotification}
        onClose={handleNotificationClose}
      />
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={isDarkMode ? ['#111827', '#1f2937', '#374151'] : ['#f8fafc', '#f1f5f9', '#e2e8f0']}
          style={{ flex: 1 }}
        >
          <View style={{ marginBottom: 8 }}>
            <LinearGradient
              colors={isDarkMode ? ['#1f2937', '#1f2937'] : ['#ffffff', '#ffffff']}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                shadowColor: isDarkMode ? '#000' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.3 : 0.08,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={isDarkMode ? images.logo_main : images.name_bg}
                    style={{ width: 135, height: 45 }}
                    resizeMode="contain"
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleNotificationScreen}
                    style={{
                      padding: 8,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 9999,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      <Ionicons name="notifications-outline" size={22} color="#374151" />
                      <View style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 12,
                        height: 12,
                        backgroundColor: '#EF4444',
                        borderRadius: 9999,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                      }} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleProfile}
                    style={{
                      padding: 8,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 9999,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      <Ionicons name="person-circle-outline" size={22} color="#374151" />
                      <View style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        backgroundColor: '#10B981',
                        borderRadius: 9999,
                        borderWidth: 1,
                        borderColor: '#ffffff'
                      }} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 12,
                paddingHorizontal: 4
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={16} color={isDarkMode ? "#FFFFFF" : "#6B7280"} />
                  <Text style={{ 
                    marginLeft: 4,
                    fontSize: 14,
                    color: isDarkMode ? '#E5E7EB' : '#4B5563'
                  }}>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              {/* Professional Welcome Card */}
              <LinearGradient
                colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  marginBottom: 24,
                }}
              >
                <TouchableOpacity onPress={handleStatistics}>
                  <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ position: 'relative' }}>
                          <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 16,
                            overflow: 'hidden',
                            borderWidth: 2,
                            borderColor: '#f3f4f6'
                          }}>
                            <Image
                              source={{ uri: user?.avatar || 'https://example.com/default-avatar.png' }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          </View>
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 16,
                            height: 16,
                            backgroundColor: '#10B981',
                            borderRadius: 9999,
                            borderWidth: 2,
                            borderColor: '#ffffff'
                          }} />
                        </View>
                        <View style={{ marginLeft: 16, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{
                              fontSize: 14,
                              fontWeight: 'medium',
                              color: isDarkMode ? '#E5E7EB' : '#4B5563'
                            }}>
                              {getGreeting()}
                            </Text>
                            <View style={{
                              width: 4,
                              height: 4,
                              borderRadius: 9999,
                              backgroundColor: '#D1D5DB',
                              marginHorizontal: 8
                            }} />
                            <Text style={{
                              fontSize: 14,
                              fontWeight: 'medium',
                              color: '#16A34A'
                            }}>
                              Active
                            </Text>
                          </View>
                          <Text style={{
                            fontSize: 28,
                            fontWeight: 'bold',
                            lineHeight: 32,
                            marginBottom: 8,
                            color: isDarkMode ? '#f3f4f6' : '#111827'
                          }}>
                            {user?.username || 'Guest'}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity 
                              onPress={handleCalorieGoal}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#F3F4F6',
                                borderRadius: 9999,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                marginRight: 8
                              }}
                            >
                              <Ionicons name="flame" size={14} color="#ef4444" />
                              <Text style={{
                                fontSize: 12,
                                fontWeight: 'medium',
                                marginLeft: 4,
                                color: isDarkMode ? '#374151' : '#111827'
                              }}>
                                {goalCalories} cal goal
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={handleLevelProgress}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#F3F4F6',
                                borderRadius: 9999,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                              }}
                            >
                              <Ionicons name="trophy" size={14} color="#f59e0b" />
                              <Text style={{
                                fontSize: 12,
                                fontWeight: 'medium',
                                marginLeft: 4,
                                color: isDarkMode ? '#374151' : '#111827'
                              }}>
                                Level {user?.level || 0}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Progress Strip */}
                    <View style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: isDarkMode ? '#374151' : '#E5E7EB'
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="trending-up" size={18} color="#16a34a" />
                          <Text style={{
                            fontSize: 14,
                            fontWeight: 'medium',
                            marginLeft: 4,
                            color: isDarkMode ? '#E5E7EB' : '#4B5563'
                          }}>
                            Today's Progress
                          </Text>
                        </View>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: 'semibold',
                          color: '#16A34A'
                        }}>
                          {((foodCalories / goalCalories) * 100).toFixed(0)}% of goal
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </LinearGradient>

              {/* Show CompleteProfile button only if profile is not logged in */}
              {!user?.profileCompleted && <CompleteProfileButton />}

              {/* Enhanced Today's Progress Section */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View>
                    <Text style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      lineHeight: 28,
                      color: isDarkMode ? '#f3f4f6' : '#111827'
                    }}>
                      Today's Progress
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: 'medium',
                      marginTop: 4,
                      color: isDarkMode ? '#E5E7EB' : '#4B5563'
                    }}>
                      Track your daily nutrition goals
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 24 }}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {/* Calories Card */}
                  <LinearGradient
                    colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                      marginRight: 16,
                      padding: 20,
                      width: 320
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f3f4f6' : '#111827'
                      }}>
                        Calories Summary
                      </Text>
                      <View style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 9999,
                        paddingVertical: 4,
                        paddingHorizontal: 12
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: 'semibold',
                          color: '#3B82F6'
                        }}>
                          Daily Goal
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ position: 'relative' }}>
                        <Svg width={130} height={130} viewBox="0 0 200 200">
                          <G rotation="-90" origin="100,100">
                            {/* Goal background */}
                            <Circle
                              cx="100"
                              cy="100"
                              r="80"
                              stroke="#3399FF"
                              strokeWidth="16"
                              fill="none"
                            />
                            {/* Food segment */}
                            <Circle
                              cx="100"
                              cy="100"
                              r="80"
                              stroke={isOverBudget ? "#ef4444" : "#9400D3"}
                              strokeWidth="16"
                              strokeDasharray={`${(FoodAngle / 360) * (2 * Math.PI * 80)} ${(2 * Math.PI * 80)}`}
                              strokeDashoffset={0}
                              fill="none"
                            />
                            {/* Exercise segment (drawn after food, as offset) */}
                            {totalExerciseCalories > 0 && (
                              <Circle
                                cx="100"
                                cy="100"
                                r="80"
                                stroke="#ffcc00"
                                strokeWidth="16"
                                strokeDasharray={`${(ExceriseAngle / 360) * (2 * Math.PI * 80)} ${(2 * Math.PI * 80)}`}
                                strokeDashoffset={-(FoodAngle / 360) * (2 * Math.PI * 80)}
                                fill="none"
                              />
                            )}
                          </G>
                        </Svg>
                        <View style={{
                          position: 'absolute',
                          flex: 1,
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isOverBudget ? (
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: '#ef4444'
                              }}>
                                +{overAmount}
                              </Text>
                              <View style={{ alignItems: 'center' }}>
                                <Text style={{
                                  fontSize: 12,
                                  fontWeight: 'medium',
                                  color: isDarkMode ? '#D1D5DB' : '#4B5563'
                                }}>
                                  exceeds
                                </Text>
                                <Text style={{
                                  fontSize: 10,
                                  fontWeight: 'medium',
                                  color: isDarkMode ? '#D1D5DB' : '#4B5563'
                                }}>
                                  goal
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{
                                fontSize: 28,
                                fontWeight: 'bold',
                                color: isDarkMode ? '#f3f4f6' : '#111827'
                              }}>
                                {Remaining}
                              </Text>
                              <Text style={{
                                fontSize: 12,
                                fontWeight: 'medium',
                                color: isDarkMode ? '#D1D5DB' : '#4B5563'
                              }}>
                                remaining
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={{ marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 9999,
                                backgroundColor: '#3b82f6',
                                marginRight: 8
                              }} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: 'medium',
                                color: isDarkMode ? '#E5E7EB' : '#4B5563'
                              }}>
                                Goal
                              </Text>
                            </View>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: 'bold',
                              color: isDarkMode ? '#f3f4f6' : '#111827'
                            }}>
                              {goalCalories}
                            </Text>
                          </View>
                          <View style={{
                            height: 4,
                            backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                            borderRadius: 9999,
                            overflow: 'hidden'
                          }}>
                            <View style={{
                              height: 4,
                              backgroundColor: '#3b82f6',
                              borderRadius: 9999,
                              width: `${Math.min((goalCalories / 2500) * 100, 100)}%`
                            }} />
                          </View>
                        </View>

                        <View style={{ marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 9999,
                                backgroundColor: '#9400D3',
                                marginRight: 8
                              }} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: 'medium',
                                color: isDarkMode ? '#E5E7EB' : '#4B5563'
                              }}>
                                Food
                              </Text>
                            </View>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: 'bold',
                              color: isDarkMode ? '#f3f4f6' : '#111827'
                            }}>
                              {foodCalories}
                            </Text>
                          </View>
                          <View style={{
                            height: 4,
                            backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                            borderRadius: 9999,
                            overflow: 'hidden'
                          }}>
                            <View style={{
                              height: 4,
                              backgroundColor: '#9400D3',
                              borderRadius: 9999,
                              width: `${Math.min((foodCalories / 2500) * 100, 100)}%`
                            }} />
                          </View>
                        </View>

                        <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 9999,
                                backgroundColor: '#f59e0b',
                                marginRight: 8
                              }} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: 'medium',
                                color: isDarkMode ? '#E5E7EB' : '#4B5563'
                              }}>
                                Exercise
                              </Text>
                            </View>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: 'bold',
                              color: isDarkMode ? '#f3f4f6' : '#111827'
                            }}>
                              {totalExerciseCalories}
                            </Text>
                          </View>
                          <View style={{
                            height: 4,
                            backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                            borderRadius: 9999,
                            overflow: 'hidden'
                          }}>
                            <View style={{
                              height: 4,
                              backgroundColor: '#f59e0b',
                              borderRadius: 9999,
                              width: `${Math.min((totalExerciseCalories / 2500) * 100, 100)}%`
                            }} />
                          </View>
                          {/* Show breakdown if stepsCalories > 0 */}
                          {/* {stepsCalories > 0 && (
                            <Text style={{
                              fontSize: 12,
                              marginTop: 4,
                              color: isDarkMode ? '#D1D5DB' : '#4B5563'
                            }}>
                              {exerciseCalories} cal (workout) + {stepsCalories} cal (steps)
                            </Text>
                          )} */}
                        </View>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Enhanced Macros Card */}
                  <LinearGradient
                    colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                      width: 320,
                      padding: 20
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <View>
                        <Text style={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: isDarkMode ? '#f3f4f6' : '#111827'
                        }}>
                          Macronutrients
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: 'medium',
                          marginTop: 4,
                          color: isDarkMode ? '#E5E7EB' : '#4B5563'
                        }}>
                          Daily breakdown
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: '#ECFDF5',
                        borderRadius: 9999,
                        paddingVertical: 4,
                        paddingHorizontal: 12
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: 'semibold',
                          color: '#10B981'
                        }}>
                          On Track
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {[
                        {
                          title: 'Carbs',
                          value: carbs,
                          percent: carbsPercentage,
                          color: '#3b82f6',
                          icon: 'leaf-outline'
                        },
                        {
                          title: 'Protein',
                          value: protein,
                          percent: proteinPercentage,
                          color: '#8b5cf6',
                          icon: 'fitness-outline'
                        },
                        {
                          title: 'Fats',
                          value: fats,
                          percent: fatsPercentage,
                          color: '#f59e0b',
                          icon: 'water-outline'
                        }
                      ].map((macro, index) => (
                        <View key={index} style={{ alignItems: 'center', width: 85 }}>
                          <View style={{ position: 'relative', marginBottom: 8 }}>
                            <Svg width={85} height={85} viewBox="0 0 200 200">
                              {/* Background Circle */}
                              <Circle
                                cx="100"
                                cy="100"
                                r="80"
                                stroke={isDarkMode ? "#374151" : "#f1f5f9"}
                                strokeWidth="12"
                                fill="none"
                              />
                              {/* Progress Circle */}
                              <G rotation="-90" origin="100,100">
                                <Circle
                                  cx="100"
                                  cy="100"
                                  r="80"
                                  stroke={macro.color}
                                  strokeWidth="12"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(macro.percent / 100) * (2 * Math.PI * 80)} ${2 * Math.PI * 80}`}
                                  fill="none"
                                />
                              </G>
                              {/* Percentage Text */}
                              <SvgText
                                x="100"
                                y="95"
                                textAnchor="middle"
                                fontSize="32"
                                fill={isDarkMode ? "#F9FAFB" : "#1f2937"}
                                fontWeight="bold"
                              >
                                {macro.percent.toFixed(0)}
                              </SvgText>
                              <SvgText
                                x="135"
                                y="95"
                                textAnchor="middle"
                                fontSize="20"
                                fill={isDarkMode ? "#9CA3AF" : "#6b7280"}
                              >
                                %
                              </SvgText>
                            </Svg>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Ionicons name={macro.icon} size={14} color={macro.color} />
                              <Text style={{
                                fontWeight: 'semibold',
                                marginLeft: 4,
                                color: isDarkMode ? '#f3f4f6' : '#111827'
                              }}>
                                {macro.title}
                              </Text>
                            </View>
                            <Text style={{
                              fontSize: 18,
                              fontWeight: 'bold',
                              color: isDarkMode ? '#f3f4f6' : '#111827'
                            }}>
                              {macro.value.toFixed(1)}g
                            </Text>

                          </View>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </ScrollView>
              </View>

              {/* Quick Stats */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                {/* Steps Card */}
                <TouchableOpacity onPress={handlesteps} style={{ width: '48%' }}>
                  <LinearGradient
                    colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f0f9ff']}
                    style={{
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                      padding: 16
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 9999,
                        padding: 12
                      }}>
                        <Ionicons name="footsteps-outline" size={24} color="#2563EB" />
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'semibold',
                      marginTop: 12,
                      color: isDarkMode ? '#f3f4f6' : '#111827'
                    }}>
                      Steps
                    </Text>
                    <Text style={{
                      color: isDarkMode ? '#D1D5DB' : '#4B5563',
                      marginTop: 4
                    }}>
                      Connect tracker
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Exercise Card */}
                <TouchableOpacity onPress={handleexecrise} style={{ width: '48%' }}>
                  <LinearGradient
                    colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#fff7ed']}
                    style={{
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                      padding: 16
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{
                        backgroundColor: '#FEF3C7',
                        borderRadius: 9999,
                        padding: 12
                      }}>
                        <Ionicons name="fitness-outline" size={24} color="#EA580C" />
                      </View>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: 'semibold',
                        color: '#EA580C'
                      }}>
                        Add
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'semibold',
                      marginTop: 12,
                      color: isDarkMode ? '#f3f4f6' : '#111827'
                    }}>
                      Exercise
                    </Text>
                    <Text style={{
                      color: isDarkMode ? '#D1D5DB' : '#4B5563',
                      marginTop: 4
                    }}>
                      {totalExerciseCalories} cal burned
                    </Text>
                    {/* Show breakdown if stepsCalories > 0 */}
                    {/* {stepsCalories > 0 && (
                      <Text style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: isDarkMode ? '#D1D5DB' : '#4B5563'
                      }}>
                        {exerciseCalories} cal (workout) + {stepsCalories} cal (steps)
                      </Text>
                    )} */}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Today's Steps Section (show only daily intraday chart and details) */}
              <View style={{ marginBottom: 24 }}>
                <LinearGradient
                  colors={isDarkMode ? ['#1f2937', '#111827'] : ['#f0f9ff', '#ffffff']}
                  style={{
                    borderRadius: 16,
                    padding: 20
                  }}
                >
                  <Text style={{
                    marginBottom: 12,
                    fontSize: 14,
                    fontWeight: 'semibold',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    color: isDarkMode ? '#60a5fa' : '#2563eb'
                  }}>
                    Today's Steps
                  </Text>
                  {googleFitConnected ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        {/* Steps icon on the left of the step count */}
                        <Ionicons name="footsteps-outline" size={28} color={isDarkMode ? "#60a5fa" : "#2563eb"} style={{ marginRight: 8 }} />
                        <Text style={{
                          fontSize: 32,
                          fontWeight: 'extrabold',
                          marginTop: 4,
                          marginBottom: 8,
                          color: isDarkMode ? '#f3f4f6' : '#111827'
                        }}>
                          {todaySteps.toLocaleString()}
                        </Text>
                      </View>
                      <View style={{ marginTop: 8 }}>
                        <IntradayBarGraph data={intradayLog} />
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 32
                      }}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('Adddevice')}
                    >
                      <Ionicons name="cloud-offline-outline" size={40} color={isDarkMode ? "#64748b" : "#94a3b8"} />
                      <Text style={{
                        marginTop: 12,
                        fontSize: 16,
                        fontWeight: 'semibold',
                        color: isDarkMode ? '#D1D5DB' : '#4B5563'
                      }}>
                        Connect to see your steps Activity
                      </Text>
                      <Text style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: isDarkMode ? '#60a5fa' : '#2563eb'
                      }}>
                        Tap to add device
                      </Text>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </View>

              {/* Discover Section with improved bottom spacing */}
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                marginBottom: 24,
                color: isDarkMode ? '#f3f4f6' : '#111827'
              }}>
                Discover
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {/* Discover Cards */}
                {[
                  {
                    title: 'Sleep',
                    desc: 'Track your rest',
                    icon: 'moon-outline',
                    colors: ['#ffffff', '#f3f4f6'],
                    iconColor: '#6z366f1',
                    onPress: handlesleep
                  },
                  {
                    title: 'Recipes',
                    desc: 'Find healthy meals',
                    icon: 'receipt',
                    colors: ['#ffffff', '#f3f4f6'],
                    iconColor: '#ef4444',
                    onPress: handlerecipe
                  },
                  {
                    title: 'Workouts',
                    desc: 'Stay active',
                    icon: 'barbell',
                    colors: ['#ffffff', '#f3f4f6'],
                    iconColor: '#3b82f6',
                    onPress: handleworkout
                  },
                  {
                    title: 'Sync up',
                    desc: 'Connect devices',
                    icon: 'sync',
                    colors: ['#ffffff', '#f3f4f6'],
                    iconColor: '#10b981',
                    onPress: handleplanner
                  },
                  // {
                  //   title: 'Friends',
                  //   desc: 'Your support team',
                  //   icon: 'people',
                  //   colors: ['#ffffff', '#f3f4f6'],
                  //   iconColor: '#f59e0b',
                  //   onPress: handleFriends
                  // },
                  {
                    title: 'Community',
                    desc: 'Get inspired',
                    icon: 'chatbubbles',
                    colors: ['#ffffff', '#f3f4f6'],
                    iconColor: '#8b5cf6',
                    onPress: handlecommunity
                  },
                  // {
                  //   title: 'Meal Plan',
                  //   desc: 'Weekly planning',
                  //   icon: 'restaurant',
                  //   colors: ['#ffffff', '#f3f4f6'],
                  //   iconColor: '#8b5cf6',
                  //   onPress: () => navigation.navigate('SampleDietPlan')
                  // }
                ].map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={item.onPress}
                    style={{
                      width: '48%',
                      marginBottom: 16
                    }}
                  >
                    <LinearGradient
                      colors={isDarkMode ? ['#1f2937', '#111827'] : item.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 3,
                        padding: 16
                      }}
                    >
                      <View style={{
                        borderRadius: 9999,
                        padding: 12,
                        marginBottom: 12,
                        backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)'
                      }}>
                        <Ionicons name={item.icon} size={24} color={item.iconColor} />
                      </View>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'semibold',
                        color: isDarkMode ? '#f3f4f6' : '#111827'
                      }}>
                        {item.title}
                      </Text>
                      <Text style={{
                        color: isDarkMode ? '#D1D5DB' : '#4B5563'
                      }}>
                        {item.desc}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
      <SafeAreaView 
        edges={['bottom']} 
        style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff' }} 
      />
    </>
  );
};

export default Home;
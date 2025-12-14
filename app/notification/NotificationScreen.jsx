import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';
import {
  checkNotificationPermission,
  clearNotificationHistory,
  requestNotificationPermission,
  setupBackgroundHandler
} from '../../utils/notificationUtils';

const NOTIFICATION_LOGS_KEY = 'userNotifications'; // Changed key for actual notifications
const NOTIFICATION_EVENTS_KEY = 'notificationLogs'; // For logging events
const NOTIFICATION_ENABLED_KEY = 'notificationEnabled';

const NotificationSkeleton = () => (
  <View style={{paddingHorizontal: 16, paddingTop: 16}}>
    {[...Array(5)].map((_, idx) => (
      <View
        key={idx}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: 16,
          marginBottom: 12,
          borderRadius: 16,
          backgroundColor: '#f3f4f6',
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#e5e7eb',
            marginRight: 12,
          }}
        />
        <View style={{flex: 1}}>
          <View style={{height: 16, width: '60%', backgroundColor: '#e5e7eb', borderRadius: 8, marginBottom: 8}} />
          <View style={{height: 12, width: '80%', backgroundColor: '#e5e7eb', borderRadius: 8, marginBottom: 8}} />
          <View style={{height: 12, width: '40%', backgroundColor: '#e5e7eb', borderRadius: 8}} />
        </View>
      </View>
    ))}
  </View>
);

// Add this helper function before NotificationScreen
const getRelativeTime = (isoString) => {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diff = Math.floor((now - date) / 1000);

  if (isNaN(diff)) return '';

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;

  // Check if it was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'yesterday';
  }

  // Otherwise, show date in DD/MM/YYYY
  return `${date.getDate().toString().padStart(2, '0')}/${
    (date.getMonth() + 1).toString().padStart(2, '0')
  }/${date.getFullYear()}`;
};

const NotificationScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user, authToken } = useGlobalContext();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();
  const handleNotifications = () => router.push('/Home/preferences/notifications');  
  const [notificationEnabled, setNotificationEnabled] = useState(null); // null = not checked yet
  const [isMounted, setIsMounted] = useState(true);
  const setupRan = useRef(false); // <-- Add this line

  useEffect(() => {
    setIsMounted(true);
    // Check persisted notification enabled state on first mount
    (async () => {
      try {
        const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
        if (enabled === 'true') {
          setNotificationEnabled(true);
        } else {
          setNotificationEnabled(false);
        }
      } catch {
        setNotificationEnabled(false);
      }
    })();
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (setupRan.current) return; // <-- Prevent repeated setup
    setupRan.current = true;
    const setupNotifications = async () => {
      try {
        setLoading(true);
        await checkNotificationStatus();
        await loadNotificationHistoryData();

        if (notificationEnabled && user?._id) {
          await AsyncStorage.setItem('userId', user._id);

          const success = await registerFCMToken();

          if (success) {
            await cancelAllScheduledNotifications();
            await fetch('https://healthifyme-o9qv.onrender.com/api/notifications/settings', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
              },
              body: JSON.stringify({
                userId: user._id,
                nutrition: {
                  waterReminders: { enabled: true },
                  mealReminders: { enabled: true }
                }
              })
            });
          }
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    setupNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationEnabled, user]); // keep dependencies for correctness

  const checkNotificationStatus = async () => {
    setLoading(true); // Show loader while checking permission
    try {
      const isEnabled = await checkNotificationPermission();
      if (isMounted) setNotificationEnabled(isEnabled);
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setLoading(false); // Hide loader after check
    }
  };

  // Setup notification handlers once
  useEffect(() => {
    setupBackgroundHandler();
  }, []);

  // Initialize local notifications
  const initializeNotifications = async () => {
    try {
      const enabled = await requestNotificationPermission();
      if (enabled && isMounted) {
        setNotificationEnabled(true);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  // Helper to merge and deduplicate notifications by id
  const mergeNotifications = (oldList, newList) => {
    const map = new Map();
    // Process new notifications first to ensure they take precedence
    newList.forEach(n => {
      if (n && n.id) map.set(n.id, n);
    });
    // Then process old notifications
    oldList.forEach(n => {
      if (n && n.id && !map.has(n.id)) map.set(n.id, n);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  // Always use 'notificationLogs' key and reload after logging
  const handleNotificationLog = async (notification, action) => {
    try {
      console.log('[Notification] Starting to store notification:', { notification, action });
      let logsString = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY);
      console.log('[Notification] Current stored logs string:', logsString);
      let logs = [];
      try {
        logs = logsString ? JSON.parse(logsString) : [];
        if (!Array.isArray(logs)) logs = [];
        console.log('[Notification] Parsed current logs:', logs);
      } catch (e) {
        console.error('[Notification] Error parsing logs:', e);
        logs = [];
      }

      const notifWithId = {
        ...notification,
        id: notification.id || generateUniqueId(),
        timestamp: Date.now(),
        action
      };

      const updatedLogs = mergeNotifications(logs, [notifWithId]);
      console.log('[Notification] About to store updated logs:', updatedLogs);
      await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(updatedLogs));
      
      if (isMounted) {
        console.log('[Notification] Updating state with logs:', updatedLogs);
        setNotifications(prev => {
          console.log('[Notification] Previous state:', prev);
          return updatedLogs;
        });
      }
      
      // Verify storage immediately after setting
      const verifyLogs = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY);
      console.log('[Notification] Verification - Raw stored logs:', verifyLogs);
      try {
        const parsedVerifyLogs = JSON.parse(verifyLogs);
        console.log('[Notification] Verification - Parsed stored logs:', parsedVerifyLogs);
      } catch (e) {
        console.error('[Notification] Error parsing verification logs:', e);
      }
      
    } catch (error) {
      console.error('[Notification] Error logging notification:', error);
    }
  };

  // Always load from 'notificationLogs'
  const loadNotificationHistoryData = async () => {
    try {
      console.log('[Notification] Starting to load notification history');
      let logsString = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY);
      console.log('[Notification] Raw stored logs:', logsString);
      
      let logs = [];
      if (logsString) {
        try {
          logs = JSON.parse(logsString);
          console.log('[Notification] Successfully parsed logs:', logs);
        } catch (parseError) {
          console.error('[Notification] Error parsing stored logs:', parseError);
          // Try to recover corrupted storage
          await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, '[]');
        }
      }
      
      if (!Array.isArray(logs)) {
        console.log('[Notification] Logs were not an array, resetting to empty array');
        logs = [];
        await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, '[]');
      }

      // Filter out invalid notifications
      logs = logs.filter(notification => {
        const isValid = notification &&
                        typeof notification === 'object' &&
                        notification.title &&
                        notification.message &&
                        notification.time &&
                        notification.type;
        
        if (!isValid) {
          console.log('[Notification] Filtered invalid notification:', notification);
        }
        return isValid;
      });
      
      if (isMounted) {
        console.log('[Notification] Setting notifications state with filtered logs:', logs);
        setNotifications(logs);
        
        // Verify state was updated
        setTimeout(() => {
          if (isMounted) {
            console.log('[Notification] Current notifications state:', notifications);
          }
        }, 0);
      } else {
        console.log('[Notification] Component unmounted, skipping state update');
      }
    } catch (error) {
      console.error('[Notification] Error loading notification history:', error);
      if (isMounted) setNotifications([]);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'achievement':
        return { 
          name: 'trophy', 
          color: '#f59e0b', 
          bg: '#fef3c7',
          animation: true 
        };
      case 'milestone':
        return { 
          name: 'medal', 
          color: '#ca8a04', 
          bg: '#fef9c3',
          animation: true 
        };      case 'meal_reminder':
        return { name: 'restaurant', color: '#15803d', bg: '#dcfce7' };
      case 'water_reminder':
        return { name: 'water', color: '#0284c7', bg: '#dbeafe' };
      case 'reminder':
        return { name: 'time', color: '#3b82f6', bg: '#dbeafe' };
      case 'social':
        return { name: 'people', color: '#10b981', bg: '#d1fae5' };
      case 'system':
        return { name: 'settings', color: '#6366f1', bg: '#e0e7ff' };
      case 'streak_reminder':
        return { 
          name: 'flame', 
          color: '#ef4444', 
          bg: '#fef2f2',
          animation: true 
        };
      default:
        return { name: 'notifications', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  // Add this helper function
  const generateUniqueId = () => {
    return 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  const handleClearNotifications = async () => {
    try {
      const success = await clearNotificationHistory();
      if (success) {
        if (isMounted) setNotifications([]);
        Alert.alert('Success', 'Notification history cleared');
      } else {
        Alert.alert('Error', 'Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  // Add safe filtering helper
  const filterNotifications = (notifications, filterFn) => {
    if (!Array.isArray(notifications)) return [];
    return notifications.filter(filterFn);
  };  const isToday = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return false;
    if (timeString.includes('ago')) return true;
    try {
      let date;
      if (timeString.includes('/')) {
        const [day, month, year] = timeString.split('/').map(num => parseInt(num, 10));
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(timeString);
      }
      if (isNaN(date.getTime())) return false;
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    } catch {
      return timeString.toLowerCase().includes('today');
    }
  };

  // Helper: Only notifications with a 'title' and 'message' are user notifications
  const getUserNotifications = (notifications) => {
    console.log('[Notification] Processing notifications in getUserNotifications:', notifications);
    if (!Array.isArray(notifications)) {
      console.log('[Notification] Notifications is not an array');
      return [];
    }
    const filtered = notifications.filter(n => {
      if (!n) {
        console.log('[Notification] Found null/undefined notification');
        return false;
      }
      const valid = n.title && n.message;
      if (!valid) {
        console.log('[Notification] Invalid notification found:', n);
      }
      return valid;
    });
    console.log('[Notification] Filtered notifications:', filtered);
    return filtered;
  };

  const getTodayNotifications = (list) => {
    return filterNotifications(list, (n) => {
      return n?.time && typeof n.time === 'string' && isToday(n.time);
    });
  };

  const getEarlierNotifications = (list) => {
    return filterNotifications(list, (n) => {
      return n?.time && typeof n.time === 'string' && !isToday(n.time);
    });
  };
  const renderNotificationItem = (notification, key) => (
    <TouchableOpacity
      key={key}
      onPress={() => {
        if (notification.type === 'streak_reminder') {
          router.push({
            pathname: '/(tabs)/meals'
          });
        } else if (notification.type === 'achievement' || notification.type === 'milestone') {
          router.push({
            pathname: '/Home/tracking/Achievements',
            params: {
              highlightId: notification.data?.achievementId,
              title: notification.data?.achievementTitle
            }
          });
        } else {
          router.push({
            pathname: '/NotificationDetail',
            params: {
              title: notification.title,
              message: notification.message,
              time: notification.time,
              type: notification.type,
              data: notification.data
            }
          });
        }
      }}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        padding: 16, 
        marginBottom: 12, 
        borderRadius: 16, 
        backgroundColor: notification.read ? (isDarkMode ? '#374151' : '#f9fafb') : (notification.type === 'achievement' || notification.type === 'milestone' ? (isDarkMode ? '#9333ea' : '#fef9c3') : (isDarkMode ? '#3b82f6' : '#dbeafe')),
        borderWidth: 1,
        borderColor: notification.read ? (isDarkMode ? '#4b5563' : '#e5e7eb') : (notification.type === 'achievement' || notification.type === 'milestone' ? (isDarkMode ? '#6b21a8' : '#f59e0b') : (isDarkMode ? '#2563eb' : '#bfdbfe'))
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: notification.read ? (isDarkMode ? '#4b5563' : '#e5e7eb') : (notification.type === 'achievement' || notification.type === 'milestone' ? (isDarkMode ? '#9333ea' : '#fef9c3') : (isDarkMode ? '#3b82f6' : '#dbeafe')),
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Ionicons name={getNotificationIcon(notification.type).name} size={20} color={getNotificationIcon(notification.type).color} />
      </View>
      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: 'bold', 
            color: isDarkMode ? '#ffffff' : '#111827' 
          }}>
            {notification.title}
          </Text>
          <Text
            style={{ 
              fontSize: 12, 
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              maxWidth: 100,
              textAlign: 'right'
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getRelativeTime(notification.time)}
          </Text>
        </View>
        <Text style={{ 
          color: isDarkMode ? '#d1d5db' : '#374151', 
          marginTop: 4 
        }}>
          {notification.message}
        </Text>
        {(notification.type === 'achievement' || notification.type === 'milestone') && (
          <View style={{
            marginTop: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: isDarkMode ? '#9333ea' : '#fef9c3',
            alignSelf: 'flex-start'
          }}>
            <Text style={{
              fontSize: 12,
              color: isDarkMode ? '#ffffff' : '#6b21a8',
              fontWeight: '500'
            }}>
              🏆 Achievement Unlocked
            </Text>
          </View>
        )}
        {notification.type === 'meal_reminder' && (
          <View style={{
            marginTop: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: isDarkMode ? '#15803d' : '#dcfce7',
            alignSelf: 'flex-start'
          }}>
            <Text style={{
              fontSize: 12,
              color: isDarkMode ? '#ffffff' : '#15803d',
              fontWeight: '500'
            }}>
              🍽️ Meal Reminder
            </Text>
          </View>
        )}
        {notification.type === 'water_reminder' && (
          <View style={{
            marginTop: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: isDarkMode ? '#0284c7' : '#dbeafe',
            alignSelf: 'flex-start'
          }}>
            <Text style={{
              fontSize: 12,
              color: isDarkMode ? '#ffffff' : '#0284c7',
              fontWeight: '500'
            }}>
              💧 Hydration Check
            </Text>
          </View>
        )}
        {notification.type === 'streak_reminder' && (
          <View style={{
            marginTop: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: isDarkMode ? '#ef4444' : '#fef2f2',
            alignSelf: 'flex-start'
          }}>
            <Text style={{
              fontSize: 12,
              color: isDarkMode ? '#ffffff' : '#ef4444',
              fontWeight: '500'
            }}>
              🔥 Streak Alert
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Reload notification history every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadNotificationHistoryData();
    }, [])
  );

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? "#111827" : "#ffffff"} 
      />
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? '#111827' : '#ffffff' 
      }}>
        {/* Header */}
        <LinearGradient
          colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#1f2937' : '#f3f4f6'
          }}
        >
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#fff" : "#374151"} />
            </TouchableOpacity>
            <Text style={{ 
              fontSize: 20,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827'
            }}>
              Notifications
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={handleClearNotifications}
                style={{ padding: 8, marginRight: 8 }}
              >
                <Ionicons name="trash-outline" size={24} color={isDarkMode ? "#fff" : "#374151"} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {notificationEnabled === false ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: 24 
          }}>
            <View style={{
              backgroundColor: '#eff6ff',
              padding: 24,
              borderRadius: 16,
              alignItems: 'center',
              maxWidth: 384,
              width: '100%'
            }}>
              <View style={{
                width: 64,
                height: 64,
                backgroundColor: '#dbeafe',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Ionicons name="notifications-off" size={32} color="#3b82f6" />
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Notifications are Disabled
              </Text>
              <Text style={{
                color: '#4b5563',
                textAlign: 'center',
                marginBottom: 16
              }}>
                Enable notifications to receive updates about your health and fitness goals
              </Text>
              <TouchableOpacity
                onPress={initializeNotifications}
                style={{
                  backgroundColor: '#3b82f6',
                  padding: 12,
                  borderRadius: 12,
                  width: '100%'
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Enable Notifications
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : loading ? (
          <NotificationSkeleton />
        ) : (
          <View style={{ flex: 1 }}>
            {getUserNotifications(notifications).length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 32
              }}>
                <View style={{
                  backgroundColor: '#eff6ff',
                  padding: 24,
                  borderRadius: 16,
                  alignItems: 'center',
                  maxWidth: 384,
                  width: '100%'
                }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    backgroundColor: '#dbeafe',
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16
                  }}>
                    <Ionicons name="notifications-outline" size={32} color="#3b82f6" />
                  </View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: 8,
                    textAlign: 'center'
                  }}>
                    No Notifications Yet
                  </Text>
                  <Text style={{
                    color: '#4b5563',
                    textAlign: 'center',
                    marginBottom: 8
                  }}>
                    You have no notifications at the moment.
                  </Text>
                </View>
              </View>
            ) : (
              <ScrollView 
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* Today's Section */}
                {getTodayNotifications(getUserNotifications(notifications)).length > 0 && (
                  <View style={{ padding: 16 }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      marginBottom: 12
                    }}>
                      TODAY
                    </Text>
                    {getTodayNotifications(getUserNotifications(notifications)).map((notification) => (
                      renderNotificationItem(notification, `today-${notification.id}`)
                    ))}
                  </View>
                )}

                {/* Earlier Section */}
                {getEarlierNotifications(getUserNotifications(notifications)).length > 0 && (
                  <View style={{ padding: 16 }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      marginBottom: 12
                    }}>
                      EARLIER
                    </Text>
                    {getEarlierNotifications(getUserNotifications(notifications)).map((notification) => (
                      renderNotificationItem(notification, `earlier-${notification.id}`)
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Settings Strip */}
        <LinearGradient
          colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#1f2937' : '#f3f4f6'
          }}
        >
          <TouchableOpacity 
            onPress={handleNotifications}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              borderColor: isDarkMode ? '#374151' : '#f3f4f6'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-circle-outline" size={24} color={isDarkMode ? "#fff" : "#374151"} />
              <Text style={{
                marginLeft: 12,
                fontWeight: '600',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                Notification Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
      <SafeAreaView 
        edges={['bottom']} 
        style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff' }} 
      />
    </>
  );
};

export default NotificationScreen;
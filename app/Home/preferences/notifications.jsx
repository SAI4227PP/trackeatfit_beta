import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

// Styles
const styles = {
  safeArea: (dark) => ({
    flex: 1,
    backgroundColor: dark ? '#111827' : '#F9FAFB',
  }),
  header: (dark) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: dark ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: dark ? '#374151' : '#F3F4F6',
  }),
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 999,
  },
  headerText: (dark) => ({
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: dark ? '#E5E7EB' : '#111827',
  }),
  loadingIndicator: {},
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: '#1D4ED8',
    fontWeight: '500',
    marginLeft: 8,
  },
  infoText: {
    color: '#1D4ED8',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: (dark) => ({
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: dark ? '#9CA3AF' : '#6B7280',
  }),
  notificationItem: (dark) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: dark ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  }),
  itemLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: (color, dark) => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: dark ? `${color}30` : `${color}15`,
  }),
  itemTitle: (dark) => ({
    fontSize: 16,
    fontWeight: '500',
    color: dark ? '#E5E7EB' : '#111827',
  }),
  itemDescription: (dark) => ({
    fontSize: 14,
    color: dark ? '#9CA3AF' : '#6B7280',
    marginTop: 4,
  }),
  saveButtonWrapper: {
    marginBottom: 24,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

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

const Notifications = () => {
  const { user, updateUserContext } = useGlobalContext(); // Change to use updateUserContext
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const userId = user._id;

  console.log('User ID:', userId);

  const [notifications, setNotifications] = useState({
    nutrition: {
      mealReminders: {
        enabled: true,
        description: 'Get reminded about your scheduled meals',
        icon: 'silverware-fork-knife',
        color: '#15803d',
      },
      waterReminders: {
        enabled: true,
        description: 'Regular reminders to stay hydrated',
        icon: 'water',
        color: '#0284c7',
      },
      snackAlerts: {
        enabled: false,
        description: 'Smart reminders for healthy snacking',
        icon: 'food-apple',
        color: '#ea580c',
      },
    },
    health: {
      weightTracking: {
        enabled: true,
        description: 'Weekly weight check-in reminders',
        icon: 'scale-bathroom',
        color: '#7c3aed',
      },
      exerciseReminders: {
        enabled: true,
        description: 'Daily workout and activity reminders',
        icon: 'run',
        color: '#db2777',
      },
      sleepSchedule: {
        enabled: false,
        description: 'Bedtime and wake-up reminders',
        icon: 'sleep',
        color: '#4f46e5',
      },
    },
    achievements: {
      milestones: {
        enabled: true,
        description: 'Notifications for achieved goals',
        icon: 'trophy',
        color: '#ca8a04',
      },
      streaks: {
        enabled: true,
        description: 'Daily reminders to maintain your streak',
        icon: 'fire',
        color: '#ef4444',
      },
      weeklyReport: {
        enabled: true,
        description: 'Weekly progress and statistics',
        icon: 'chart-line',
        color: '#059669',
      },
    },
    social: {
      chat: {
        enabled: true,
        description: 'Message notifications from chats',
        icon: 'chat',
        color: '#0ea5e9',
      }
    }
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    if (!user?._id) {
      console.error('No user ID available');
      return;
    }

    try {
      console.log('Fetching settings for user:', user._id);
      const response = await fetch(`${API_URL}/api/notification-settings?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch settings');
      }

      // Merge backend data with default visual attributes, handling missing categories/keys
      const mergedData = {};
      Object.entries(defaultNotificationData).forEach(([category, items]) => {
        mergedData[category] = {};
        Object.entries(items).forEach(([key, defaultItem]) => {
          const backendCategory = result.data?.[category] || {};
          const backendItem = backendCategory[key];
          mergedData[category][key] = {
            ...defaultItem,
            enabled: backendItem && typeof backendItem.enabled === 'boolean' ? backendItem.enabled : false
          };
        });
      });
      setNotifications(mergedData);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    }
  };

  const handleToggle = (category, key) => {
    console.log('Toggling:', category, key);
    setNotifications(prev => {
      const newState = {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: {
            ...prev[category][key],
            enabled: !prev[category][key].enabled,
          },
        },
      };
      console.log('New state:', newState);
      return newState;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsToUpdate = {
        userId: user._id,
        nutrition: {},
        health: {},
        achievements: {},
        social: {}
      };

      Object.entries(notifications).forEach(([category, items]) => {
        Object.entries(items).forEach(([key, item]) => {
          settingsToUpdate[category][key] = { enabled: item.enabled };
        });
      });

      const response = await fetch(`${API_URL}/api/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToUpdate)
      });

      if (!response.ok) throw new Error('Failed to update settings');
      const result = await response.json();

      if (result.success) {
        // Update user context with new settings
        if (updateUserContext) {
          updateUserContext({
            ...user,
            notificationSettings: result.data
          });
        }

        Alert.alert(
          'Settings Updated',
          'Your notification preferences have been saved.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(result.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', error.message || 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const NotificationItem = ({ item, enabled, category, itemKey }) => (
    <View style={styles.notificationItem(isDarkMode)}>
      <View style={styles.itemLeftContent}>
        <View style={styles.iconContainer(item.color, isDarkMode)}>
          <MaterialCommunityIcons 
            name={item.icon} 
            size={24} 
            color={item.color} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle(isDarkMode)}>
            {itemKey.replace(/([A-Z])/g, ' $1').split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Text>
          <Text style={styles.itemDescription(isDarkMode)}>
            {item.description}
          </Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={() => handleToggle(category, itemKey)}
        trackColor={{ false: isDarkMode ? '#374151' : '#d1d5db', true: '#86efac' }}
        thumbColor={enabled ? '#15803d' : isDarkMode ? '#6B7280' : '#9ca3af'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea(isDarkMode)}>
      <View style={styles.header(isDarkMode)}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
          </TouchableOpacity>
          <Text style={styles.headerText(isDarkMode)}>
            Notifications
          </Text>
        </View>
        {loading && <ActivityIndicator color={isDarkMode ? "#22c55e" : "#15803d"} />}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#1D4ED8" />
            <Text style={styles.infoTitle}>Smart Notifications</Text>
          </View>
          <Text style={styles.infoText}>
            Customize your notification preferences to stay on track with your health goals.
            We'll send timely reminders and updates based on your settings.
          </Text>
        </View>

        {Object.entries(notifications).map(([category, items]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle(isDarkMode)}>
              {category.toUpperCase()}
            </Text>
            {Object.entries(items).map(([key, item]) => (
              <NotificationItem
                key={key}
                item={item}
                enabled={item.enabled}
                category={category}
                itemKey={key}
              />
            ))}
          </View>
        ))}

        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={styles.saveButtonWrapper}
          >
            <LinearGradient
              colors={['#15803d', '#166534']}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Notifications;

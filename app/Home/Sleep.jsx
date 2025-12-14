import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const SleepTracker = () => {
  const { user } = useGlobalContext();
  const { isDarkMode } = useTheme();
  
  const setTimeWithoutTimezone = (hours, minutes) => {
    // Create date in IST
    const date = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    date.setTime(utc + istOffset);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const [sleepData, setSleepData] = useState({
    bedTime: setTimeWithoutTimezone(22, 0),    // 10:00 PM
    wakeTime: setTimeWithoutTimezone(6, 0),    // 6:00 AM
    quality: 'good',
    notes: '',
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeType, setTimeType] = useState('bed'); // 'bed' or 'wake'
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    smartAlarm: true,
    sleepGoal: 8,
    trackMovement: true,
  });
  const [previousSleepData, setPreviousSleepData] = useState(null);
  const [loading, setLoading] = useState(false);

  const qualityOptions = ['poor', 'fair', 'good', 'excellent'];

  const navigation = useNavigation();

  const formatTime = (date) => {
    // Convert to IST
    const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const calculateDuration = () => {
    const bedTime = new Date(sleepData.bedTime);
    const wakeTime = new Date(sleepData.wakeTime);
    
    let diff = wakeTime - bedTime;
    
    // If wake time is before bed time, assume it's the next day
    if (diff < 0) {
      const nextDayWakeTime = new Date(wakeTime);
      nextDayWakeTime.setDate(nextDayWakeTime.getDate() + 1);
      diff = nextDayWakeTime - bedTime;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateProgressWidth = () => {
    const duration = parseInt(calculateDuration().split('h')[0], 10);
    const percentage = (duration / settings.sleepGoal) * 100;
    // Limit percentage between 0 and 100
    return `${Math.min(Math.max(percentage, 0), 100)}%`;
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newTime = new Date(selectedDate);
      
      // When setting wake time, if it's before bed time, assume it's next day
      if (timeType === 'wake' && newTime < sleepData.bedTime) {
        newTime.setDate(newTime.getDate() + 1);
      }
      
      setSleepData(prev => ({
        ...prev,
        [timeType === 'bed' ? 'bedTime' : 'wakeTime']: newTime
      }));
    }
  };

  useEffect(() => {
    fetchSleepData();
    // Check notification settings when component mounts
    const sleepNotificationsEnabled = user?.notificationSettings?.health?.sleepSchedule?.enabled ?? true;
    setSettings(prev => ({
      ...prev,
      notifications: sleepNotificationsEnabled
    }));
  }, [user?.notificationSettings]);

  const fetchSleepData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sleep?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Debug: log status and response
      console.log('Sleep fetch status:', response.status);
      let result;
      try {
        result = await response.json();
        // Log the full object, including nested settings
        console.log('Sleep fetch result:', JSON.stringify(result, null, 2));
      } catch (jsonErr) {
        console.error('Error parsing sleep fetch JSON:', jsonErr);
        throw new Error('Invalid JSON response');
      }

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to fetch sleep data');
      }

      if (result.success) {
        // Set current sleep data
        if (result.data?.[0]) {
          const currentRecord = result.data[0];
          setSleepData({
            bedTime: new Date(currentRecord.bedTime),
            wakeTime: new Date(currentRecord.wakeTime),
            quality: currentRecord.quality || 'good',
            notes: currentRecord.notes || ''
          });
          
          setSettings({
            notifications: result.notificationsEnabled ?? true,
            smartAlarm: currentRecord.settings?.smartAlarm ?? true,
            sleepGoal: currentRecord.settings?.sleepGoal ?? 8,
            trackMovement: currentRecord.settings?.trackMovement ?? true
          });
        }

        // Handle lastNightSleep even if null
        setPreviousSleepData(result.lastNightSleep);
      }
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      Alert.alert('Error', `Failed to load sleep history: ${error.message}`);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedNotificationToggle = debounce(async (value) => {
    try {
      const response = await fetch(`${API_URL}/api/sleep/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          enabled: value
        })
      });

      if (!response.ok) throw new Error('Failed to update notification settings');
      
      // Update local state immediately for better UX
      setSettings(prev => ({
        ...prev,
        notifications: value
      }));
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert on error
      setSettings(prev => ({
        ...prev,
        notifications: !value
      }));
    }
  }, 500);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          bedTime: sleepData.bedTime,
          wakeTime: sleepData.wakeTime,
          quality: sleepData.quality,
          notes: sleepData.notes,
          settings: {
            ...settings,
            notifications: user?.notificationSettings?.health?.sleepSchedule?.enabled ?? true
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save sleep data');
      const result = await response.json();

      if (result.success) {
        // Update local state with new data
        setPreviousSleepData(result.data);
        Alert.alert('Success', 'Sleep data saved successfully');
        
        // Refresh data instead of going back
        await fetchSleepData();
      }
    } catch (error) {
      console.error('Error saving sleep data:', error);
      Alert.alert('Error', 'Failed to save sleep data');
    } finally {
      setLoading(false);
    }
  };

  const handleQualityChange = (quality) => {
    setSleepData(prev => ({
      ...prev,
      quality
    }));
    console.log('Quality updated:', quality); // Debug log
  };

  const handleNotificationToggle = (value) => {
    setSettings(prev => ({
      ...prev,
      notifications: value
    }));
    debouncedNotificationToggle(value);
  };

  const SettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSettings}
      onRequestClose={() => setShowSettings(false)}
    >
      <View className="flex-1 bg-black/50">
        <View className={`mt-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-t-3xl`}>
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#374151"} />
              </TouchableOpacity>
            </View>

            {/* Settings Options */}
            <View className="space-y-6">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sleep Notifications</Text>
                  <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Remind me about bedtime</Text>
                </View>
                <Switch
                  value={settings.notifications}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: isDarkMode ? "#374151" : "#cbd5e1", true: "#93c5fd" }}
                  thumbColor={settings.notifications ? "#3b82f6" : isDarkMode ? "#6b7280" : "#f4f4f5"}
                />
              </View>

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Alarm</Text>
                  <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Wake up during light sleep</Text>
                </View>
                <Switch
                  value={settings.smartAlarm}
                  onValueChange={(value) => setSettings({...settings, smartAlarm: value})}
                  trackColor={{ false: isDarkMode ? "#374151" : "#cbd5e1", true: "#93c5fd" }}
                  thumbColor={settings.smartAlarm ? "#3b82f6" : isDarkMode ? "#6b7280" : "#f4f4f5"}
                />
              </View>

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sleep Goal</Text>
                  <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Daily sleep target</Text>
                </View>
                <View className="flex-row items-center space-x-4">
                  <TouchableOpacity 
                    onPress={() => setSettings(prev => ({...prev, sleepGoal: Math.max(6, prev.sleepGoal - 0.5)}))}
                    className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} w-8 h-8 rounded-full items-center justify-center`}
                  >
                    <Ionicons name="remove" size={20} color={isDarkMode ? "#fff" : "#374151"} />
                  </TouchableOpacity>
                  <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{settings.sleepGoal}h</Text>
                  <TouchableOpacity 
                    onPress={() => setSettings(prev => ({...prev, sleepGoal: Math.min(12, prev.sleepGoal + 0.5)}))}
                    className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} w-8 h-8 rounded-full items-center justify-center`}
                  >
                    <Ionicons name="add" size={20} color={isDarkMode ? "#fff" : "#374151"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Track Movement</Text>
                  <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Monitor sleep quality</Text>
                </View>
                <Switch
                  value={settings.trackMovement}
                  onValueChange={(value) => setSettings({...settings, trackMovement: value})}
                  trackColor={{ false: isDarkMode ? "#374151" : "#cbd5e1", true: "#93c5fd" }}
                  thumbColor={settings.trackMovement ? "#3b82f6" : isDarkMode ? "#6b7280" : "#f4f4f5"}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPreviousSleep = () => {
    // Don't render anything if no previous sleep data
    if (!previousSleepData) {
      return (
        <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-4 mt-4 mb-6`}>
          <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Last Night's Sleep</Text>
          <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} italic`}>No previous sleep data available</Text>
        </View>
      );
    }

    // Calculate duration properly
    const duration = previousSleepData.duration < 0 ? 
      previousSleepData.duration + (24 * 60) : 
      previousSleepData.duration;

    return (
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-4 mt-4 mb-6`}>
        <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Last Night's Sleep</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Duration:</Text>
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {Math.floor(duration / 60)}h {duration % 60}m
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Quality:</Text>
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} capitalize`}>
              {previousSleepData.quality}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bedtime:</Text>
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(new Date(previousSleepData.bedTime))}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Wake time:</Text>
            <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(new Date(previousSleepData.wakeTime))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const memoizedProgressWidth = React.useMemo(() => {
    return calculateProgressWidth();
  }, [sleepData.bedTime, sleepData.wakeTime, settings.sleepGoal]);

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <LinearGradient
        colors={isDarkMode ? 
          ['#1f2937', '#111827', '#030712'] : 
          ['#f8fafc', '#f1f5f9', '#e2e8f0']
        }
        className="flex-1"
      >
        {/* Header */}
        <View className={`px-4 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="mr-4"
              >
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#374151"} />
              </TouchableOpacity>
              <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sleep Tracker</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Ionicons name="settings-outline" size={24} color={isDarkMode ? "#fff" : "#374151"} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Sleep Summary Card */}
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-4 mt-4`}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sleep Schedule</Text>
              <View className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-full px-3 py-1`}>
                <Text className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'} text-xs font-semibold`}>
                  {calculateDuration()}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-6">
              <TouchableOpacity 
                onPress={() => {
                  setTimeType('bed');
                  setShowTimePicker(true);
                }}
                className={`items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl flex-1 mr-2`}
              >
                <Ionicons name="bed-outline" size={24} color="#3b82f6" />
                <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Bedtime</Text>
                <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-lg mt-1`}>
                  {formatTime(sleepData.bedTime)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setTimeType('wake');
                  setShowTimePicker(true);
                }}
                className={`items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl flex-1 ml-2`}
              >
                <Ionicons name="sunny-outline" size={24} color="#f59e0b" />
                <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Wake up</Text>
                <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-lg mt-1`}>
                  {formatTime(sleepData.wakeTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress bar representing sleep duration */}
            <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} h-2 rounded-full overflow-hidden`}>
              <View 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ 
                  width: memoizedProgressWidth
                }} 
              />
            </View>
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} text-sm mt-2 text-center`}>
              {calculateDuration()} of {settings.sleepGoal}h goal
            </Text>
          </View>

          {/* Sleep Quality Input */}
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-4 mt-4`}>
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>How did you sleep?</Text>
            <View className="flex-row justify-between">
              {qualityOptions.map((quality) => (
                <TouchableOpacity 
                  key={quality}
                  onPress={() => handleQualityChange(quality)}
                  className={`px-4 py-2 rounded-full ${
                    sleepData.quality === quality ? 'bg-blue-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={
                    sleepData.quality === quality ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Section */}
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-4 mt-4`}>
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Sleep Notes</Text>
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="Add notes about your sleep (optional)"
              placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
              className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-600'} rounded-xl p-3`}
              value={sleepData.notes}
              onChangeText={(text) => setSleepData({...sleepData, notes: text})}
            />
          </View>

          {renderPreviousSleep()}

          {/* Sleep Tips */}
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-4 mt-4 mb-6`}>
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Sleep Tips</Text>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="bulb-outline" size={20} color="#3b82f6" />
                <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ml-2`}>Maintain a consistent sleep schedule</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="phone-portrait-outline" size={20} color="#3b82f6" />
                <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ml-2`}>Avoid screens before bedtime</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cafe-outline" size={20} color="#3b82f6" />
                <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ml-2`}>Limit caffeine intake after 2 PM</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {showTimePicker && (
          <DateTimePicker
            value={timeType === 'bed' ? sleepData.bedTime : sleepData.wakeTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {/* Settings Modal */}
        <SettingsModal />

        {/* Save Button */}
        <View className={`px-4 py-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <TouchableOpacity
            className="bg-blue-500 rounded-xl py-3 items-center"
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">Save Sleep Data</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default SleepTracker;

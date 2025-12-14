import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useTheme } from '../context/ThemeContext'


const NotificationDetail = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { title, message, time, type, data } = params;

  // Parse data if it's a string or object
  const formatData = React.useMemo(() => {
    if (!data) return null;
    
    try {
      // Handle string data
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      
      // Handle object data
      if (typeof data === 'object') {
        return data;
      }
      
      return null;
    } catch (e) {
      console.log('Error parsing data:', e);
      console.log('Raw data:', data);
      return null;
    }
  }, [data]);

  // Add debug logging
  React.useEffect(() => {
    console.log('Data type:', typeof data);
    console.log('Raw data:', data);
    console.log('Formatted data:', formatData);
  }, [data, formatData]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'achievement':
        return { name: 'trophy', color: '#f59e0b', bg: '#fef3c7' };
      case 'reminder':
        return { name: 'time', color: '#3b82f6', bg: '#dbeafe' };
      case 'social':
        return { name: 'people', color: '#10b981', bg: '#d1fae5' };
      case 'system':
        return { name: 'settings', color: '#6366f1', bg: '#e0e7ff' };
      default:
        return { name: 'notifications', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <LinearGradient
          colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
          className="px-4 py-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2 -ml-2"
            >
              <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#fff" : "#374151"} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Notification
            </Text>
          </View>
        </LinearGradient>

        <View className="flex-1">
          {/* Main Content ScrollView */}
          <ScrollView className="p-4">
            {/* Header Section */}
            <View className="flex-row items-center mb-4">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: getNotificationIcon(type).bg }}
              >
                <Ionicons 
                  name={getNotificationIcon(type).name}
                  size={24}
                  color={getNotificationIcon(type).color}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </Text>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {time}
                </Text>
              </View>
            </View>

            {/* Message Section */}
            <View className={`p-4 rounded-xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {message}
              </Text>
            </View>

            {/* Notification Details */}
            <View className={`rounded-xl overflow-hidden mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <View className="p-4 border-b border-gray-700">
                <Text className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  NOTIFICATION DETAILS
                </Text>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</Text>
                    <Text className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {type?.charAt(0).toUpperCase() + type?.slice(1) || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Received</Text>
                    <Text className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {time || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Additional Data Section */}
              {formatData && typeof formatData === 'object' && (
                <View className="p-4">
                  <Text className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    ADDITIONAL DATA
                  </Text>
                  <View className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    {Object.entries(formatData).map(([key, value]) => (
                      <View key={key} className="flex-row justify-between py-1">
                        <Text className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {key}:
                        </Text>
                        <Text className={`ml-2 flex-1 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
};

export default NotificationDetail;

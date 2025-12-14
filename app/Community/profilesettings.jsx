import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

/**
 * ProfileSettings Component
 * Displays user profile settings and navigation options
 */
const ProfileSettings = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (route) => {
    if (route) {
      navigation.navigate(route);
    }
  };
  
  const settingOptions = [
    {
      title: 'Profile',
      options: [
        { label: 'Saved Posts', icon: 'bookmark-outline', route: 'Community/SavedPosts' },
        { label: 'Liked Posts', icon: 'heart-outline', route: 'Community/LikedPosts' },
      ]
    },
  ];
  return (
    <SafeAreaView
      edges={['top']}
      className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View
        className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} bg-transparent`}
        style={{ backgroundColor: 'transparent' }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Profile Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Settings Options */}
      <ScrollView className="flex-1">
        {settingOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6 mx-4">
            <Text
              className={`px-2 py-1 uppercase font-bold text-xs tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ letterSpacing: 1.2 }}
            >
              {section.title}
            </Text>
            <View
              className={`rounded-2xl overflow-hidden mt-2 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: isDarkMode ? '#222' : '#aaa',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {section.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  className={`flex-row items-center justify-between px-5 py-4 ${optionIndex !== section.options.length - 1 ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : ''}`}
                  onPress={() => option.onPress ? option.onPress() : handleNavigation(option.route)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`rounded-full p-2 mr-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                      style={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon
                        name={option.icon}
                        size={22}
                        color={option.textColor ? (isDarkMode ? '#ef4444' : '#ef4444') : (isDarkMode ? '#f3f4f6' : '#374151')}
                      />
                    </View>
                    <Text className={`text-base font-medium ${option.textColor ? (isDarkMode ? option.textColor : option.textColor) : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                      {option.label}
                    </Text>
                  </View>
                  {option.route && (
                    <Icon name="chevron-forward-outline" size={20} color={isDarkMode ? '#9ca3af' : '#a3a3a3'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSettings;
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

const ReportPost = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();
  const [reason, setReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { postId, isUserReport, userName } = useLocalSearchParams();
  // Get the title based on the report type
  const getReportTitle = () => {
    if (isUserReport === 'true') {
      return `Report @${userName || 'User'}`;
    }
    return 'Report Post';
  };

  const reportCategories = [
    'Spam',
    'Harassment',
    'False Information',
    'Hate Speech',
    'Violence',
    'Inappropriate Content',
    'Other'
  ];

  const handleSubmitReport = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a report category');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/posts/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          userId: user?.$id || user?._id,
          reporterName: user?.username,
          category: selectedCategory,
          reason: reason.trim(),
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. We will review it shortly.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again later.');
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <View className={`flex-row items-center p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {getReportTitle()}
          </Text>
      </View>

      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Why are you reporting this {isUserReport === 'true' ? 'user' : 'post'}?
        </Text>

        {reportCategories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            className={`flex-row items-center p-4 mb-2 rounded-lg border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-300'
            } ${
              selectedCategory === category
                ? isDarkMode
                  ? 'bg-gray-800'
                  : 'bg-gray-100'
                : ''
            }`}
          >
            <View className={`w-6 h-6 rounded-full border-2 mr-3 ${
              isDarkMode ? 'border-gray-500' : 'border-gray-400'
            } ${
              selectedCategory === category
                ? isDarkMode
                  ? 'border-white bg-white'
                  : 'border-black bg-black'
                : ''
            }`}>
              {selectedCategory === category && (
                <View className={`flex-1 m-1 rounded-full ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`} />
              )}
            </View>
            <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-base`}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}

        <Text className={`text-lg font-semibold mt-6 mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Additional Details (Optional)
        </Text>
        <TextInput
          className={`border p-3 rounded-lg mb-6 ${
            isDarkMode
              ? 'border-gray-700 text-white bg-gray-800'
              : 'border-gray-300 text-black bg-gray-50'
          }`}
          placeholder="Provide more details about your report..."
          placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          onPress={handleSubmitReport}
          className={`py-3 px-6 mb-10 rounded-lg ${
            isDarkMode ? 'bg-white' : 'bg-black'
          }`}
        >
          <Text
            className={`text-center text-base font-semibold ${
              isDarkMode ? 'text-black' : 'text-white'
            }`}
          >
            Submit Report
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportPost;

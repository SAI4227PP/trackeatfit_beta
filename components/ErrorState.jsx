import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ErrorState = ({ error, isDarkMode, onRetry }) => {
  if (!error) return null;
  const errorText = error ? error.toString().toLowerCase() : '';
  // Improved error detection
  const isNetwork =
    errorText.includes('network error') ||
    errorText.includes('failed to fetch') ||
    errorText.includes('internet');
  const isTimeout =
    !isNetwork &&
    (errorText.includes('timeout') ||
      errorText.includes('timed out') ||
      errorText.includes('abort'));
  const isHttp =
    errorText.startsWith('http error') ||
    errorText.includes('http error:');

  return (
    <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>  
      <Ionicons name="alert-circle-outline" size={48} color={isDarkMode ? '#00b894' : '#00916E'} style={{ marginBottom: 12 }} />
      <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-center mb-4 text-lg font-semibold`}>
        {isNetwork
          ? 'Network error occurred'
          : isTimeout
            ? 'Request timed out'
            : isHttp
              ? error.toString()
              : error && error.toString()}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className={`px-6 py-2 rounded-lg ${isDarkMode ? 'bg-gray-100' : 'bg-gray-700'} mt-2`}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center">
          <Ionicons name="refresh-outline" size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-semibold">Refresh</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ErrorState;

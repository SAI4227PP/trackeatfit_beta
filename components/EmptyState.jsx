import { View, Text } from 'react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

const EmptyState = ({ iconName, title, subtitle, buttonText, onButtonPress }) => {

  const CustomButtons = ({ title, handlePress, containerStyles, textStyles, isLoading }) => {
    return (
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.7}
        className={`bg-gray-600
        rounded-sm min-h-[45px] justify-center items-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
        disabled={isLoading}
      >
        <Text className={`text-white font-semibold text-sm ${textStyles}`}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className='flex-row justify-center items-center mx-2 px-1 border rounded-lg p-1 bg-slate-800'>
      {/* Left Side (30%) */}
      <View className='w-25 justify-center items-center'>
        <Icon name={iconName} size={70} color="white" /> 
      </View>

      {/* Right Side (70%) */}
      <View className='w-4/5 justify-center items-start px-2'>
        <Text className='text-xl font-semibold text-white mt-2 mb-2'>{title}</Text>

        <Text className='font-medium text-sm text-gray-100 text-left mt-1 mb-1'>
          {subtitle}
        </Text>

        <CustomButtons
          title={buttonText}
          handlePress={onButtonPress}
          containerStyles="w-[80%] my-1"
        />
      </View>
    </View>
  );
};

export default EmptyState;

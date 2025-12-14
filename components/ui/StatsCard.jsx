import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const StatsCard = ({ title, value, unit, icon, colors, iconColor }) => (
  <LinearGradient
    colors={colors || ['#ffffff', '#f8fafc']}
    className="rounded-xl p-4 shadow-sm"
  >
    <View className="flex-row justify-between items-center">
      <Text className="text-gray-600 font-medium text-sm">{title}</Text>
      <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: iconColor + '15' }}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
    </View>
    <View className="flex-row items-baseline mt-2">
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 ml-1 text-sm">{unit}</Text>
    </View>
  </LinearGradient>
);

export default StatsCard;

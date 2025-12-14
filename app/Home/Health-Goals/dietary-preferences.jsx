import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from 'expo-router';

const API_URL = "https://trackeatfit.onrender.com";

const DietaryPreferences = () => {
  const navigation = useNavigation();
  const [preferences, setPreferences] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  });

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Icon name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-2">Dietary Preferences</Text>
      </View>

      <ScrollView className="p-4">
        {Object.entries(preferences).map(([key, value]) => (
          <View key={key} className="flex-row justify-between items-center py-4 border-b border-gray-100">
            <Text className="text-gray-700 text-base capitalize">{key.replace(/([A-Z])/g, ' $1')}</Text>
            <Switch
              value={value}
              onValueChange={() => togglePreference(key)}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DietaryPreferences;

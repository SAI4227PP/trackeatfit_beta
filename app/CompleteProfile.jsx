import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, TextInput, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useGlobalContext } from '../context/GlobalProvider';
import CustomPicker from '../components/CustomPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://trackeatfit.onrender.com";

const { width } = Dimensions.get('window');

const SectionIndicator = ({ index, currentSection, isDarkMode }) => (
  <View className={`h-1 flex-1 mx-1 rounded-full ${
    currentSection === index 
      ? isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
      : currentSection > index
        ? 'bg-green-500'
        : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
  }`}
  />
);

const FormSection = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  return (
    <View className="mb-6">
      <Text className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const CompleteProfile = () => {
  const { isDarkMode } = useTheme();
  const { user, updateUser } = useGlobalContext();
  const [currentSection, setCurrentSection] = useState(0);
  
  // Define all options before renderSections
  const genderOptions = [
    { id: '1', label: 'Male', value: 'male' },
    { id: '2', label: 'Female', value: 'female' },
    { id: '3', label: 'Other', value: 'other' }
  ];

  const activityOptions = [
    { id: '1', label: 'Sedentary (little or no exercise)', value: 'sedentary' },
    { id: '2', label: 'Lightly active (1-3 days/week)', value: 'light' },
    { id: '3', label: 'Moderately active (3-5 days/week)', value: 'moderate' },
    { id: '4', label: 'Very active (6-7 days/week)', value: 'very_active' },
    { id: '5', label: 'Super active (athlete/physical job)', value: 'super_active' },
  ];

  const bloodTypeOptions = [
    { id: '1', label: 'A+', value: 'a_positive' },
    { id: '2', label: 'A-', value: 'a_negative' },
    { id: '3', label: 'B+', value: 'b_positive' },
    { id: '4', label: 'B-', value: 'b_negative' },
    { id: '5', label: 'AB+', value: 'ab_positive' },
    { id: '6', label: 'AB-', value: 'ab_negative' },
    { id: '7', label: 'O+', value: 'o_positive' },
    { id: '8', label: 'O-', value: 'o_negative' },
  ];

  const dietaryOptions = [
    { id: '1', label: 'No Restrictions', value: 'none' },
    { id: '2', label: 'Vegetarian', value: 'vegetarian' },
    { id: '3', label: 'Vegan', value: 'vegan' },
    { id: '4', label: 'Paleo', value: 'paleo' },
    { id: '5', label: 'Keto', value: 'keto' },
  ];

  const mealFrequencyOptions = [
    { id: '1', label: '3 meals per day', value: '3_meals' },
    { id: '2', label: '4 meals per day', value: '4_meals' },
    { id: '3', label: '2 meals per day', value: '2_meals' },
    { id: '4', label: '5+ meals per day', value: '5_plus_meals' },
  ];

  // Update form data structure to match new User model
  const [formData, setFormData] = useState({    personal: {
      age: '',
      gender: 'select',
      height: '',
      weight: '',
      targetWeight: '',
      weightUnit: 'kg',
    },
    health: {
      medicalConditions: [],
      allergies: [],
      medications: [],
      bloodType: 'unknown',
      dietaryRestrictions: 'none',
      activityLevel: 'sedentary',
    },
    goals: {
      fitnessGoal: 'general_health',
      weightGoal: 'maintain',
      weeklyExerciseDays: 3,
      preferredExerciseTypes: [],
    },
    metrics: {
      bmi: null,
      bmr: null,
      tdee: null,
      idealWeightRange: {
        min: null,
        max: null
      }
    }
  });

  // Update handle input change to handle nested structure
  const handleInputChange = (section, name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [name]: value
      }
    }));
  };

  const renderInputField = (section, label, key, placeholder, keyboardType = 'default', required = true) => {
    console.log('Rendering field:', { key, currentValue: formData[section][key] });
    return (
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
          value={formData[section][key]}
          onChangeText={(text) => handleInputChange(section, key, text)}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
          keyboardType={keyboardType}
          className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}`}
          style={{ fontSize: 16 }}
          returnKeyType="done"
        />
      </View>
    );
  };

  const renderPicker = (section, label, key, options, required = true) => (
    <View className="mb-4">
      <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl`}>
        <CustomPicker
          value={formData[section][key]}
          items={options}
          onValueChange={(value) => handleInputChange(section, key, value)}
        />
      </View>
    </View>
  );

  // Now define renderSections after all required functions and options are defined
  const renderSections = () => [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Complete your age, gender, and other basic details',
      completed: false,
      content: (
        <FormSection title="Basic Information">
          {renderInputField('personal', 'Age', 'age', 'Enter your age', 'numeric')}
          {renderPicker('personal', 'Gender', 'gender', genderOptions)}
        </FormSection>
      )
    },
    {
      id: 'physical',
      title: 'Physical Metrics',
      description: 'Add your height, weight, and body measurements',
      completed: false,
      content: (
        <FormSection title="Physical Metrics">
          {renderInputField('personal', 'Height (cm)', 'height', 'Enter your height', 'numeric')}
          {renderInputField('personal', 'Weight (kg)', 'weight', 'Enter your weight', 'numeric')}
          {renderInputField('personal', 'Target Weight (kg)', 'targetWeight', 'Enter target weight', 'numeric')}
          {/* {metrics.bmi && <MetricsDisplay metrics={metrics} />} */}
        </FormSection>
      )
    },
    {
      id: 'health',
      title: 'Health Profile',
      description: 'Set your activity level and blood type',
      completed: false,
      content: (
        <FormSection title="Health Profile">
          {renderPicker('health', 'Activity Level', 'activityLevel', activityOptions)}
          {renderPicker('health', 'Blood Type', 'bloodType', bloodTypeOptions)}
        </FormSection>
      )
    },
    {
      id: 'nutrition',
      title: 'Nutrition Preferences',
      description: 'Choose your dietary preferences and meal frequency',
      completed: false,
      content: (
        <FormSection title="Nutrition Preferences">
          {renderPicker('health', 'Dietary Preference', 'dietaryRestrictions', dietaryOptions)}
          {renderPicker('health', 'Meal Frequency', 'mealPreference', mealFrequencyOptions)}
        </FormSection>
      )
    }
  ];

  // Get sections and current content
  const sections = renderSections();
  const currentContent = sections[currentSection].content;

  // Validate section before moving to next
  const validateCurrentSection = () => {
    const currentSectionData = sections[currentSection];
    console.log('Validating section:', currentSectionData.id);
    console.log('Current form data:', formData);
    
    switch (currentSectionData.id) {
      case 'basic':
        return formData.personal.age && formData.personal.gender !== 'select';      case 'physical':
        return formData.personal.height && formData.personal.weight && formData.personal.targetWeight;
      case 'health':
        return formData.health.activityLevel !== 'sedentary';
      case 'nutrition':
        return true; // Optional section
      default:
        return true;
    }
  };

  // Add logging to navigation
  const handleNext = async () => {
    console.log('Attempting to move to next section');
    console.log('Current section:', currentSection);
    
    if (!validateCurrentSection()) {
      Alert.alert('Required Fields', 'Please fill in all required fields before continuing.');
      return;
    }

    if (currentSection === sections.length - 1) {
      // Save all data
      try {
        const healthMetrics = calculateHealthMetrics(formData);
        const updatedUserData = {
          ...formData,
          ...healthMetrics,
          lastUpdated: new Date().toISOString(),
        };

        const result = await updateHealthDetails(updatedUserData);
        
        if (updateUser) {
          await updateUser(result.user);
        }

        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
        ]);
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to update profile');
        console.error('Update error:', error);
      }
    } else {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  // Add calculateHealthMetrics function
  const calculateHealthMetrics = (data) => {
    const height = parseFloat(data.personal.height) / 100; // convert to meters
    const weight = parseFloat(data.personal.weight);
    const age = parseFloat(data.personal.age);

    if (isNaN(height) || isNaN(weight) || isNaN(age)) {
      return {
        bmi: null,
        bmr: null,
        tdee: null,
        idealWeightRange: { min: null, max: null }
      };
    }

    const bmi = (weight / (height * height)).toFixed(1);

    let bmr;
    if (data.personal.gender === 'male') {
      bmr = (10 * weight) + (6.25 * data.personal.height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * data.personal.height) - (5 * age) - 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      super_active: 1.9,
    };
    
    const tdee = Math.round(bmr * activityMultipliers[data.health.activityLevel]);

    const minHealthyBMI = 18.5;
    const maxHealthyBMI = 24.9;
    const idealWeightRange = {
      min: Math.round(minHealthyBMI * height * height),
      max: Math.round(maxHealthyBMI * height * height),
    };

    return { bmi, bmr: Math.round(bmr), tdee, idealWeightRange };
  };

  // Add updateHealthDetails function
  const updateHealthDetails = async (userData) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Sending data:', userData);

      const response = await fetch(`${API_URL}/users/health-details/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to update health details');
      }

      const result = await response.json();
      console.log('API Success Response:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Progress Indicators */}
      <View className="px-4 pt-6">
        <View className="flex-row h-1">
          {sections.map((section, index) => (
            <SectionIndicator 
              key={section.id}
              index={index}
              currentSection={currentSection}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Current Section Content */}
      <ScrollView className="flex-1 px-4 mt-6">
        {currentContent}
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="p-4 flex-row justify-between">
        <TouchableOpacity
          onPress={handleBack}
          className={`px-6 py-3 rounded-xl ${currentSection === 0 ? 'opacity-50' : ''} ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}
          disabled={currentSection === 0}
        >
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleNext}
          className={`px-6 py-3 rounded-xl ${
            isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}
        >
          <Text className="text-white font-medium">
            {currentSection === sections.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CompleteProfile;

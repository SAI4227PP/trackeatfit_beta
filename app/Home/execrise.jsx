import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useGlobalContext } from '../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

const { width } = Dimensions.get('window');

const ExerciseTracker = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id;

  // Recommended Exercises State
  const [exerciseRecs, setExerciseRecs] = useState({});
  const [loadingExerciseRecs, setLoadingExerciseRecs] = useState(true);

  // Fetch recommended exercises (grouped by muscle group)
  useEffect(() => {
    if (!userId) return;
    const fetchExerciseRecs = async () => {
      setLoadingExerciseRecs(true);
      try {
        const response = await fetch(`${API_URL}/api/v3/recommendation/exercise-recommendations/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch exercise recommendations');
        const data = await response.json();
        if (data.success && data.data && data.data.recommendations) {
          setExerciseRecs(data.data.recommendations);
        } else {
          setExerciseRecs({});
        }
      } catch (e) {
        setExerciseRecs({});
      } finally {
        setLoadingExerciseRecs(false);
      }
    };
    fetchExerciseRecs();
  }, [userId]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState('workouts');

  const categories = [
    { id: 'all', name: 'All', icon: 'fitness', color: '#3b82f6' },
    { id: 'cardio', name: 'Cardio', icon: 'walk', color: '#ef4444' },
    { id: 'strength', name: 'Strength', icon: 'barbell', color: '#8b5cf6' },
    { id: 'yoga', name: 'Yoga', icon: 'body', color: '#10b981' },
  ];

  const workouts = [
    {
      id: 1,
      name: "Full Body Workout",
      duration: "45 min",
      exercises: [
        { name: "Push-ups", sets: 3, reps: 15 },
        { name: "Squats", sets: 3, reps: 20 },
        { name: "Plank", sets: 3, duration: "30 sec" }
      ],
      calories: 300,
      level: "Intermediate",
      category: "strength",
      image: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&auto=format&fit=crop"
    },
    {
      id: 2,
      name: "HIIT Cardio",
      duration: "30 min",
      exercises: [
        { name: "Jumping Jacks", duration: "45 sec" },
        { name: "Mountain Climbers", duration: "45 sec" },
        { name: "Burpees", duration: "30 sec" }
      ],
      calories: 400,
      level: "Advanced",
      category: "cardio",
      image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop"
    }
  ];

  const stats = [
    { label: 'Workouts', value: '12', icon: 'fitness', color: '#3b82f6' },
    { label: 'Calories', value: '845', icon: 'flame', color: '#ef4444' },
    { label: 'Minutes', value: '164', icon: 'time', color: '#10b981' },
  ];

  const filteredWorkouts = selectedCategory === 'all' 
    ? workouts 
    : workouts.filter(workout => workout.category === selectedCategory);

  // Flatten all recommended exercises into a single array
  const quickStartExercises = exerciseRecs && typeof exerciseRecs === 'object'
    ? Object.values(exerciseRecs).flat()
    : [];

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <LinearGradient
        colors={isDarkMode ? 
          ['#111827', '#1F2937', '#374151'] : 
          ['#f8fafc', '#f1f5f9', '#e2e8f0']}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="mr-4"
              >
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
              </TouchableOpacity>
              <View>
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exercise</Text>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Track your fitness journey</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => {}} 
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded-full`}
            >
              <Ionicons name="calendar-outline" size={22} color={isDarkMode ? "#F9FAFB" : "#374151"} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Weekly Stats */}
          <View className="px-4 mb-6">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>This Week</Text>
            <View className="flex-row justify-between">
              {stats.map((stat, index) => (
                <Animated.View 
                  key={stat.label}
                  entering={FadeIn.delay(index * 100)}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-sm flex-1 mx-1`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-2`}
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</Text>
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</Text>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Quick Start Section */}
          <View className="px-4 mb-6">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Start</Text>
            {loadingExerciseRecs ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
                {[1,2,3].map((_, idx) => (
                  <View key={idx} className="rounded-2xl overflow-hidden" style={{ width: 290, height: 200 }}>
                    <View className="w-full h-full bg-gray-200 animate-pulse" />
                  </View>
                ))}
              </ScrollView>
            ) : quickStartExercises && quickStartExercises.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
                {quickStartExercises.map((ex, idx) => (
                  <TouchableOpacity
                    key={ex._id || ex.exerciseName || idx}
                    className=" rounded-2xl overflow-hidden shadow-sm"
                    style={{ width: 290, height: 200 }}
                    onPress={() => navigation.navigate('WorkoutDetail', { workout: ex })}
                  >
                    <ImageBackground
                      source={{ uri: ex.mainImage || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                      className="w-full h-full justify-end"
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        className="p-2 justify-end"
                        style={{ height: 200 }}
                      >
                        <Text className="text-white text-base font-bold mb-1" numberOfLines={2}>
                          {ex.exerciseName}
                        </Text>
                        <View className="flex-row items-center mb-1">
                          <Text className="text-white font-medium text-xs mr-2">{ex.category}</Text>
                          <Text className="text-white font-medium text-lg mr-2">•</Text>
                          <Text className="text-white font-medium text-xs mr-2">{ex.bodyPart}</Text>
                          <Text className="text-white font-medium text-lg mr-2">•</Text>
                          <Text className="text-white font-medium text-xs">{Array.isArray(ex.equipment) ? ex.equipment.join(', ') : ex.equipment}</Text>
                        </View>
                        <View className="flex-row items-center justify-between mt-2">
                          <View className="flex-row items-center">
                            <View className="flex-row items-center bg-black/30 rounded-full px-2 py-1">
                              <Ionicons name="star" size={12} color="#fbbf24" />
                              <Text className="text-white ml-1 font-medium text-xs">
                                {ex.rating?.toFixed(1) || '4.0'}
                              </Text>
                            </View>
                            <View className="flex-row items-center bg-black/30 rounded-full px-2 py-1 mr-2">
                              <Ionicons name="timer-outline" size={14} color="#22d3ee" />
                              <Text className="text-white ml-1 font-medium text-xs">
                                {ex.duration || 30}s
                              </Text>
                            </View>
                            <View className="flex-row items-center bg-black/30 rounded-full px-2 py-1">
                              <Ionicons name="flame-outline" size={14} color="#f87171" />
                              <Text className="text-white ml-1 font-medium text-xs">
                                {ex.caloriesBurnedPerSet || 30}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-gray-500 text-center">No exercise recommendations yet. Complete more workouts to get personalized suggestions.</Text>
            )}
          </View>

          {/* Categories */}
          <View className="mb-6">
            <View className="px-4 mb-4">
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Categories</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="px-4"
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`mr-3 px-4 py-3 rounded-xl flex-row items-center ${
                    selectedCategory === category.id 
                      ? 'bg-blue-500' 
                      : isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                  style={{
                    shadowColor: isDarkMode ? '#000' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3
                  }}
                >
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    selectedCategory === category.id ? 'bg-blue-400' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Ionicons 
                      name={category.icon} 
                      size={18} 
                      color={selectedCategory === category.id ? '#ffffff' : category.color} 
                    />
                  </View>
                  <Text className={`ml-2 font-medium ${
                    selectedCategory === category.id ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Workouts List */}
          <View className="px-4">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Featured Workouts</Text>
            {filteredWorkouts.map((workout) => (
              <Animated.View
                key={workout.id}
                entering={FadeIn.delay(200)}
                className="mb-4"
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('WorkoutDetail', { workout })}
                >
                  <ImageBackground
                    source={{ uri: workout.image }}
                    className="rounded-xl overflow-hidden"
                    imageStyle={{ borderRadius: 12 }}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      className="p-4"
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-lg font-bold text-white">{workout.name}</Text>
                        <View className="bg-white/20 backdrop-blur-lg px-3 py-1 rounded-full">
                          <Text className="text-white text-sm font-medium">{workout.level}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={14} color="#fff" />
                          <Text className="ml-1 text-white">{workout.duration}</Text>
                        </View>
                        <Text className="mx-2 text-white/50">•</Text>
                        <View className="flex-row items-center">
                          <Ionicons name="flame-outline" size={14} color="#fff" />
                          <Text className="ml-1 text-white">{workout.calories} cal</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Action Button */}
        <View className="p-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('Workout')}
            className="w-full"
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-4"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="play-circle" size={24} color="#ffffff" />
                <Text className="text-white font-bold text-lg ml-2">
                  Start New Workout
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default ExerciseTracker;

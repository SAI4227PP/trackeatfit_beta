import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { format, addDays, subDays } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDate = (date) => {
  return format(date, 'EEEE, MMMM do, yyyy');
};

const calculateDailyCalories = (meals) => {
  return meals.reduce((total, meal) => total + parseInt(meal.calories), 0);
};

const SAMPLE_PLANS = [
  {
    title: "Professional 7-Day Indian Wellness Diet",
    description: "Balanced Indian cuisine for optimal nutrition",
    image: "https://example.com/indian-diet.jpg",
    days: [
      {
        day: "Day 1",
        totalCalories: "2000",
        meals: [
          {
            meal: "Breakfast",
            dish: "Moong dal cheela (2 small) with a small bowl of curd (yogurt)",
            calories: "350",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "A handful of mixed nuts and seeds (almonds, walnuts, flax seeds)",
            calories: "150",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Brown rice khichdi with a side of bottle gourd (Lauki) sabzi",
            calories: "500",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Chicken breast curry with steamed brown rice and spinach saag",
            calories: "500",
            time: "7:30 PM"
          }
        ]
      },
      {
        day: "Day 2",
        totalCalories: "2100",
        meals: [
          {
            meal: "Breakfast",
            dish: "Vegetable poha (flattened rice) with chopped vegetables",
            calories: "400",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "Banana with a small amount of peanut butter",
            calories: "150",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Rajma (kidney beans) curry with whole wheat roti (2)",
            calories: "550",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Fish curry with steamed brown rice and cucumber raita",
            calories: "600",
            time: "7:30 PM"
          }
        ]
      },
      {
        day: "Day 3",
        totalCalories: "2050",
        meals: [
          {
            meal: "Breakfast",
            dish: "Oats porridge with milk and chopped nuts",
            calories: "300",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "Apple slices with a tablespoon of almond butter",
            calories: "150",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Masoor dal with brown rice and a small side salad",
            calories: "600",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Paneer bhurji with whole wheat roti (2)",
            calories: "600",
            time: "7:30 PM"
          }
        ]
      },
      {
        day: "Day 4",
        totalCalories: "2150",
        meals: [
          {
            meal: "Breakfast",
            dish: "Besan chilla with a side of chutney",
            calories: "400",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "A small bowl of fruit salad (banana, apple, grapes)",
            calories: "200",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Chicken and vegetable stir-fry with brown rice",
            calories: "600",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Palak paneer with whole wheat roti (2)",
            calories: "550",
            time: "7:30 PM"
          }
        ]
      },
      {
        day: "Day 5",
        totalCalories: "2000",
        meals: [
          {
            meal: "Breakfast",
            dish: "Idli (2-3) with sambar and coconut chutney",
            calories: "350",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "Sprouts salad with a lemon dressing",
            calories: "150",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Vegetable biryani with a side of raita",
            calories: "500",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Lentil soup with whole wheat toast (1)",
            calories: "600",
            time: "7:30 PM"
          }
        ]
      },
      {
        day: "Day 6",
        totalCalories: "2100",
        meals: [
          {
            meal: "Breakfast",
            dish: "Upma (semolina porridge) with vegetables",
            calories: "350",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "Dates and a glass of milk",
            calories: "150",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Chole with whole wheat roti (2)",
            calories: "600",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Fish tikka masala with brown rice",
            calories: "600",
            time: "7:30 PM"
          }
        ]
      },
      {
        day: "Day 7",
        totalCalories: "2050",
        meals: [
          {
            meal: "Breakfast",
            dish: "Scrambled eggs (2) with whole wheat toast (1)",
            calories: "400",
            time: "8:00 AM"
          },
          {
            meal: "Mid-Morning Snack",
            dish: "Yogurt with a sprinkle of granola",
            calories: "150",
            time: "10:30 AM"
          },
          {
            meal: "Lunch",
            dish: "Aloo gobi with brown rice",
            calories: "500",
            time: "1:30 PM"
          },
          {
            meal: "Dinner",
            dish: "Vegetable curry with brown rice and side salad",
            calories: "600",
            time: "7:30 PM"
          }
        ]
      }
    ]
  }
];

const getCurrentDayMeals = (date) => {
  // Check if selected date is before current date
  if (date < new Date().setHours(0,0,0,0)) {
    return {
      day: format(date, 'MMMM d'),
      totalCalories: "0",
      meals: [{
        meal: "Past Date",
        dish: "Meal history not available",
        calories: "0",
        time: "--:--",
      }]
    };
  }

  // Calculate days difference from current date
  const diffInDays = Math.floor((date - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  
  // Get meals for current and future dates
  return SAMPLE_PLANS[0]?.days[diffInDays] || {
    day: format(date, 'MMMM d'),
    totalCalories: "0",
    meals: [{
      meal: "No Plan Available",
      dish: "No meal plan available for this date",
      calories: "0",
      time: "--:--",
    }]
  };
};

// First, update the getMealIcon function to make it simpler
const getMealIcon = (mealType) => {
  switch (mealType) {
    case 'Breakfast':
      return 'sunny';
    case 'Mid-Morning Snack':
      return 'cafe';
    case 'Lunch':
      return 'restaurant';
    case 'Dinner':
      return 'moon';
    default:
      return 'nutrition';
  }
};

// Add animation configuration at the top
const cardAnimationStyle = {
  shadowColor: '#1a1a1a',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 10,
  transform: [{ scale: 1 }],
};

// Add helper function to check if all meals are completed for a date
const isDateCompleted = (date, completedMeals) => {
  const dayMeals = getCurrentDayMeals(date).meals;
  return dayMeals.every((_, index) => 
    completedMeals[getMealKey(date, index)]
  );
};

// Add helper function to check if date has meal plans
const hasMealPlans = (date) => {
  const dayMeals = getCurrentDayMeals(date);
  return !dayMeals.meals[0].meal.includes('No Plan') && 
         !dayMeals.meals[0].meal.includes('Past Date');
};

// Add these helper functions at the top level
const STORAGE_KEY = '@NutrixPath:completedMeals';
const PROGRESS_KEY = '@NutrixPath:dailyProgress';

const saveCompletedMeals = async (completedMeals) => {
  try {
    const normalizedMeals = {};
    // Convert all keys to normalized format
    Object.keys(completedMeals).forEach(key => {
      const [dateStr, mealIndex] = key.split('_');
      if (dateStr && mealIndex !== undefined) {
        normalizedMeals[key] = completedMeals[key];
      }
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedMeals));
    console.log('Saved normalized meals:', normalizedMeals);
  } catch (error) {
    console.error('Error saving completed meals:', error);
  }
};

const loadCompletedMeals = async () => {
  try {
    const savedMeals = await AsyncStorage.getItem(STORAGE_KEY);
    const parsedMeals = savedMeals ? JSON.parse(savedMeals) : {};
    
    // Convert old format to new format if needed
    const normalizedMeals = {};
    Object.entries(parsedMeals).forEach(([key, value]) => {
      if (key.includes('T')) {
        // Old format with timestamp
        const date = new Date(key.split('T')[0]);
        const mealIndex = key.slice(-1);
        const newKey = getMealKey(date, mealIndex);
        normalizedMeals[newKey] = value;
      } else {
        // Already in new format
        normalizedMeals[key] = value;
      }
    });

    // Save normalized format back if conversion happened
    if (Object.keys(normalizedMeals).length !== Object.keys(parsedMeals).length) {
      await saveCompletedMeals(normalizedMeals);
    }

    console.log('Loaded normalized meals:', normalizedMeals);
    return normalizedMeals;
  } catch (error) {
    console.error('Error loading completed meals:', error);
    return {};
  }
};

// Add new storage functions for daily progress
const saveDailyProgress = async (date, isCompleted) => {
  try {
    const progress = await AsyncStorage.getItem(PROGRESS_KEY);
    const currentProgress = progress ? JSON.parse(progress) : {};
    currentProgress[format(date, 'yyyy-MM-dd')] = isCompleted;
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(currentProgress));
  } catch (error) {
    console.error('Error saving daily progress:', error);
  }
};

const loadDailyProgress = async () => {
  try {
    const progress = await AsyncStorage.getItem(PROGRESS_KEY);
    return progress ? JSON.parse(progress) : {};
  } catch (error) {
    console.error('Error loading daily progress:', error);
    return {};
  }
};

// Add a new helper function to check if date is future
const isFutureDate = (date) => {
  return date > new Date().setHours(23, 59, 59, 999);
};

// Modify the getCardBorderStyle function to also check dailyProgress
const getCardBorderStyle = (date, mealIndex, completedMeals, dailyProgress) => {
  const dateStr = date.toISOString();
  const formattedDate = format(date, 'yyyy-MM-dd');
  const isMealCompleted = completedMeals[dateStr + mealIndex];
  const isDayCompleted = dailyProgress[formattedDate];

  if (isDayCompleted || isMealCompleted) {
    return 'border-green-500/50 border-2';
  }
  return 'border-gray-100';
};

// Update the loadInitialState function to preserve individual card states
const loadInitialState = async () => {
  try {
    // Load both states directly without modification
    const savedMeals = await loadCompletedMeals();
    const savedProgress = await loadDailyProgress();
    
    return {
      completedMeals: savedMeals,
      dailyProgress: savedProgress
    };
  } catch (error) {
    console.error('Error loading initial state:', error);
    return { completedMeals: {}, dailyProgress: {} };
  }
};

// Add helper to check meal completion
const getMealCompletionStatus = (date, mealIndex, completedMeals) => {
  const mealKey = date.toISOString() + mealIndex;
  return completedMeals[mealKey] === true;
};

// Add this new helper function
const getUpdatedDailyProgress = (date, completedMeals, currentMeals) => {
  return currentMeals.every((_, index) => 
    completedMeals[date.toISOString() + index]
  );
};

// Add this helper function at the top level
const normalizeDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

// Update the getMealKey function
const getMealKey = (date, mealIndex) => {
  return `${normalizeDate(date)}_${mealIndex}`;
};

const SampleDietPlan = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentDate = new Date();
  const scrollViewRef = React.useRef(null);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const dateItemWidth = 60; // Reduced from 80 to 60
  const totalDates = 15; // 7 previous + current + 7 next
  const [completedMeals, setCompletedMeals] = useState({});
  const [dailyProgress, setDailyProgress] = useState({});

  // Load saved meals when component mounts
  useEffect(() => {
    const initializeState = async () => {
      try {
        const savedMeals = await loadCompletedMeals();
        console.log('Initializing with saved meals:', savedMeals); // Debug log
        setCompletedMeals(savedMeals);
        
        const savedProgress = await loadDailyProgress();
        setDailyProgress(savedProgress);
      } catch (error) {
        console.error('Error initializing state:', error);
      }
    };
    
    initializeState();
  }, []); // Empty dependency array to run only once

  // Update handleMealCompletion to save to storage
  const handleMealCompletion = async (mealIndex) => {
    if (isFutureDate(selectedDate)) {
      Alert.alert(
        "Cannot Complete Future Meals",
        "You can only mark meals as completed for today or past dates."
      );
      return;
    }

    const mealKey = getMealKey(selectedDate, mealIndex);
    const newCompletedMeals = { 
      ...completedMeals,
      [mealKey]: !completedMeals[mealKey]
    };
    
    console.log('Updating completed meals:', newCompletedMeals); // Debug log
    
    // Update state first
    setCompletedMeals(newCompletedMeals);
    
    // Then save to storage
    await saveCompletedMeals(newCompletedMeals);

    // Update daily progress
    const dayMeals = getCurrentDayMeals(selectedDate).meals;
    const allCompleted = dayMeals.every((_, index) => 
      newCompletedMeals[getMealKey(selectedDate, index)]
    );

    const dateKey = normalizeDate(selectedDate);
    if (allCompleted !== dailyProgress[dateKey]) {
      const newProgress = { ...dailyProgress, [dateKey]: allCompleted };
      setDailyProgress(newProgress);
      await saveDailyProgress(selectedDate, allCompleted);
    }
  };

  // Modified weekDates calculation to show +/- 7 days from current date
  const weekDates = useMemo(() => {
    const dates = [];
    // Add 7 days before current date
    for (let i = 7; i > 0; i--) {
      dates.push(subDays(currentDate, i));
    }
    // Add current date
    dates.push(currentDate);
    // Add 7 days after current date
    for (let i = 1; i <= 7; i++) {
      dates.push(addDays(currentDate, i));
    }
    return dates;
  }, [currentDate]);

  const currentDayMeals = useMemo(() => {
    return getCurrentDayMeals(selectedDate);
  }, [selectedDate]);

  // Modified useEffect for centering current date
  useEffect(() => {
    if (scrollViewRef.current && scrollViewWidth > 0) {
      const centerIndex = 7;
      const centerOffset = (centerIndex * dateItemWidth) - (scrollViewWidth / 2) + (dateItemWidth / 2);
      
      // Ensure we don't scroll beyond content bounds
      const maxScroll = (totalDates * dateItemWidth) - scrollViewWidth;
      const safeOffset = Math.max(0, Math.min(centerOffset, maxScroll));
      
      scrollViewRef.current.scrollTo({ x: safeOffset, animated: false });
    }
  }, [scrollViewWidth]);

  // Update the date rendering to use dailyProgress
  const getDateStatus = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const hasPlan = hasMealPlans(date);
    const isCompleted = dailyProgress[dateKey];
    
    return { hasPlan, isCompleted };
  };

  // Update getMealCompletionStatus to properly check completed state
  const getMealCompletionStatus = useCallback((date, mealIndex, completedMeals) => {
    const mealKey = getMealKey(date, mealIndex);
    const isCompleted = completedMeals[mealKey] === true;
    console.log(`Checking completion for ${mealKey}:`, isCompleted); // Debug log
    return isCompleted;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with fixed icon */}
        <View className="bg-white px-5 py-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-900 text-xl font-bold">
              Meal Planner
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="p-2 rounded-full bg-gray-100"
            >
              <Icon name="close-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modified ScrollView to handle more dates */}
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="bg-white shadow-lg"
          contentContainerStyle={{ 
            paddingHorizontal: 16, // Reduced padding
            paddingVertical: 2, // Reduced vertical padding
          }}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setScrollViewWidth(width);
          }}
        >
          {weekDates.map((date, index) => {
            const isPastDate = date < new Date().setHours(0,0,0,0);
            const isCurrentDate = format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
            const { hasPlan, isCompleted } = getDateStatus(date);
            
            return (
              <TouchableOpacity
                key={date.toISOString()}
                onPress={() => setSelectedDate(date)}
                className={`px-2 py-2 mx-0.5 rounded-xl ${
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30'
                    : isCurrentDate && hasPlan
                    ? isCompleted 
                      ? 'bg-green-100'
                      : 'bg-red-100'
                    : isPastDate && hasPlan
                    ? isCompleted
                      ? 'bg-green-50'
                      : 'bg-red-50'
                    : 'bg-gray-50'
                }`}
                style={{ width: dateItemWidth - 1, opacity: isPastDate ? 0.7 : 1 }}
              >
                <Text className={`text-center text-sm font-medium ${
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ? 'text-white'
                    : isCurrentDate && hasPlan
                    ? isCompleted
                      ? 'text-green-700'
                      : 'text-red-700'
                    : isPastDate && hasPlan
                    ? isCompleted
                      ? 'text-green-600'
                      : 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {format(date, 'EEE')}
                </Text>
                <Text className={`text-center text-base font-bold mt-0.5 ${
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ? 'text-white'
                    : isCurrentDate && hasPlan
                    ? isCompleted
                      ? 'text-green-700'
                      : 'text-red-700'
                    : isPastDate && hasPlan
                    ? isCompleted
                      ? 'text-green-600'
                      : 'text-red-600'
                    : 'text-gray-800'
                }`}>
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Updated Meal Cards with correct icons */}
        <View className="px-4 py-6">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              {currentDayMeals?.day || 'Loading...'}
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Icon name="flame-outline" size={24} color="#ef4444" />
                <Text className="text-xl font-semibold text-gray-700 ml-2">
                  {currentDayMeals?.totalCalories || '0'} calories
                </Text>
              </View>
              {dailyProgress[format(selectedDate, 'yyyy-MM-dd')] && (
                <View className="flex-row items-center bg-green-100 px-4 py-1 rounded-full">
                  <Icon name="checkmark-circle" size={20} color="#15803d" />
                  <Text className="text-green-700 font-medium ml-1">
                    Day Completed
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {currentDayMeals?.meals?.map((meal, mealIndex) => (
            <TouchableOpacity 
              key={mealIndex}
              onPress={() => handleMealCompletion(mealIndex)}
              className={`mb-8 overflow-hidden relative ${
                getMealCompletionStatus(selectedDate, mealIndex, completedMeals)
                  ? 'opacity-92 transform scale-985'
                  : ''
              }`}
              activeOpacity={0.9}
              disabled={isFutureDate(selectedDate)}
            >
              <View 
                style={[
                  cardAnimationStyle,
                  { 
                    opacity: completedMeals[selectedDate.toISOString() + mealIndex] ? 0.92 : 1,
                    transform: [{ 
                      scale: completedMeals[selectedDate.toISOString() + mealIndex] ? 0.985 : 1 
                    }],
                    transition: 'all 0.3s ease'
                  }
                ]}
              >
                <View className={`
                  bg-white rounded-3xl border ${
                    getMealCompletionStatus(selectedDate, mealIndex, completedMeals)
                      ? 'border-green-500/50 border-2'
                      : 'border-gray-100'
                  }
                  ${meal.meal.toLowerCase().includes('breakfast') 
                    ? 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/90' 
                    : meal.meal.toLowerCase().includes('snack')
                    ? 'bg-gradient-to-br from-emerald-50/90 via-white to-green-50/90'
                    : meal.meal.toLowerCase().includes('lunch')
                    ? 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/90'
                    : 'bg-gradient-to-br from-purple-50/90 via-white to-violet-50/90'
                }`}
                >
                  {/* Add future date warning */}
                  {isFutureDate(selectedDate) && (
                    <View className="absolute top-0 right-0 m-4 z-20">
                      <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full">
                        <Icon name="time" size={16} color="#6b7280" />
                        <Text className="text-gray-600 text-sm font-medium ml-1">
                          Future Meal
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="p-8" style={{
                    opacity: isFutureDate(selectedDate) ? 0.7 : 1
                  }}>
                    {/* Rest of meal card content */}
                    <View className="flex-row justify-between items-start mb-5">
                      <View className="flex-row items-center flex-1">
                        <View 
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: meal.meal === 'Breakfast' 
                              ? '#f97316' 
                              : meal.meal === 'Mid-Morning Snack'
                              ? '#22c55e'
                              : meal.meal === 'Lunch'
                              ? '#6366f1'
                              : '#a855f7',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                          }}
                        >
                          {console.log('Rendering icon:', getMealIcon(meal.meal))}
                          <Icon 
                            name={getMealIcon(meal.meal)}
                            size={24}
                            color="white"
                          />
                        </View>
                        <View className="ml-4 flex-1">
                          <Text className="font-bold text-gray-900 text-xl mb-1">
                            {meal.meal}
                          </Text>
                          <View className="flex-row items-center">
                            <Icon name="time-outline" size={16} color="#6b7280" />
                            <Text className="text-gray-600 font-medium ml-1">
                              {meal.time}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className={`px-4 py-2 rounded-xl shadow-sm ${
                        meal.meal.toLowerCase().includes('breakfast')
                          ? 'bg-amber-100'
                          : meal.meal.toLowerCase().includes('snack')
                          ? 'bg-emerald-100'
                          : meal.meal.toLowerCase().includes('lunch')
                          ? 'bg-indigo-100'
                          : 'bg-purple-100'
                      }`}>
                        <Text className={`font-bold text-base ${
                          meal.meal.toLowerCase().includes('breakfast')
                            ? 'text-amber-700'
                            : meal.meal.toLowerCase().includes('snack')
                            ? 'text-emerald-700'
                            : meal.meal.toLowerCase().includes('lunch')
                            ? 'text-indigo-700'
                            : 'text-purple-700'
                        }`}>
                          {meal.calories} cal
                        </Text>
                      </View>
                    </View>
                    <View className="pl-16">
                      <Text className="text-gray-800 text-lg mb-4 leading-relaxed font-medium">
                        {meal.dish}
                      </Text>

                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center gap-3">
                          {meal.protein && (
                            <View className="bg-gray-100 px-3 py-1 rounded-lg flex-row items-center">
                              <Icon name="barbell-outline" size={16} color="#4b5563" />
                              <Text className="text-gray-600 font-medium ml-1">
                                {meal.protein}
                              </Text>
                            </View>
                          )}
                          {getMealCompletionStatus(selectedDate, mealIndex, completedMeals) && (
                            <View className="bg-green-100 px-3 py-1 rounded-lg flex-row items-center">
                              <Icon name="checkmark-circle" size={16} color="#15803d" />
                              <Text className="text-green-700 font-medium ml-1">
                                Completed
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity 
                          className={`flex-row items-center px-4 py-2 rounded-xl ${
                            meal.meal.toLowerCase().includes('breakfast')
                              ? 'bg-amber-500'
                              : meal.meal.toLowerCase().includes('snack')
                              ? 'bg-emerald-500'
                              : meal.meal.toLowerCase().includes('lunch')
                              ? 'bg-indigo-500'
                              : 'bg-purple-500'
                          }`}
                        >
                          <Text className="text-white font-medium mr-1">Details</Text>
                          <Icon name="chevron-forward-outline" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SampleDietPlan;

import { useNavigation } from '@react-navigation/native';
import { addDays, format, isValid, subDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import EventSource from 'react-native-event-source';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCaloriesContext } from '../context/CaloriesContext';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

// Lazy load the components
const NutritionCard = React.lazy(() => import('../components/NutritionCard'));
const CaloriesCard = React.lazy(() => import('../components/CaloriesCard'));
const MacrosCard = React.lazy(() => import('../components/MacrosCard'));

// Add new components for better organization
const TabButton = ({ label, isActive, onPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={isActive 
          ? isDarkMode ? ['#1f2937', '#111827'] : ['#f8fafc', '#ffffff']
          : ['transparent', 'transparent']
        }
        style={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 9999,
          ...(isActive && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
          })
        }}
      >
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: isActive 
            ? isDarkMode ? '#f3f4f6' : '#111827'
            : isDarkMode ? '#9ca3af' : '#6b7280'
        }}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const DateNavigator = ({ date, onPrev, onNext }) => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      }}
    >
      <TouchableOpacity 
        onPress={onPrev}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevron-left" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
      </TouchableOpacity>
      <Text style={{
        color: isDarkMode ? '#f3f4f6' : '#111827',
        fontWeight: '600',
        fontSize: 18,
      }}>
        {date}
      </Text>
      <TouchableOpacity 
        onPress={onNext}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevron-right" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const LoadingFallback = () => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator size="large" color="#10B981" />
    </LinearGradient>
  );
};

const Header = ({ onBack, title }) => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode ? ['#111827', '#1f2937'] : ['#ffffff', '#f8fafc']}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      }}
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={onBack}
            style={{
              padding: 8,
              backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
              borderRadius: 9999,
              marginRight: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
            }}
          >
            <Icon name="arrow-back" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: 14,
              fontWeight: '500',
            }}>
              Analysis
            </Text>
            <Text style={{
              color: isDarkMode ? '#f3f4f6' : '#111827',
              fontSize: 20,
              fontWeight: '700',
            }}>
              {title}
            </Text>
          </View>
          <LinearGradient
            colors={isDarkMode ? ['#064e3b', '#065f46'] : ['#E8F5E9', '#C8E6C9']}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
            }}
          >
            <Text style={{
              color: isDarkMode ? '#ecfdf5' : '#047857',
              fontWeight: '600',
            }}>
              Today
            </Text>
          </LinearGradient>
        </View>
      </View>
    </LinearGradient>
  );
};

const Nutrition = () => {
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const { goalCalories } = useCaloriesContext();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('Calories');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loggedFood, setLoggedFood] = useState([]);
  const [foodDetails, setFoodDetails] = useState([]);
  const [filteredFood, setFilteredFood] = useState([]);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFats, setTotalFats] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [mealCalories, setMealCalories] = useState({}); 
  const [error, setError] = useState(null);

  // Add new state for detailed nutrition
  const [nutritionDetails, setNutritionDetails] = useState({
    calcium: 0,
    calories: 0,
    carbs: 0,
    cholesterol: 0,
    fats: 0,
    fiber: 0,
    iron: 0,
    monounsaturated_fat: 0,
    polyunsaturated_fat: 0,
    potassium: 0,
    protein: 0,
    saturated_fat: 0,
    sodium: 0,
    sugar: 0,
    vitamin_a: 0,
    vitamin_c: 0
  });

  const userId = user?.$id || user?._id;

  const fetchLoggedFood = async () => {
    if (!userId) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }
  
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `${API_URL}/logged-food/get-logged-food/${userId}?date=${formattedDate}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch logged food');
      }
  
      const { success, data } = await response.json();
  
      if (!success) {
        throw new Error('Failed to fetch logged food data');
      }
  
      // Extract foods from the response
      let extractedFoods = [];
      if (Array.isArray(data)) {
        extractedFoods = data.flatMap((entry) =>
          entry.foods?.map(({ foodId, recipeId, mealType, addedAt }) => ({
            foodId,
            recipeId,
            mealType,
            addedAt,
          })) || []
        );
      }
  
      setLoggedFood(extractedFoods);
      console.log('Successfully fetched logged food:', extractedFoods);
  
    } catch (error) {
      console.error('Error fetching logged food:', error);
      setError(error.message || 'Failed to fetch logged food. Please try again later.');
      setLoggedFood([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch logged food on userId change
  useEffect(() => {
    fetchLoggedFood();
  }, [userId, selectedDate]);
  
  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (loggedFood.length === 0) return;
  
      setLoading(true);
      console.log('Fetching food details for:', loggedFood.length, 'items');
  
      try {
        const foodDetailsPromises = loggedFood.map(async (food) => {
          try {
            let details = null;
  
            if (food.foodId) {
              const response = await fetch(`${API_URL}/get-food-by-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foodId: food.foodId }),
              });
  
              const data = await response.json();
              console.log('Food API Response:', data.food?.food_name);
  
              if (data.food?.servings?.serving) {
                const servings = Array.isArray(data.food.servings.serving)
                  ? data.food.servings.serving
                  : [data.food.servings.serving];
                const firstServing = servings[0];

                // Extract all nutrition values with proper parsing
                details = {
                  title: data.food.food_name || 'No Title',
                  servingsize: firstServing.serving_description || 'N/A',
                  numberOfServings: firstServing.number_of_units || 'N/A',
                  calories: parseFloat(firstServing.calories) || 0,
                  carbs: parseFloat(firstServing.carbohydrate) || 0,
                  fats: parseFloat(firstServing.fat) || 0,
                  protein: parseFloat(firstServing.protein) || 0,
                  saturated_fat: parseFloat(firstServing.saturated_fat) || 0,
                  polyunsaturated_fat: parseFloat(firstServing.polyunsaturated_fat) || 0,
                  monounsaturated_fat: parseFloat(firstServing.monounsaturated_fat) || 0,
                  cholesterol: parseFloat(firstServing.cholesterol) || 0,
                  sodium: parseFloat(firstServing.sodium) || 0,
                  potassium: parseFloat(firstServing.potassium) || 0,
                  fiber: parseFloat(firstServing.fiber) || 0,
                  sugar: parseFloat(firstServing.sugar) || 0,
                  vitamin_a: parseFloat(firstServing.vitamin_a) || 0,
                  vitamin_c: parseFloat(firstServing.vitamin_c) || 0,
                  calcium: parseFloat(firstServing.calcium) || 0,
                  iron: parseFloat(firstServing.iron) || 0,
                  foodId: food.foodId
                };

                console.log('Processed nutrition values for:', data.food.food_name, {
                  calories: details.calories,
                  carbs: details.carbs,
                  protein: details.protein,
                  fats: details.fats
                });
              }
            } else if (food.recipeId) {
              const response = await fetch(`${API_URL}/api/recipes/${food.recipeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });
  
              const data = await response.json();
              console.log('Recipe API Response:', data);
  
              if (data) {
                // Get calories directly from calories_per_serving
                const calories = parseFloat(data.calories_per_serving) || 0;
                const servingsYield = data.recipe?.yield || 4;

                // Calculate macros per serving
                const perServingMultiplier = 1 / servingsYield;
                
                details = {
                  title: data.recipe_name || 'Untitled Recipe',
                  servingsize: `1 serving (${servingsYield} total)`,
                  numberOfServings: servingsYield,
                  calories: calories, // Use calories_per_serving directly
                  carbs: (parseFloat(data.recipe?.totalNutrients?.CHOCDF?.quantity || 0) * perServingMultiplier),
                  fats: (parseFloat(data.recipe?.totalNutrients?.FAT?.quantity || 0) * perServingMultiplier),
                  protein: (parseFloat(data.recipe?.totalNutrients?.PROCNT?.quantity || 0) * perServingMultiplier),
                  saturated_fat: (parseFloat(data.recipe?.totalNutrients?.FASAT?.quantity || 0) * perServingMultiplier),
                  polyunsaturated_fat: (parseFloat(data.recipe?.totalNutrients?.FAPU?.quantity || 0) * perServingMultiplier),
                  monounsaturated_fat: (parseFloat(data.recipe?.totalNutrients?.FAMS?.quantity || 0) * perServingMultiplier),
                  cholesterol: (parseFloat(data.recipe?.totalNutrients?.CHOLE?.quantity || 0) * perServingMultiplier),
                  sodium: (parseFloat(data.recipe?.totalNutrients?.NA?.quantity || 0) * perServingMultiplier),
                  potassium: (parseFloat(data.recipe?.totalNutrients?.K?.quantity || 0) * perServingMultiplier),
                  fiber: (parseFloat(data.recipe?.totalNutrients?.FIBTG?.quantity || 0) * perServingMultiplier),
                  sugar: (parseFloat(data.recipe?.totalNutrients?.SUGAR?.quantity || 0) * perServingMultiplier),
                  vitamin_a: (parseFloat(data.recipe?.totalNutrients?.VITA_RAE?.quantity || 0) * perServingMultiplier),
                  vitamin_c: (parseFloat(data.recipe?.totalNutrients?.VITC?.quantity || 0) * perServingMultiplier),
                  calcium: (parseFloat(data.recipe?.totalNutrients?.CA?.quantity || 0) * perServingMultiplier),
                  iron: (parseFloat(data.recipe?.totalNutrients?.FE?.quantity || 0) * perServingMultiplier),
                  recipeId: food.recipeId,
                  image: data.image || null,
                  cuisine: data.recipe?.cuisineType?.[0] || 'Unknown',
                  mealType: data.recipe?.mealType?.[0] || food.mealType,
                  healthLabels: data.recipe?.healthLabels || [],
                  preparationTime: data.totalTime || 0
                };

                // Round all nutrition values to 1 decimal place
                Object.keys(details).forEach(key => {
                  if (typeof details[key] === 'number') {
                    details[key] = parseFloat(details[key].toFixed(1));
                  }
                });

                console.log('Recipe nutrition calculation:', {
                  recipeName: data.recipe_name,
                  calories: details.calories,
                  protein: details.protein,
                  carbs: details.carbs,
                  fats: details.fats
                });
              }
            }
  
            return details
              ? {
                  ...details,
                  mealType: food.mealType,
                  addedAt: food.addedAt,
                  itemType: food.foodId ? 'food' : 'recipe',
                }
              : null;
          } catch (error) {
            console.error(`Error fetching details for ${food.foodId || food.recipeId}:`, error);
            return null;
          }
        });
  
        const details = (await Promise.all(foodDetailsPromises)).filter((detail) => detail !== null);
        console.log('Total processed items:', details.length);
        setFoodDetails(details);
      } catch (error) {
        console.error('Error fetching food/recipe details:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchFoodDetails();
  }, [loggedFood]);
  

  // Filter food items by selected date
  useEffect(() => {
    const filterFoodByDate = (date) => {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const filtered = foodDetails.filter((item) => {
        const itemDate = new Date(item.addedAt);
        if (!isValid(itemDate)) {
          console.warn(`Invalid date value for item: ${item.title}, addedAt: ${item.addedAt}`);
          return false;
        }
        const formattedItemDate = format(itemDate, 'yyyy-MM-dd');
        return formattedItemDate === formattedDate;
      });
      setFilteredFood(filtered);
    };

    filterFoodByDate(selectedDate);
  }, [foodDetails, selectedDate]);

  useEffect(() => { 
    const mealCalories = {};
    let totalProtein = 0, totalCarbs = 0, totalFat = 0;
  
    filteredFood.forEach((item) => {
      const { mealType, protein: p, carbs: c, fats: f, calories } = item;
  
      // Add up the macronutrients and calories with precision
      totalProtein += parseFloat(p) || 0;
      totalCarbs += parseFloat(c) || 0;
      totalFat += parseFloat(f) || 0;
  
      mealCalories[mealType] = (mealCalories[mealType] || 0) + (parseFloat(calories) || 0);
    });
  
    // Update state with values rounded to one decimal place
    setTotalProtein(parseFloat(totalProtein.toFixed(1)));
    setTotalCarbs(parseFloat(totalCarbs.toFixed(1)));
    setTotalFats(parseFloat(totalFat.toFixed(1)));
    setMealCalories(mealCalories);
  }, [filteredFood]);
  
  // Add new helper function to group and calculate items
  const mealTypePriority = {
    dinner: 1,
    lunch: 2,
    breakfast: 3,
    snacks: 4
  };

  // Update calculateGroupedFood to handle duplicates
  const calculateGroupedFood = useCallback((foods) => {
    // Initialize meal type totals
    const totalsByMealType = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fats: 0, items: 0, uniqueItems: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fats: 0, items: 0, uniqueItems: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fats: 0, items: 0, uniqueItems: 0 },
      snacks: { calories: 0, protein: 0, carbs: 0, fats: 0, items: 0, uniqueItems: 0 }
    };

    // Track unique items per meal type
    const uniqueItemsByMeal = {
      breakfast: new Set(),
      lunch: new Set(),
      dinner: new Set(),
      snacks: new Set()
    };

    // Process each food item
    foods.forEach(food => {
      const mealType = food.mealType;
      if (totalsByMealType[mealType]) {
        // Add calories and macros for each occurrence
        totalsByMealType[mealType].calories += parseInt(food.calories) || 0;
        totalsByMealType[mealType].protein += parseFloat(food.protein) || 0;
        totalsByMealType[mealType].carbs += parseFloat(food.carbs) || 0;
        totalsByMealType[mealType].fats += parseFloat(food.fats) || 0;
        
        // Increment total items count
        totalsByMealType[mealType].items += 1;
        
        // Track unique items
        const itemId = food.foodId || food.recipeId;
        uniqueItemsByMeal[mealType].add(itemId);
        totalsByMealType[mealType].uniqueItems = uniqueItemsByMeal[mealType].size;
      }
    });

    // Create grouped foods object that preserves duplicates
    const groupedByFood = foods.reduce((acc, food) => {
      const id = food.foodId || food.recipeId;
      const mealType = food.mealType;
      
      if (!acc[`${id}-${mealType}`]) {
        acc[`${id}-${mealType}`] = {
          ...food,
          count: 1,
          totalCalories: parseInt(food.calories) || 0,
          totalProtein: parseFloat(food.protein) || 0,
          totalCarbs: parseFloat(food.carbs) || 0,
          totalFats: parseFloat(food.fats) || 0,
        };
      } else {
        // Increment counts and totals for duplicate items
        acc[`${id}-${mealType}`].count += 1;
        acc[`${id}-${mealType}`].totalCalories += parseInt(food.calories) || 0;
        acc[`${id}-${mealType}`].totalProtein += parseFloat(food.protein) || 0;
        acc[`${id}-${mealType}`].totalCarbs += parseFloat(food.carbs) || 0;
        acc[`${id}-${mealType}`].totalFats += parseFloat(food.fats) || 0;
      }
      return acc;
    }, {});

    return { groupedByFood, totalsByMealType };
  }, []);

  // Update the calculateTotalCalories function
  const calculateTotalCalories = useCallback((mealType) => {
    const { totalsByMealType } = calculateGroupedFood(filteredFood);
    return totalsByMealType[mealType]?.calories || 0;
  }, [filteredFood]);

  // Update useEffect for calculating totals with logging
  useEffect(() => {
    const { totalsByMealType } = calculateGroupedFood(filteredFood);
    
    console.log('=== Starting Nutrition Calculation ===');
    console.log('Filtered Food Items:', filteredFood.length);
    
    // Calculate macros totals
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };

    Object.values(totalsByMealType).forEach(mealStats => {
      totals.calories += mealStats.calories;
      totals.protein += mealStats.protein;
      totals.carbs += mealStats.carbs;
      totals.fats += mealStats.fats;
    });

    // Calculate detailed nutrition totals
    const detailedTotals = {
      calcium: 0,
      calories: totals.calories,
      carbs: totals.carbs,
      cholesterol: 0,
      fats: totals.fats,
      fiber: 0,
      iron: 0,
      monounsaturated_fat: 0,
      polyunsaturated_fat: 0,
      potassium: 0,
      protein: totals.protein,
      saturated_fat: 0,
      sodium: 0,
      sugar: 0,
      vitamin_a: 0,
      vitamin_c: 0
    };

    console.log('Processing Food Items...');
    // Sum up nutrition values from all food items with logging
    filteredFood.forEach((food, index) => {
      console.log(`\nFood Item ${index + 1}:`, food.title);
      Object.keys(detailedTotals).forEach(key => {
        if (key !== 'calories' && key !== 'carbs' && key !== 'fats' && key !== 'protein') {
          const value = parseFloat(food[key]) || 0;
          detailedTotals[key] += value;
          if (value > 0) {
            console.log(`${key}: ${value}`);
          }
        }
      });
    });

    // Round all values and log results
    Object.keys(detailedTotals).forEach(key => {
      detailedTotals[key] = parseFloat(detailedTotals[key].toFixed(1));
    });

    console.log('\nFinal Nutrition Totals:', detailedTotals);
    console.log('=== End Nutrition Calculation ===\n');

    setNutritionDetails(detailedTotals);
    setTotalCalories(totals.calories);
    setTotalProtein(parseFloat(totals.protein.toFixed(1)));
    setTotalCarbs(parseFloat(totals.carbs.toFixed(1)));
    setTotalFats(parseFloat(totals.fats.toFixed(1)));

  }, [filteredFood, calculateGroupedFood]);

  // Handle date navigation
  const handleDateChange = (direction) => {
    if (direction === 'next') {
      setSelectedDate(addDays(selectedDate, 1)); // Next day
    } else if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1)); // Previous day
    }
  };

  const formattedDate = format(selectedDate, 'MMM dd, yyyy');

  // Prepare data for PieChart
  const pieData = useMemo(() => {
    const { totalsByMealType } = calculateGroupedFood(filteredFood);
    const mealTypes = {
      breakfast: { 
        color: totalsByMealType.breakfast?.calories > goalCalories ? 'rgba(239, 68, 68, 1)' : 'rgba(255, 99, 132, 1)', 
        icon: 'sunny-outline' 
      },
      lunch: { 
        color: totalsByMealType.lunch?.calories > goalCalories ? 'rgba(239, 68, 68, 1)' : 'rgba(54, 162, 235, 1)', 
        icon: 'restaurant-outline' 
      },
      dinner: { 
        color: totalsByMealType.dinner?.calories > goalCalories ? 'rgba(239, 68, 68, 1)' : 'rgba(255, 206, 86, 1)', 
        icon: 'moon-outline' 
      },
      snacks: { 
        color: totalsByMealType.snacks?.calories > goalCalories ? 'rgba(239, 68, 68, 1)' : 'rgba(75, 192, 192, 1)', 
        icon: 'cafe-outline' 
      }
    };

    const totalCal = Object.values(totalsByMealType).reduce((sum, meal) => sum + (meal?.calories || 0), 0);
    const isOverLimit = totalCal > goalCalories;

    return Object.entries(mealTypes).map(([type, config]) => ({
      name: type,
      population: totalsByMealType[type]?.calories || 0,
      color: isOverLimit ? config.color.replace('1)', '0.7)') : config.color,
      legendFontColor: '#000000',
      legendFontSize: 15,
      icon: config.icon,
      items: totalsByMealType[type]?.items || 0,
      uniqueItems: totalsByMealType[type]?.uniqueItems || 0,
      isOverLimit: (totalsByMealType[type]?.calories || 0) > goalCalories
    }));
  }, [filteredFood, calculateGroupedFood, goalCalories]);

  const macrosPieData = [
    { name: 'Protein', population: totalProtein, color: 'rgba(54, 162, 235, 1)', legendFontColor: '#000000', legendFontSize: 15 },
    { name: 'Carbs', population: totalCarbs, color: 'rgba(255, 206, 86, 1)', legendFontColor: '#000000', legendFontSize: 15 },
    { name: 'Fats', population: totalFats, color: 'rgba(75, 192, 192, 1)', legendFontColor: '#000000', legendFontSize: 15 },
  ];

  // Update the useEffect that processes filtered food to calculate detailed nutrition
  useEffect(() => {
    const calculateNutrition = () => {
      const totals = {
        calcium: 0,
        calories: 0,
        carbs: 0,
        cholesterol: 0,
        fats: 0,
        fiber: 0,
        iron: 0,
        monounsaturated_fat: 0,
        polyunsaturated_fat: 0,
        potassium: 0,
        protein: 0,
        saturated_fat: 0,
        sodium: 0,
        sugar: 0,
        vitamin_a: 0,
        vitamin_c: 0
      };

      filteredFood.forEach(food => {
        // Sum up all nutrition values
        Object.keys(totals).forEach(key => {
          const value = parseFloat(food[key]) || 0;
          totals[key] += value;
        });
      });

      // Update the nutrition details state
      setNutritionDetails(totals);
    };

    calculateNutrition();
  }, [filteredFood]);

  // Add SSE handling
  useEffect(() => {
    let eventSource;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${API_URL}/logged-food/events`);

        eventSource.onopen = () => {
          console.log('SSE Connection opened in Nutrition');
          retryCount = 0;
        };

        eventSource.addEventListener('connected', (event) => {
          console.log('SSE Connected in Nutrition with ID:', event.data);
        });

        eventSource.addEventListener('logged-food', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Logged food event received in Nutrition:', data);

            if (data.userId === userId) {
              // Refresh data based on event type
              switch (data.type) {
                case 'add':
                case 'delete':
                case 'update':
                  fetchLoggedFood(); // Refresh all data
                  break;
                // Add other cases if needed
                default:
                  console.log('Unknown event type in Nutrition:', data.type);
              }
            }
          } catch (error) {
            console.error('Error handling SSE event in Nutrition:', error);
          }
        });

        eventSource.onerror = (error) => {
          console.error('SSE Error in Nutrition:', error);
          eventSource.close();

          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying connection (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
            setTimeout(connectSSE, retryDelay);
          } else {
            console.error('Max retries reached, giving up SSE connection');
          }
        };
      } catch (error) {
        console.error('Error creating EventSource in Nutrition:', error);
      }
    };

    if (userId) {
      connectSSE();
    }

    return () => {
      if (eventSource) {
        try {
          console.log('Closing SSE connection in Nutrition');
          eventSource.close();
        } catch (err) {
          console.warn('Error closing EventSource:', err);
        }
      }
    };
  }, [userId]);

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
    }}>
      <Header 
        onBack={() => navigation.goBack()}
        title="Nutrition Tracking"
      />

      <DateNavigator 
        date={formattedDate}
        onPrev={() => handleDateChange('prev')}
        onNext={() => handleDateChange('next')}
      />

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <LinearGradient
          colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
          style={{
            padding: 8,
            borderRadius: 9999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {['Calories', 'Nutrition', 'Macros'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: activeTab === tab 
                    ? isDarkMode ? '#065f46' : '#ecfdf5'
                    : 'transparent'
                }}
              >
                <Text style={{
                  fontWeight: '500',
                  color: activeTab === tab 
                    ? isDarkMode ? '#ecfdf5' : '#047857'
                    : isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </View>

      <Suspense fallback={<LoadingFallback />}>
        {loading ? (
          <LoadingFallback />
        ) : error ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: 16 
          }}>
            <Text style={{
              color: isDarkMode ? '#f3f4f6' : '#111827',
              fontSize: 18,
              textAlign: 'center'
            }}>
              {error}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12 }}>
            {activeTab === 'Calories' && (
              <CaloriesCard
                pieData={pieData}
                calculateTotalCalories={calculateTotalCalories}
                totalCalories={totalCalories}
                userCalories={goalCalories}
                loading={loading}
                filteredFood={filteredFood} // Add this prop
                groupedFood={calculateGroupedFood(filteredFood)}
              />
            )}
            {activeTab === 'Nutrition' && (
              <NutritionCard
                loading={loading}
                nutrition={nutritionDetails}
              />
            )}
            {activeTab === 'Macros' && (
              <MacrosCard
                loading={loading}
                macrosPieData={macrosPieData}
                totalProtein={totalProtein}
                totalCarbs={totalCarbs}
                totalFats={totalFats}
              />
            )}
          </View>
        )}
      </Suspense>
    </SafeAreaView>
  );
};

export default Nutrition;

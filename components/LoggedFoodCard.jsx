import { addDays, format, isValid, subDays } from 'date-fns'; // Importing date-fns for date manipulation
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCaloriesContext } from '../context/CaloriesContext';
import { useGlobalContext } from '../context/GlobalProvider'; // Global context for getting user data
import { useTheme } from '../context/ThemeContext';
import { CommunitySSEClient } from '../utils/sseClient';
import ShimmerEffect from './ui/ShimmerEffect';

const API_URL = "https://trackeatfit.onrender.com"; // Add this line

const MealTypeSkeleton = memo(() => {
  const { isDarkMode } = useTheme();
  return (
    <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl mx-4 mt-4 shadow-sm overflow-hidden`}>
      {/* Header Skeleton */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <ShimmerEffect width={100} height={24} />
            <View className="ml-3">
              <ShimmerEffect width={60} height={20} borderRadius={20} />
            </View>
          </View>
          <ShimmerEffect width={24} height={24} borderRadius={12} />
        </View>
      </View>

      {/* Food Items Skeleton */}
      {[1, 2].map((item) => (
        <View key={item} className="p-4 border-b border-gray-50">
          <View className="flex-row items-center">
            <ShimmerEffect width={40} height={40} borderRadius={20} />
            <View className="flex-1 ml-3">
              <ShimmerEffect width={200} height={20} className="mb-2" />
              <ShimmerEffect width={120} height={16} />
            </View>
            <View className="items-end">
              <ShimmerEffect width={60} height={20} className="mb-1" />
              <ShimmerEffect width={40} height={16} />
            </View>
          </View>
        </View>
      ))}

      {/* Add Food Button Skeleton */}
      <View className="p-4 border-t border-gray-100">
        <View className="flex-row items-center">
          <ShimmerEffect width={32} height={32} borderRadius={16} />
          <ShimmerEffect width={80} height={20} className="ml-3" />
        </View>
      </View>
    </View>
  );
});

const DateNavigationSkeleton = memo(() => {
  const { isDarkMode } = useTheme();
  return (
    <View className={`flex-row justify-between items-center p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b border-gray-700/50`}>
      <ShimmerEffect width={40} height={40} borderRadius={20} />
      <ShimmerEffect width={120} height={24} />
      <ShimmerEffect width={40} height={40} borderRadius={20} />
    </View>
  );
});

const ActionButtonsSkeleton = memo(() => (
  <View className="flex-row justify-between px-4 mt-6 mb-8">
    <View className="flex-1 mr-2">
      <ShimmerEffect width="100%" height={80} borderRadius={12} />
    </View>
    <View className="flex-1 ml-2">
      <ShimmerEffect width="100%" height={80} borderRadius={12} />
    </View>
  </View>
));

const MealHeader = memo(({ title, calories, onMenuPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
      className="rounded-t-xl p-4 border-b border-gray-700/50"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-semibold text-lg capitalize`}>{title}</Text>
          <View className={`${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'} rounded-full px-3 py-1 ml-3`}>
            <Text className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} text-xs font-medium`}>{calories} Cal</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onMenuPress} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
});

// Create a memoized food item component
const FoodItem = memo(({ item, onPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity 
      onPress={() => onPress(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name="restaurant-outline" size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ 
            color: isDarkMode ? '#F3F4F6' : '#111827',
            fontWeight: '500'
          }}>{item.title}</Text>
          {item.count > 1 && (
            <View style={{
              backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#ECFDF5',
              borderRadius: 9999,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginLeft: 8,
            }}>
              <Text style={{
                color: isDarkMode ? '#34D399' : '#059669',
                fontSize: 12,
                fontWeight: '500'
              }}>×{item.count}</Text>
            </View>
          )}
        </View>
        <Text style={{
          color: isDarkMode ? '#E5E7EB' : '#6B7280',
          fontSize: 14,
          marginTop: 4
        }}>{item.servingsize}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          color: isDarkMode ? '#F3F4F6' : '#111827',
          fontWeight: '600'
        }}>{item.totalCalories} Cal</Text>
        <Text style={{
          color: isDarkMode ? '#E5E7EB' : '#6B7280',
          fontSize: 12,
          marginTop: 4,
          fontWeight: '500'
        }}>{item.protein}g protein</Text>
      </View>
    </TouchableOpacity>
  );
});

const EmptyMealState = memo(({ mealType }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      }}>
        <Ionicons name="restaurant-outline" size={24} color={isDarkMode ? '#FFFFFF' : '#6B7280'} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          color: isDarkMode ? '#E5E7EB' : '#6B7280',
          textAlign: 'center'
        }}>
          No meals recorded for {mealType}
        </Text>
      </View>
    </View>
  );
});

const MealTypeHeader = memo(({ mealType, calories, onMenuPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            color: isDarkMode ? '#F3F4F6' : '#111827',
            fontWeight: '600',
            fontSize: 16,
            textTransform: 'capitalize'
          }}>{mealType}</Text>
          <View style={{
            backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#ECFDF5',
            borderRadius: 9999,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginLeft: 12,
          }}>
            <Text style={{
              color: isDarkMode ? '#34D399' : '#059669',
              fontSize: 12,
              fontWeight: '500'
            }}>{calories} Cal</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={onMenuPress}
          style={{ padding: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const LoadingState = memo(() => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{ 
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#FFFFFF'
    }}>
      <View style={{ padding: 16 }}>
        <ShimmerEffect width={120} height={24} />
      </View>
      {[1, 2, 3, 4].map((index) => (
        <View key={index} style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          <View style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ShimmerEffect width={150} height={24} />
              <ShimmerEffect width={60} height={24} borderRadius={12} />
            </View>
          </View>

          {[1, 2].map((item) => (
            <View key={item} style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShimmerEffect width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ShimmerEffect width={200} height={20} style={{ marginBottom: 8 }} />
                  <ShimmerEffect width={120} height={16} />
                </View>
              </View>
            </View>
          ))}

          <View style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6'
          }}>
            <ShimmerEffect width={120} height={40} borderRadius={20} />
          </View>
        </View>
      ))}
    </View>
  );
});

const ModalOption = memo(({ icon, label, onPress, color = "#374151", borderBottom = true }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        paddingVertical: 12,
        borderBottomWidth: borderBottom ? 1 : 0,
        borderBottomColor: 'rgba(75, 85, 99, 0.5)',
      }}
    >
      <View style={{ 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDarkMode ? '#374151' : color.includes('#') ? '#F3F4F6' : `#${color}50`,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ionicons name={icon} size={18} color={isDarkMode ? '#D1D5DB' : color} />
          </View>
          <Text style={{
            color: isDarkMode ? '#F3F4F6' : '#111827',
            fontWeight: '500',
            marginLeft: 12
          }}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
      </View>
    </TouchableOpacity>
  );
});

// Update the groupSimilarFoodItems function to properly handle meal types
const groupSimilarFoodItems = (foods) => {
  // First, group by mealType, then by foodId or recipeId
  const groupedByMealType = foods.reduce((acc, food) => {
    const mealType = food.mealType;
    if (!acc[mealType]) {
      acc[mealType] = {};
    }
    
    // Generate a unique key based on foodId or recipeId
    const key = food.foodId ? `food-${food.foodId}` : `recipe-${food.recipeId}`;
    
    if (!acc[mealType][key]) {
      acc[mealType][key] = {
        ...food,
        count: 1,
        totalCalories: parseInt(food.calories) || 0,
        groupId: `${key}-${mealType}`,
      };
    } else {
      acc[mealType][key].count += 1;
      acc[mealType][key].totalCalories += parseInt(food.calories) || 0;
    }
    return acc;
  }, {});

  // Convert the nested structure to a flat array
  const result = Object.entries(groupedByMealType).flatMap(([mealType, foods]) => 
    Object.values(foods)
  );

  return result;
};

const WaterSection = memo(({ waterEntries, onDelete }) => {
  const { isDarkMode } = useTheme();
  if (!waterEntries?.length) return null;

  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      color: isDarkMode ? '#F3F4F6' : '#111827',
      fontWeight: '600',
      fontSize: 18,
    },
    badge: {
      backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : '#EBF5FF',
      borderRadius: 9999,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginLeft: 12,
    },
    badgeText: {
      color: isDarkMode ? '#93C5FD' : '#2563EB',
      fontSize: 12,
      fontWeight: '500',
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Water Intake</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {waterEntries.reduce((total, entry) => total + entry.amount, 0)} ml
              </Text>
            </View>
          </View>
        </View>
      </View>
      {waterEntries.map((entry) => (
        <View 
          key={entry._id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#374151' : '#EBF5FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="water-outline" size={20} color={isDarkMode ? '#93C5FD' : '#2563EB'} />
            </View>
            <Text style={{
              color: isDarkMode ? '#F3F4F6' : '#111827',
              fontWeight: '500',
            }}>{entry.amount} ml</Text>
          </View>
          <TouchableOpacity onPress={() => onDelete(entry._id)}>
            <Ionicons name="trash-outline" size={20} color={isDarkMode ? '#EF4444' : '#DC2626'} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
});

const NotesSection = memo(({ notes, onDelete }) => {
  const { isDarkMode } = useTheme();
  if (!notes?.length) return null;

  const styles = {
    container: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    headerText: {
      color: isDarkMode ? '#F3F4F6' : '#111827',
      fontWeight: '600',
      fontSize: 18,
    },
    noteItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    noteContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#374151' : '#F5F3FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 4,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Notes</Text>
      </View>
      {notes.map((note) => (
        <View key={note._id} style={styles.noteItem}>
          <View style={styles.noteContent}>
            <View style={{ flexDirection: 'row', flex: 1, marginRight: 16 }}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={isDarkMode ? '#C4B5FD' : '#7C3AED'} 
                />
              </View>
              <Text style={{
                flex: 1,
                color: isDarkMode ? '#F3F4F6' : '#111827',
              }}>{note.content}</Text>
            </View>
            <TouchableOpacity onPress={() => onDelete(note._id)}>
              <Ionicons name="trash-outline" size={20} color={isDarkMode ? '#EF4444' : '#DC2626'} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
});

const LoggedFoodCard = ({ setTotalCalories, userCalories, totalCalories }) => {
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const [loggedFood, setLoggedFood] = useState([]);
  const { carbs, fats, protein, setCarbs, setfats, setprotein, setRemainingCalories } = useCaloriesContext(); // Access the context setters
  const [foodDetails, setFoodDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Selected date for filtering
  const [filteredFood, setFilteredFood] = useState([]); // Filtered food list
  const [isNewFoodLogged, setIsNewFoodLogged] = useState(false); // State to track if new food is logged
  const [modalVisible, setModalVisible] = useState(false); // Add this line if not present
  const { isDarkMode } = useTheme();
  const [water, setWater] = useState([]);
  const [notes, setNotes] = useState([]);
  const sseClientRef = useRef(null);

  const userId = user?.$id || user?._id;

  const handleAddFood = (mealType) => {
    // Navigate to the Search screen, passing the selected meal type
    navigation.navigate('Search', { mealType, onFoodLogged: () => setIsNewFoodLogged(true) });
  };

  // Handle each of the icon clicks for redirection
  const handleNutrition = () => {
    navigation.navigate('Nutrition'); // Navigate to different screens based on icon clicked
  };

  const handlePress = () => {
    navigation.navigate('Meals_complete', {
      totalCalories: totalCalories,  // Pass the calculated value
      userCalories: userCalories   // Optionally, pass userCalories if needed
    });
  };

  const toggleModal = useCallback(() => {
    setModalVisible(prev => !prev);
  }, []);

  const handleFoodDetails = useCallback((item) => {
    console.log('Navigating with item:', item);
    if (item && item.itemType === 'recipe') {
      navigation.navigate('RecipeDetails', { 
        recipeId: item.$id || item.recipeId, // Try both possible recipeId locations
        mealType: item.mealType 
      });
    } else if (item && item.itemType === 'food') {
      navigation.navigate('FoodDetails', { foodId: item.foodId, mealType: item.mealType });
    } else {
      console.log('Unrecognized itemType:', item.itemType);
    }
  }, [navigation]);

  const handleFoodPress = useCallback((item) => {
    handleFoodDetails(item);
  }, [handleFoodDetails]);

  const fetchLoggedFoodForDate = useCallback(async (date) => {
    if (!userId) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Format date to match backend expectation (YYYY-MM-DD)
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Fetching food for date:', formattedDate);

      const response = await fetch(
        `${API_URL}/logged-food/get-logged-food/${userId}?date=${formattedDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch logged food');
      }

      const { success, data } = await response.json();
      
      if (!success) {
        throw new Error('Failed to fetch food data');
      }

      console.log('Response data:', data);

      // Process the food data
      const extractedData = data.map(entry => ({
        foods: entry.foods || [],
        water: entry.water || [],
        notes: entry.notes || [],
        date: entry.date
      }));

      const todayData = extractedData.find(entry => entry.date === formattedDate) || {
        foods: [],
        water: [],
        notes: []
      };

      setLoggedFood(todayData.foods);
      setWater(todayData.water);
      setNotes(todayData.notes);
      console.log('Extracted foods:', todayData.foods);

    } catch (err) {
      console.error('Error fetching logged food:', err);
      setError('Failed to fetch logged food. Please try again later.');
      setLoggedFood([]);
      setWater([]);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch logged food on userId change or when new food is logged
  useEffect(() => {
    if (userId) {
      fetchLoggedFoodForDate(selectedDate);
    }
  }, [userId, selectedDate]);

  useEffect(() => {
    if (isNewFoodLogged) {
      fetchLoggedFoodForDate(selectedDate);
      setIsNewFoodLogged(false); // Reset the flag after fetching
    }
  }, [isNewFoodLogged, selectedDate]);

  // Ensure food details are fetched when loggedFood changes
  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (loggedFood.length === 0) return;
      setLoading(true);

      try {
        const processedFoods = await Promise.all(
          loggedFood.map(async (food) => {
            try {
              if (food.foodId) {
                // Handle regular food items
                const response = await fetch(`${API_URL}/get-food-by-id`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ foodId: food.foodId }),
                });

                const data = await response.json();
                if (data.food?.servings?.serving) {
                  const servings = Array.isArray(data.food.servings.serving)
                    ? data.food.servings.serving
                    : [data.food.servings.serving];
                  const firstServing = servings[0];

                  return {
                    ...food,
                    title: data.food.food_name || 'No Title',
                    servingsize: firstServing.serving_description || 'N/A',
                    calories: firstServing.calories || '0',
                    protein: firstServing.protein || '0',
                    carbs: firstServing.carbohydrate || '0',
                    fats: firstServing.fat || '0',
                    itemType: 'food'
                  };
                }
              } else if (food.recipeId) {
                // Only fetch recipe name from API, keep other data from food object
                const response = await fetch(`${API_URL}/api/recipes/recipe/${food.recipeId}`);
                const data = await response.json();

                return {
                  ...food,
                  title: data.recipe_name || 'Untitled Recipe',
                  servingsize: `${food.servingSize || 1} serving`,
                  calories: food.nutrition?.calories || data.calories || '0',
                  protein: food.nutrition?.protein || '0',
                  carbs: food.nutrition?.carbs || '0',
                  fats: food.nutrition?.fats || '0',
                  totalCalories: food.nutrition?.calories || data.calories || '0',
                  itemType: 'recipe'
                };
              }
              
              // Return fallback data if neither foodId nor recipeId exists
              return {
                ...food,
                title: 'Unknown Item',
                servingsize: food.servingSize || '1 serving',
                calories: food.nutrition?.calories || '0',
                protein: food.nutrition?.protein || '0',
                carbs: food.nutrition?.carbs || '0',
                fats: food.nutrition?.fats || '0',
                itemType: food.recipeId ? 'recipe' : 'food'
              };
            } catch (error) {
              console.warn(`Error fetching details:`, error);
              return {
                ...food,
                title: food.recipeId ? 'Recipe' : 'Food Item',
                servingsize: food.servingSize || '1 serving',
                calories: food.nutrition?.calories || '0',
                protein: food.nutrition?.protein || '0',
                carbs: food.nutrition?.carbs || '0',
                fats: food.nutrition?.fats || '0',
                itemType: food.recipeId ? 'recipe' : 'food'
              };
            }
          })
        );

        setFoodDetails(processedFoods);
      } catch (error) {
        console.error('Error in fetchFoodDetails:', error);
        setFoodDetails(loggedFood.map(food => ({
          ...food,
          title: food.recipeId ? 'Recipe' : 'Food Item',
          servingsize: food.servingSize || '1 serving',
          calories: food.nutrition?.calories || '0',
          protein: food.nutrition?.protein || '0',
          carbs: food.nutrition?.carbs || '0',
          fats: food.nutrition?.fats || '0',
          itemType: food.recipeId ? 'recipe' : 'food'
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [loggedFood]);

  // Filter food items by selected date
  useEffect(() => {
    filterFoodByDate(selectedDate); // Filter food based on the selected date
  }, [foodDetails, selectedDate]);

  // Filter food items by selected date
  const filterFoodByDate = (date) => {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd'); // Format the selected date as yyyy-MM-dd
    const filtered = foodDetails.filter((item) => {
      const itemDate = new Date(item.addedAt); // Get date from addedAt

      // Check if the addedAt field is a valid date before proceeding
      if (!isValid(itemDate)) {
        console.warn(`Invalid date value for item: ${item.title}, addedAt: ${item.addedAt}`);
        return false; // Skip invalid dates
      }

      const formattedItemDate = format(itemDate, 'yyyy-MM-dd'); // Format item.addedAt
      return formattedItemDate === formattedDate; // Compare the formatted dates
    });
    setFilteredFood(filtered);
  };

  // Calculate total calories for a specific meal type
  const calculateTotalCalories = (mealType) => {
    return filteredFood.filter((item) => item.mealType === mealType)
      .reduce((total, item) => total + parseInt(item.calories), 0);
  };

  // Calculate total carbs, proteins, and fats for a specific meal type
  const calculateTotalNutrients = (mealType) => {
    const totalNutrients = filteredFood.filter((item) => item.mealType === mealType)
      .reduce((totals, item) => {
        totals.carbs += parseFloat(item.carbs) || 0;  // Sum carbs
        totals.protein += parseFloat(item.protein) || 0;  // Sum protein
        totals.fats += parseFloat(item.fats) || 0;  // Sum fats
        return totals;
      }, { carbs: 0, protein: 0, fats: 0 });
  
    return totalNutrients;
  };

  // Use useEffect to calculate and set the total nutrients across all meals
  useEffect(() => {
    const allMealsNutrients = ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((totals, mealType) => {
      const mealTotals = calculateTotalNutrients(mealType);
      totals.carbs += mealTotals.carbs;
      totals.protein += mealTotals.protein;
      totals.fats += mealTotals.fats;
      return totals;
    }, { carbs: 0, protein: 0, fats: 0 });

    setRemainingCalories(allMealsNutrients);  // Set the remaining calories (if needed, update this to update nutrients)
    setCarbs(allMealsNutrients.carbs); // Update carbs in the context
    setfats(allMealsNutrients.fats); // Update fats in the context
    setprotein(allMealsNutrients.protein); // Update protein in the context
  }, [filteredFood, setCarbs, setfats, setprotein, setRemainingCalories]);

  // Use useEffect to calculate and set the total calories across all meals
  useEffect(() => {
    const allMealsCalories = ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((total, mealType) => {
      return total + calculateTotalCalories(mealType);
    }, 0);
    setTotalCalories(allMealsCalories); // Set total calories for the parent
  }, [filteredFood, setTotalCalories]); // Recalculate when filteredFood change
  

  // When component mounts, automatically filter by today's date
  useEffect(() => {
    filterFoodByDate(selectedDate); // Filter food based on the selected date
  }, [foodDetails, selectedDate]);

  // Handle date change when user clicks on < or >
  const handleDateChange = useCallback((direction) => {
    setSelectedDate(prevDate => {
      const newDate = direction === 'next' 
        ? addDays(prevDate, 1) 
        : subDays(prevDate, 1);
      fetchLoggedFoodForDate(newDate);
      return newDate;
    });
  }, [fetchLoggedFoodForDate]);
  

  // Format today's date for display
  const formattedDate = format(selectedDate, 'MMM dd, yyyy');

  // --- SSE/WebSocket integration ---
  useEffect(() => {
    if (!userId) return;

    // Clean up previous instance if any
    if (sseClientRef.current) {
      sseClientRef.current.close();
      sseClientRef.current = null;
    }

    // Handler for logged-food events
    const handleLoggedFood = (msg) => {
      const data = msg.data || msg;
      if (data.userId !== userId) return;

      switch (data.type) {
        case 'delete':
          setFilteredFood(prevFood =>
            prevFood.filter(item => {
              if (data.foodId) {
                return item.foodId !== data.foodId || item.mealType !== data.mealType;
              }
              if (data.recipeId) {
                return item.recipeId !== data.recipeId || item.mealType !== data.mealType;
              }
              return true;
            })
          );
          setLoggedFood(prevFood =>
            prevFood.filter(item => {
              if (data.foodId) {
                return item.foodId !== data.foodId || item.mealType !== data.mealType;
              }
              if (data.recipeId) {
                return item.recipeId !== data.recipeId || item.mealType !== data.mealType;
              }
              return true;
            })
          );
          break;
        case 'water-added':
          setWater(prevWater => [
            ...prevWater,
            {
              _id: Date.now().toString(),
              amount: data.amount,
              addedAt: new Date().toISOString()
            }
          ]);
          break;
        case 'note-added':
          setNotes(prevNotes => [
            ...prevNotes,
            {
              _id: Date.now().toString(),
              content: data.content,
              addedAt: new Date().toISOString()
            }
          ]);
          break;
        case 'water-deleted':
          if (data.waterId) {
            setWater(prevWater => prevWater.filter(w => w._id !== data.waterId));
          }
          break;
        case 'note-deleted':
          if (data.noteId) {
            setNotes(prevNotes => prevNotes.filter(n => n._id !== data.noteId));
          }
          break;
        case 'add':
        case 'update':
          fetchLoggedFoodForDate(selectedDate);
          break;
        default:
          console.log('Unknown event type:', data.type);
      }
    };

    // Create or get singleton CommunitySSEClient
    sseClientRef.current = CommunitySSEClient.getInstance({
      url: '', // Not used, ws url is hardcoded in client
      userId,
      clientType: 'logged-food',
      debugLabel: 'LoggedFoodCard',
    });
    // Attach handler
    sseClientRef.current._onLoggedFood = handleLoggedFood;
    sseClientRef.current.connect();

    return () => {
      if (sseClientRef.current) {
        sseClientRef.current.close();
        sseClientRef.current = null;
      }
    };
  }, [userId, selectedDate, fetchLoggedFoodForDate]);

  const modalOptions = [
    {
      id: 'quickAdd',
      label: 'Quick Add',
      icon: 'flash-outline',
      color: '#D97706', // amber-600
      action: () => {
        toggleModal();
        navigation.navigate('QuickAdd');
      }
    },
    {
      id: 'addReminder',
      label: 'Set Reminder',
      icon: 'alarm-outline',
      color: '#7C3AED', // violet-600
      action: () => {
        toggleModal();
        navigation.navigate('MealReminder');
      }
    },
     
  ];

  const handleDeleteWater = async (waterId) => {
    // Optimistic update
    setWater(prevWater => prevWater.filter(w => w._id !== waterId));

    try {
      const response = await fetch(
        `${API_URL}/logged-food/delete-water/${userId}/${waterId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        // Revert on error
        fetchLoggedFoodForDate(selectedDate);
      }
    } catch (error) {
      console.error('Error deleting water entry:', error);
      // Revert on error
      fetchLoggedFoodForDate(selectedDate);
    }
  };

  const handleDeleteNote = async (noteId) => {
    // Optimistic update
    setNotes(prevNotes => prevNotes.filter(n => n._id !== noteId));

    try {
      const response = await fetch(
        `${API_URL}/logged-food/delete-note/${userId}/${noteId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        // Revert on error
        fetchLoggedFoodForDate(selectedDate);
      }
    } catch (error) {
      console.error('Error deleting note entry:', error);
      // Revert on error
      fetchLoggedFoodForDate(selectedDate);
    }
  };

  if (loading) {
    return <LoadingState />;
  }
  if (error) return <Text className="text-red-600 text-center">{error}</Text>;

  const commonStyles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
    sectionContainer: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    dateNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    mealTypeHeader: {
      padding: 16,
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    foodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    waterSection: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    notesSection: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB',
    },
    actionButton: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
  };

  return (
    <>
      <ScrollView 
        style={commonStyles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Date Navigation */}
        <View style={commonStyles.dateNavigation}>
          <TouchableOpacity 
            onPress={() => handleDateChange('prev')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-semibold text-lg`}>{formattedDate}</Text>
          <TouchableOpacity 
            onPress={() => handleDateChange('next')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-forward" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Meal Sections */}
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
          const mealsForType = filteredFood.filter(item => item.mealType === mealType);
          const groupedMeals = groupSimilarFoodItems(mealsForType);
          const totalCalories = calculateTotalCalories(mealType);

          return (
            <View key={mealType} style={commonStyles.sectionContainer}>
              <MealTypeHeader 
                mealType={mealType}
                calories={totalCalories}
                onMenuPress={toggleModal}
              />
              
              {groupedMeals.length > 0 ? (
                groupedMeals.map(item => (
                  <FoodItem 
                    key={item.groupId}
                    item={{
                      ...item,
                      totalCalories: item.totalCalories || (parseInt(item.calories) * item.count)
                    }}
                    onPress={handleFoodPress}
                  />
                ))
              ) : (
                <EmptyMealState mealType={mealType} />
              )}

              <TouchableOpacity 
                onPress={() => handleAddFood(mealType)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#E5E7EB'
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="add" size={20} color="#059669" />
                </View>
                <Text style={{
                  color: '#059669',
                  fontWeight: '500',
                  marginLeft: 12
                }}>
                  Add Food
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Water Section */}
        <WaterSection waterEntries={water} onDelete={handleDeleteWater} />

        {/* Notes Section */}
        <NotesSection notes={notes} onDelete={handleDeleteNote} />

        {/* Action Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginTop: 24,
          marginBottom: 0
        }}>
          <TouchableOpacity 
            onPress={handleNutrition}
            style={{
              flex: 1,
              marginRight: 8,
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              alignItems: 'center'
            }}
          >
            <Ionicons name="pie-chart-outline" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
            <Text style={{
              color: isDarkMode ? '#F9FAFB' : '#111827',
              fontWeight: '500',
              marginTop: 8
            }}>
              Nutrition
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handlePress}
            style={{
              flex: 1,
              marginLeft: 8,
              backgroundColor: '#10B981',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              alignItems: 'center'
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="white" />
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '500',
              marginTop: 8
            }}>
              Complete Meal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Modal component here */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={commonStyles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={commonStyles.modalContent}>
                <View className="w-20 h-1 bg-gray-300 rounded-full mb-4 self-center" />

                {/* Modal Options */}
                <View style={{ gap: 8 }}>
                  {modalOptions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={item.action}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                        borderRadius: 12,
                      }}
                    >
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isDarkMode ? '#4B5563' : '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Ionicons name={item.icon} size={22} color={item.color} />
                      </View>
                      <Text style={{
                        color: isDarkMode ? '#F9FAFB' : '#111827',
                        fontWeight: '500',
                        marginLeft: 12,
                        flex: 1
                      }}>
                        {item.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default memo(LoggedFoodCard);


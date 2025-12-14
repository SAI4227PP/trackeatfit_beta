import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const Header = ({ selectedCount, onClose, onDelete }) => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode 
        ? ['rgba(17,24,39,0.95)', 'rgba(31,41,55,0.98)']
        : ['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.98)']}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#1F2937' : '#F3F4F6',
      }}
    >
      <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={onClose} 
            style={{
              padding: 8,
              backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
              borderRadius: 999,
            }}
          >
            <Ionicons name="close" size={26} color={isDarkMode ? '#D1D5DB' : '#374151'} />
          </TouchableOpacity>
          {selectedCount > 0 && (
            <View style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 999,
            }}>
              <Text style={{
                color: isDarkMode ? '#F3F4F6' : '#111827',
                fontWeight: '500',
              }}>
                {selectedCount} selected
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onDelete}
            disabled={selectedCount === 0}
            style={{
              padding: 8,
              opacity: selectedCount === 0 ? 0.5 : 1,
              backgroundColor: selectedCount > 0 ? '#FEE2E2' : (isDarkMode ? '#1F2937' : '#F9FAFB'),
              borderRadius: 999,
            }}
          >
            <Ionicons
              name="trash"
              size={26}
              color={selectedCount > 0 ? '#EF4444' : isDarkMode ? '#D1D5DB' : '#374151'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const MealTypeHeader = ({ title, isSelected, onToggle, itemCount }) => {
  const { isDarkMode } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient
        colors={isSelected 
          ? isDarkMode ? ['#065F46', '#047857'] : ['#E8F5E9', '#C8E6C9']
          : isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: isDarkMode ? '#F3F4F6' : '#1F2937',
            }}>{title}</Text>
            <View style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginLeft: 8,
            }}>
              <Text style={{
                color: isDarkMode ? '#D1D5DB' : '#6B7280',
                fontSize: 12,
              }}>{itemCount} items</Text>
            </View>
          </View>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onToggle}
            color={isDarkMode ? '#34D399' : '#10B981'}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const generateUniqueId = (meal) => {
  return meal.foodId || meal.recipeId;
};

const groupSimilarItems = (items) => {
  const grouped = {};
  items.forEach(item => {
    const key = item.foodId || item.recipeId;
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        count: 1,
        items: [item]
      };
    } else {
      grouped[key].count++;
      grouped[key].items.push(item);
    }
  });
  return Object.values(grouped);
};

const MealItem = memo(({ meal, isSelected, onToggle }) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [selectedCount, setSelectedCount] = useState(isSelected ? meal.count : 0);

  const handleIncrement = () => {
    if (selectedCount < (meal.count || 1)) {
      setSelectedCount(prev => prev + 1);
      onToggle('increment');
    }
  };

  const handleDecrement = () => {
    if (selectedCount > 0) {
      setSelectedCount(prev => prev - 1);
      onToggle('decrement');
    }
  };

  useEffect(() => {
    if (!isSelected) {
      setSelectedCount(0);
    }
  }, [isSelected]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 12,
          marginBottom: 8,
          // shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left section: Icon and Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="restaurant-outline" size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </View>
              <View style={{ marginLeft: 12, flex: 1, marginRight: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={{
                    color: isDarkMode ? '#F3F4F6' : '#111827',
                    fontWeight: '500',
                    fontSize: 16,
                  }}>
                    {meal.title}
                  </Text>
                  {meal.count > 1 && (
                    <View style={{
                      backgroundColor: isDarkMode ? 'rgba(6,95,70,0.3)' : '#D1FAE5',
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      marginLeft: 8,
                    }}>
                      <Text style={{
                        color: isDarkMode ? '#34D399' : '#059669',
                        fontSize: 12,
                        fontWeight: '500',
                      }}>
                        ×{meal.count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{
                  color: isDarkMode ? '#9CA3AF' : '#6B7280',
                  fontSize: 14,
                  marginTop: 2,
                }}>
                  {meal.servingsize}
                </Text>
              </View>
            </View>

            {/* Right section: Calories and Protein */}
            <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
              <Text style={{
                color: isDarkMode ? '#F3F4F6' : '#111827',
                fontWeight: '600',
              }}>
                {meal.calories} Cal
              </Text>
              <Text style={{
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                fontSize: 12,
                marginTop: 2,
              }}>
                {meal.protein}g protein
              </Text>
            </View>
          </View>

          {/* Counter section */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? 'rgba(55,65,81,0.1)' : 'rgba(55,65,81,0.1)',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 4,
            }}>
              <TouchableOpacity 
                onPress={handleDecrement}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // shadow
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Ionicons name="remove" size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </TouchableOpacity>
              <Text style={{
                color: isDarkMode ? '#F3F4F6' : '#111827',
                marginHorizontal: 16,
                fontWeight: '500',
                minWidth: 24,
                textAlign: 'center',
              }}>
                {selectedCount}
              </Text>
              <TouchableOpacity 
                onPress={handleIncrement}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // shadow
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Ionicons name="add" size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </TouchableOpacity>
            </View>
            {meal.count > 1 && (
              <Text style={{
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                fontSize: 14,
                fontWeight: '500',
              }}>
                Max: {meal.count}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const EditMealCard = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const [loggedFood, setLoggedFood] = useState([]);
  const [foodDetails, setFoodDetails] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  const [selectAll, setSelectAll] = useState(false);
  const [selectMealType, setSelectMealType] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
  });

  const userId = user?.$id || user?._id;

  const fetchLoggedFood = async () => {
    if (!userId) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd'); // Get today's date in YYYY-MM-DD format
      const response = await fetch(`${API_URL}/logged-food/get-logged-food/${userId}?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logged food');
      }

      const { success, data } = await response.json();
      if (!success) {
        throw new Error('Failed to fetch food data');
      }

      const extractedFoods = data.flatMap(entry =>
        entry.foods?.map(({ foodId, recipeId, mealType, addedAt }) => ({
          foodId,
          recipeId,
          mealType,
          addedAt,
        })) || []
      );

      setLoggedFood(extractedFoods);
    } catch (err) {
      console.error('Error fetching logged food:', err);
      setError('Failed to fetch logged food. Please try again later.');
      setLoggedFood([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoggedFood();
  }, [userId]);

  const fetchFoodDetails = async () => {
    if (loggedFood.length === 0) return;

    setLoading(true);

    try {
      const foodDetailsPromises = loggedFood.map(async (food) => {
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
            // Handle recipe items
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
        } catch (error) {
          console.warn(`Error fetching details:`, error);
        }
        
        // Return fallback data if fetching fails
        return {
          ...food,
          title: food.recipeId ? 'Recipe' : 'Food Item',
          servingsize: food.servingSize || '1 serving',
          calories: '0',
          protein: '0',
          carbs: '0',
          fats: '0',
          itemType: food.recipeId ? 'recipe' : 'food'
        };
      });

      const details = (await Promise.all(foodDetailsPromises)).filter(Boolean);
      
      const categorizedMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      };

      details.forEach((meal) => {
        if (meal.mealType && categorizedMeals.hasOwnProperty(meal.mealType)) {
          categorizedMeals[meal.mealType] = groupSimilarItems(
            [...categorizedMeals[meal.mealType], meal]
          );
        }
      });

      setFoodDetails(categorizedMeals);
    } catch (error) {
      console.error('Error in fetchFoodDetails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodDetails();
  }, [loggedFood]);

  const toggleMealSelection = (meal, mealType, action) => {
    setSelectedMeals(prevSelected => {
      const newSelected = { ...prevSelected };
      const mealIdentifier = meal.foodId || meal.recipeId;
      
      if (action === 'increment') {
        // Add one instance of the meal
        newSelected[mealType] = [...newSelected[mealType], meal];
      } else if (action === 'decrement') {
        // Remove one instance of the meal
        const index = newSelected[mealType].findIndex(m => 
          generateUniqueId(m) === generateUniqueId(meal)
        );
        if (index !== -1) {
          newSelected[mealType].splice(index, 1);
        }
      }

      return newSelected;
    });
  };

  const toggleMealTypeSelection = (mealType) => {
    const isCurrentlySelected = selectMealType[mealType];

    // Update meal type selection
    setSelectMealType(prev => ({
      ...prev,
      [mealType]: !isCurrentlySelected
    }));

    // Update selected meals for this meal type
    setSelectedMeals(prev => ({
      ...prev,
      [mealType]: isCurrentlySelected ? [] : [...foodDetails[mealType]]
    }));

    // Check if all meal types are selected after this toggle
    setTimeout(() => {
      const allSelected = ['breakfast', 'lunch', 'dinner', 'snacks'].every(type => 
        type === mealType ? !isCurrentlySelected : selectMealType[type]
      );
      setSelectAll(allSelected);
    }, 0);
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    // Update selected meals based on selectAll state
    if (newSelectAll) {
      // Select everything
      setSelectedMeals({
        breakfast: [...foodDetails.breakfast],
        lunch: [...foodDetails.lunch],
        dinner: [...foodDetails.dinner],
        snacks: [...foodDetails.snacks],
      });
      setSelectMealType({
        breakfast: true,
        lunch: true,
        dinner: true,
        snacks: true,
      });
    } else {
      // Deselect everything
      setSelectedMeals({
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      });
      setSelectMealType({
        breakfast: false,
        lunch: false,
        dinner: false,
        snacks: false,
      });
    }
  };

  const handleDeleteSelectedMeals = async () => {
    try {
      const mealsToDelete = Object.entries(selectedMeals)
        .flatMap(([mealType, meals]) => 
          meals.map(meal => ({
            foodId: meal.foodId || null,
            recipeId: meal.recipeId || null,
            mealType,
          }))
        )
        .filter((meal, index, self) => 
          index === self.findIndex(m => 
            (m.foodId && m.foodId === meal.foodId) || 
            (m.recipeId && m.recipeId === meal.recipeId)
          )
        );
  
      if (mealsToDelete.length === 0) return;
  
      await Promise.all(
        mealsToDelete.map((meal) =>
          fetch(`${API_URL}/logged-food/delete-logged-food/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              foodId: meal.foodId,
              recipeId: meal.recipeId,
              mealType: meal.mealType
            }),
          })
        )
      );
  
      Alert.alert('Success', 'Meals deleted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Update state to reflect deletions by category
            setFoodDetails(prevDetails => {
              const newDetails = { ...prevDetails };
              mealsToDelete.forEach(deletedMeal => {
                newDetails[deletedMeal.mealType] = newDetails[deletedMeal.mealType]
                  .filter(meal => meal.foodId !== deletedMeal.foodId);
              });
              return newDetails;
            });
  
            // Reset selection states
            setSelectedMeals({
              breakfast: [],
              lunch: [],
              dinner: [],
              snacks: [],
            });
            setSelectAll(false);
            setSelectMealType({
              breakfast: false,
              lunch: false,
              dinner: false,
              snacks: false,
            });
  
            // Refresh data
            fetchLoggedFood();
          },
        },
      ]);
    } catch (error) {
      console.error('Error deleting selected meals:', error);
      Alert.alert('Error', 'Failed to delete selected meals. Please try again.');
    }
  };

  const generateUniqueKey = (meal, mealType) => {
    return `${meal.foodId || meal.recipeId}-${mealType}-${meal.addedAt}`;
  };

  const selectedCount = Object.values(selectedMeals).flat().length;

  if (loading) {
    return (
      <SafeAreaView style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#111827' : '#fff',
      }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#34D399' : '#10B981'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    }}>
      <Header 
        selectedCount={selectedCount}
        onClose={() => navigation.goBack()}
        onDelete={handleDeleteSelectedMeals}
      />

      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
          style={{
            marginBottom: 24,
            borderRadius: 16,
            // shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <TouchableOpacity 
            onPress={toggleSelectAll}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name={selectAll ? "checkbox" : "square-outline"} 
                size={24} 
                color={isDarkMode ? '#34D399' : '#10B981'} 
              />
              <Text style={{
                color: isDarkMode ? '#F3F4F6' : '#111827',
                fontWeight: '600',
                fontSize: 18,
                marginLeft: 8,
              }}>
                Select All
              </Text>
            </View>
            <Text style={{
              color: isDarkMode ? '#D1D5DB' : '#6B7280',
              fontSize: 14,
            }}>
              {selectedCount} / {Object.values(foodDetails).flat().length}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => (
          <View key={`section-${mealType}`} style={{ marginBottom: 24 }}>
            <MealTypeHeader
              title={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              isSelected={selectMealType[mealType]}
              onToggle={() => toggleMealTypeSelection(mealType)}
              itemCount={foodDetails[mealType].length}
            />

            {foodDetails[mealType].length === 0 ? (
              <LinearGradient
                colors={isDarkMode ? ['#1F2937', '#111827'] : ['#F9FAFB', '#F3F4F6']}
                style={{
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Text style={{
                  color: isDarkMode ? '#D1D5DB' : '#6B7280',
                  textAlign: 'center',
                }}>
                  No meals logged for {mealType}
                </Text>
              </LinearGradient>
            ) : (
              foodDetails[mealType].map((meal) => (
                <MealItem
                  key={generateUniqueKey(meal, mealType)}
                  meal={meal}
                  isSelected={selectedMeals[mealType].some(m => 
                    generateUniqueId(m) === generateUniqueId(meal)
                  )}
                  onToggle={(action) => toggleMealSelection(meal, mealType, action)}
                />
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditMealCard;

import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import animationData from '../assets/lottie/Animation - comfirmation.json'; // Use the .lottie file
import CustomAlert from '../components/CustomAlert';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const screenWidth = Dimensions.get('window').width;

const FoodDetails = () => {
  const route = useRoute();
  const { foodId, mealType } = route.params || {};
  const navigation = useNavigation();

  const [foodDetails, setFoodDetails] = useState(null);
  const { user } = useGlobalContext(); // Getting user context for user ID
  const [mealTypeState, setMealTypeState] = useState(mealType || 'Breakfast');
  const userId = user?.$id || user?._id;

  const [isAlertVisible, setAlertVisible] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/get-food-by-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodId }),
        });

        const data = await response.json();
        console.log('API Response:', data);

        // Ensure the food and servings data exist
        if (!data.food || !data.food.servings || !data.food.servings.serving) {
          console.error('Invalid or missing food or servings data');
          setFoodDetails(null);
          return;
        }

        const servings = data.food.servings.serving;

        // Ensure servings is an array
        const servingArray = Array.isArray(servings) ? servings : [servings];

        // Use the first serving for details
        const firstServing = servingArray[0];

        // Set food details using the first serving
        setFoodDetails({
          title: data.food.food_name || 'No Title',
          servingsize: firstServing.serving_description || 'N/A',
          numberOfServings: firstServing.number_of_units || 'N/A',
          calories: firstServing.calories || 'N/A',
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
        });
      } catch (error) {
        console.error('Error fetching food details:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkFavoriteStatus = async () => {
      if (!userId || !foodId) return;
      try {
        const response = await fetch(`${API_URL}/favorites/check/${userId}/food/${foodId}`);
        if (!response.ok) throw new Error('Failed to check favorite status');
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    if (foodId) {
      fetchFoodDetails();
      checkFavoriteStatus();
    }
  }, [foodId, userId]);

  const handleFavoritePress = async () => {
    if (!userId || !foodDetails) return;

    try {
      if (isFavorited) {
        // Find the favorite document ID first
        const response = await fetch(`${API_URL}/favorites/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const favorites = await response.json();
        const favorite = favorites.find(f => f.itemId === foodId && f.itemType === 'food');
        
        if (favorite) {
          const deleteResponse = await fetch(`${API_URL}/favorites/${favorite._id}`, {
            method: 'DELETE'
          });
          if (!deleteResponse.ok) throw new Error('Failed to remove from favorites');
        }
      } else {
        const response = await fetch(`${API_URL}/favorites/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            itemType: 'food',
            itemId: foodId,
            name: foodDetails.title,
            image: 'https://via.placeholder.com/300',
            nutrition: {
              calories: parseFloat(foodDetails.calories),
              protein: parseFloat(foodDetails.protein),
              carbs: parseFloat(foodDetails.carbs),
              fats: parseFloat(foodDetails.fats)
            }
          })
        });
        if (!response.ok) throw new Error('Failed to add to favorites');
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDarkMode ? '#111827' : '#ffffff' 
      }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#34D399' : '#10B981'} />
        <Text style={{ 
          color: isDarkMode ? '#F3F4F6' : '#000000',
          marginTop: 16,
          fontSize: 18,
          fontWeight: '500'
        }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!foodDetails) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDarkMode ? '#111827' : '#f3f4f6' 
      }}>
        <Text style={{ color: isDarkMode ? '#F3F4F6' : '#000000' }}>
          Food details not found
        </Text>
      </SafeAreaView>
    );
  }

  // Debugging: Log the entire foodDetails object
  console.log('Food Details:', foodDetails);

  // Extracting and calculating macronutrient values
  const carbs = parseFloat(foodDetails.carbs) || 0;
  const protein = parseFloat(foodDetails.protein) || 0;
  const fats = parseFloat(foodDetails.fats) || 0;

  // Extract additional data with fallback values
  const title = foodDetails.title || 'No Title';
  const servingsize = foodDetails.servingsize || 0;
  const numberOfServings = foodDetails.numberOfServings || 0;
  const calories = foodDetails.calories || 0;
  const time = foodDetails.time || 0;
  const saturated_fat = foodDetails.saturated_fat;
  const polyunsaturated_fat = foodDetails.polyunsaturated_fat;
  const monounsaturated_fat = foodDetails.monounsaturated_fat;
  const cholesterol = foodDetails.cholesterol;
  const sodium = foodDetails.sodium;
  const potassium = foodDetails.potassium;
  const fiber = foodDetails.fiber;
  const sugar = foodDetails.sugar;
  const vitamin_a = foodDetails.vitamin_a;
  const vitamin_c = foodDetails.vitamin_c;
  const calcium = foodDetails.calcium;
  const iron = foodDetails.iron;

  // Handle action for + icon (for example, adding a meal)
  const handlePlusIconPress = async (foodId) => {
    if (!user) {
      console.error('User is not logged in');
      return;
    }

    try {
      console.log('Plus Icon Pressed for foodId:', foodId);
      console.log('Meal Type:', mealTypeState);

      // Get nutrition data from the existing foodDetails state
      const nutritionData = {
        calories: parseFloat(foodDetails.calories || 0),
        carbs: parseFloat(foodDetails.carbs || 0),
        protein: parseFloat(foodDetails.protein || 0),
        fats: parseFloat(foodDetails.fats || 0),
        servingSize: foodDetails.servingsize || '1 serving'
      };

      const response = await fetch(`${API_URL}/logged-food/loggedFood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          foodId,
          recipeId: null,
          mealType: mealTypeState.toLowerCase(),
          entryId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          nutrition: nutritionData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error logging food:', errorData);
        throw new Error('Failed to log food');
      }

      const data = await response.json();
      console.log('Logged Food successfully:', data);
      setAlertVisible(true);
    } catch (error) {
      console.error('Error Logging Food:', error.message || error);
    }
  };

  // Calculating total macronutrients and percentages
  const totalMacronutrients = carbs + protein + fats;
  const carbsPercentage = totalMacronutrients > 0 ? (carbs / totalMacronutrients) * 100 : 0;
  const proteinPercentage = totalMacronutrients > 0 ? (protein / totalMacronutrients) * 100 : 0;
  const fatsPercentage = totalMacronutrients > 0 ? (fats / totalMacronutrients) * 100 : 0;

  // Pie chart angle calculations
  const totalAngle = 360;
  const carbsAngle = (carbsPercentage / 100) * totalAngle;
  const proteinAngle = (proteinPercentage / 100) * totalAngle;
  const fatsAngle = (fatsPercentage / 100) * totalAngle;

  const renderNutrientSection = (title, items) => (
    <LinearGradient
      colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
      }}
    >
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: isDarkMode ? '#F3F4F6' : '#111827',
        marginBottom: 12
      }}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name={item.icon} size={20} color={item.color} style={{ marginRight: 8 }} />
            <Text style={{ color: isDarkMode ? '#E5E7EB' : '#4B5563' }}>{item.label}</Text>
          </View>
          <Text style={{ 
            color: isDarkMode ? '#F3F4F6' : '#111827',
            fontWeight: '500'
          }}>
            {item.value} {item.unit}
          </Text>
        </View>
      ))}
    </LinearGradient>
  );

  const ProgressBar = ({ value, maxValue, color }) => (
    <View style={{ 
      height: 8, 
      backgroundColor: isDarkMode ? '#374151' : '#e5e7eb', 
      borderRadius: 4, 
      width: '100%', 
      marginTop: 4 
    }}>
      <View 
        style={{ 
          height: 8, 
          borderRadius: 4, 
          width: `${(value / maxValue) * 100}%`,
          backgroundColor: color,
        }} 
      />
    </View>
  );

  const NutrientProgress = ({ label, value, maxValue, icon, color }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View 
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: isDarkMode ? `${color}40` : `${color}20` 
            }}
          >
            <Icon name={icon} size={16} color={color} />
          </View>
          <Text style={{
            color: isDarkMode ? '#F3F4F6' : '#111827',
            fontSize: 16,
            fontWeight: '500',
            marginLeft: 8
          }}>
            {label}
          </Text>
        </View>
        <Text style={{
          color: isDarkMode ? '#F3F4F6' : '#111827',
          fontWeight: '600'
        }}>{value}g</Text>
      </View>
      <ProgressBar value={value} maxValue={maxValue} color={color} />
      <Text style={{
        fontSize: 12,
        color: isDarkMode ? '#D1D5DB' : '#6B7280',
        marginTop: 4
      }}>
        {((value/maxValue) * 100).toFixed(1)}% of daily goal
      </Text>
    </View>
  );

  const renderNutritionCard = () => {
    // Update daily values based on 2400 calorie diet
    const dailyProtein = 60; // g (based on 2400 cal diet)
    const dailyCarbs = 360; // g (based on 2400 cal diet)
    const dailyFats = 80; // g (based on 2400 cal diet)
    const totalCalories = calories;

    return (
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: isDarkMode ? '#F3F4F6' : '#111827'
          }}>
            Nutrition Overview
          </Text>
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9999,
            backgroundColor: isDarkMode ? '#065F46' : '#D1FAE5'
          }}>
            <Text style={{
              color: isDarkMode ? '#FFFFFF' : '#065F46',
              fontWeight: '500'
            }}>
              {totalCalories} kcal
            </Text>
          </View>
        </View>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: isDarkMode ? '#D1D5DB' : '#6B7280',
            marginBottom: 8
          }}>
            Per serving ({servingsize})
          </Text>
        </View>

        <NutrientProgress 
          label="Protein" 
          value={protein}
          maxValue={dailyProtein}
          icon="fitness-outline" 
          color="#059669"
        />
        <NutrientProgress 
          label="Carbs"
          value={carbs}
          maxValue={dailyCarbs}
          icon="leaf-outline"
          color="#7C3AED"
        />
        <NutrientProgress 
          label="Fats" 
          value={fats} 
          maxValue={dailyFats}
          icon="water-outline"
          color="#EA580C"
        />

        <View style={{
          marginTop: 8,
          padding: 12,
          backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
          borderRadius: 8
        }}>
          <Text style={{
            fontSize: 12,
            color: isDarkMode ? '#D1D5DB' : '#6B7280',
            textAlign: 'center'
          }}>
            Based on a 2400 calorie diet
          </Text>
        </View>
      </LinearGradient>
    );
  };

  const renderTitle = (fullTitle) => {
    // Split title into main title and subtitle if it contains parentheses
    const matches = fullTitle.match(/(.*?)(?:\s*\((.*?)\))?$/);
    const mainTitle = matches[1].trim();
    const subtitle = matches[2];

    return (
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text 
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: isDarkMode ? '#F3F4F6' : '#111827',
            lineHeight: 24
          }} 
          numberOfLines={2}
        >
          {mainTitle}
        </Text>
        {subtitle && (
          <Text 
            style={{
              fontSize: 14,
              color: isDarkMode ? '#9CA3AF' : '#6B7280',
              marginTop: 4
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111827' : '#f3f4f6' 
    }}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16
        }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ padding: 8 }}
          >
            <Icon name="arrow-back" size={24} color={isDarkMode ? '#F9FAFB' : '#000000'} />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: isDarkMode ? '#F3F4F6' : '#111827'
          }}>
            Food Details
          </Text>

          <TouchableOpacity
            onPress={handleFavoritePress}
            style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#f3f4f6',
              borderRadius: 9999,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorited ? "#EF4444" : (isDarkMode ? '#F9FAFB' : '#4B5563')} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          {/* Food Title and Badge */}
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
            style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {renderTitle(title)}
              <View style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: isDarkMode ? '#065F46' : '#D1FAE5'
              }}>
                <Text style={{
                  color: isDarkMode ? '#FFFFFF' : '#065F46',
                  fontWeight: '500'
                }}>
                  {mealTypeState}
                </Text>
              </View>
            </View>
            <View style={{
              marginTop: 12,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? '#374151' : '#f3f4f6'
            }}>
              <Text style={{
                color: isDarkMode ? '#D1D5DB' : '#6B7280'
              }}>
                Serving size: {servingsize}
              </Text>
              <Text style={{
                color: isDarkMode ? '#D1D5DB' : '#6B7280',
                marginTop: 4
              }}>
                Servings per container: {numberOfServings}
              </Text>
            </View>
          </LinearGradient>

          {renderNutritionCard()}

          {/* Vitamins and Minerals */}
          {renderNutrientSection('Vitamins & Minerals', [
            { label: 'Vitamin A', value: vitamin_a || 0, unit: 'IU', icon: 'sunny', color: '#F59E0B' },
            { label: 'Vitamin C', value: vitamin_c || 0, unit: 'mg', icon: 'leaf', color: '#10B981' },
            { label: 'Calcium', value: calcium || 0, unit: 'mg', icon: 'fitness', color: '#6366F1' },
            { label: 'Iron', value: iron || 0, unit: 'mg', icon: 'barbell', color: '#EF4444' },
          ])}

          {/* Fats Breakdown */}
          {renderNutrientSection('Fats Breakdown', [
            { label: 'Saturated', value: saturated_fat || 0, unit: 'g', icon: 'water', color: '#EC4899' },
            { label: 'Polyunsaturated', value: polyunsaturated_fat || 0, unit: 'g', icon: 'water', color: '#8B5CF6' },
            { label: 'Monounsaturated', value: monounsaturated_fat || 0, unit: 'g', icon: 'water', color: '#6366F1' },
          ])}

          {/* Other Nutrients */}
          {renderNutrientSection('Other Nutrients', [
            { label: 'Cholesterol', value: cholesterol || 0, unit: 'mg', icon: 'medkit', color: '#EF4444' },
            { label: 'Sodium', value: sodium || 0, unit: 'mg', icon: 'flask', color: '#F59E0B' },
            { label: 'Potassium', value: potassium || 0, unit: 'mg', icon: 'flash', color: '#10B981' },
            { label: 'Dietary Fiber', value: fiber || 0, unit: 'g', icon: 'leaf', color: '#8B5CF6' },
            { label: 'Sugar', value: sugar || 0, unit: 'g', icon: 'nutrition', color: '#EC4899' },
          ])}
        </View>
      </ScrollView>

      {/* Bottom Add Meal Button */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: isDarkMode ? '#1F2937' : '#ffffff', 
        borderTopWidth: 1, 
        borderTopColor: isDarkMode ? '#374151' : '#e5e7eb' 
      }}>
        <TouchableOpacity
          onPress={() => handlePlusIconPress(foodId)}
          style={{
            backgroundColor: isDarkMode ? '#065F46' : '#34D399',
            borderRadius: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon name="add-circle" size={24} color="white" style={{ marginRight: 8 }} />
          <Text style={{
            color: 'white',
            fontWeight: '600',
            fontSize: 18,
            marginLeft: 8
          }}>
            Add to {mealTypeState}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlert 
        visible={isAlertVisible} 
        message="Food logged successfully!" 
        onClose={() => setAlertVisible(false)} 
        animation={animationData} 
      />
    </SafeAreaView>
  );
};

export default FoodDetails;


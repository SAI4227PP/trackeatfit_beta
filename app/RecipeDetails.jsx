import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomAlert from '../components/CustomAlert';
import CustomDropdown from '../components/CustomDropdown';
import { useGlobalContext } from '../context/GlobalProvider';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import animationData from '../assets/lottie/Animation - comfirmation.json';
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const { width: screenWidth } = Dimensions.get('window');

const recipeDetails = () => {
  const { params } = useRoute();
  const { recipeId, mealType } = params;  // Accept both recipeId and mealType
  const actualRecipeId = recipeId?.$id || recipeId; // Handle both object and direct ID
  const [recipe, setRecipe] = useState(null);
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [mealTypeState, setMealTypeState] = useState(mealType || 'Breakfast');
  const [isFavorited, setIsFavorited] = useState(false);
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();
  const userId = user?.$id || user?._id;

  const navigation = useNavigation();
  useEffect(() => {
    // If an AI-generated recipe is passed directly, use it instead of fetching
    if (params.recipe && params.recipe.isAiGenerated) {
      const aiRecipe = params.recipe;     
       setRecipe({
        name: aiRecipe.recipe_name,
        image: aiRecipe.recipe_image,
        serves: 1,
        calories: aiRecipe.recipe_nutrition.calories || 0,
        totalTime: parseInt(aiRecipe.cooking_time) || 0,
        categories: aiRecipe.diet_labels || [],
        ingredients: Array.isArray(aiRecipe.ingredientList) 
          ? aiRecipe.ingredientList.join('\n') 
          : Array.isArray(aiRecipe.ingredients)
            ? aiRecipe.ingredients.map(ing => typeof ing === 'object' ? `${ing.amount} ${ing.item}` : ing).join('\n')
            : 'No ingredients available.',
        ingredientDetails: Array.isArray(aiRecipe.ingredients)
          ? aiRecipe.ingredients.map(ing => ({ 
              text: typeof ing === 'object' ? `${ing.amount} ${ing.item}` : ing 
            }))
          : [],
        instructions: aiRecipe.instructions || [],
        tips: aiRecipe.tips || '',
        isAiGenerated: true,
        labels: {
          diet: aiRecipe.diet_labels || [],
          healthLabels: [],
          cautions: [],
          cuisineType: [],
          mealType: [],
          dish: []
        },
        nutrients: {
          mainNutrients: {
            calories: aiRecipe.recipe_nutrition.calories || 0,
            protein: aiRecipe.recipe_nutrition.protein || Math.round(aiRecipe.recipe_nutrition.calories * 0.15 / 4) || 0,
            carbs: aiRecipe.recipe_nutrition.carbs || Math.round(aiRecipe.recipe_nutrition.calories * 0.5 / 4) || 0,
            fat: { 
              total: aiRecipe.recipe_nutrition.fat?.total || Math.round(aiRecipe.recipe_nutrition.calories * 0.35 / 9) || 0,
              saturated: aiRecipe.recipe_nutrition.fat?.saturated || Math.round(aiRecipe.recipe_nutrition.calories * 0.12 / 9) || 0, 
              trans: aiRecipe.recipe_nutrition.fat?.trans || 0, 
              mono: aiRecipe.recipe_nutrition.fat?.mono || Math.round(aiRecipe.recipe_nutrition.calories * 0.13 / 9) || 0, 
              poly: aiRecipe.recipe_nutrition.fat?.poly || Math.round(aiRecipe.recipe_nutrition.calories * 0.10 / 9) || 0
            }
          },
          additionalNutrients: {
            fiber: aiRecipe.additionalNutrients?.fiber || Math.round(aiRecipe.recipe_nutrition.calories * 0.013) || 0,
            sugar: { 
              total: aiRecipe.additionalNutrients?.sugar?.total || Math.round(aiRecipe.recipe_nutrition.calories * 0.03) || 0, 
              added: aiRecipe.additionalNutrients?.sugar?.added || Math.round(aiRecipe.recipe_nutrition.calories * 0.015) || 0
            },
            cholesterol: aiRecipe.additionalNutrients?.cholesterol || Math.round(aiRecipe.recipe_nutrition.calories * 0.15) || 0,
            minerals: {
              sodium: aiRecipe.additionalNutrients?.minerals?.sodium || Math.round(aiRecipe.recipe_nutrition.calories * 1) || 0,
              calcium: aiRecipe.additionalNutrients?.minerals?.calcium || Math.round(aiRecipe.recipe_nutrition.calories * 0.5) || 0,
              magnesium: aiRecipe.additionalNutrients?.minerals?.magnesium || Math.round(aiRecipe.recipe_nutrition.calories * 0.15) || 0,
              potassium: aiRecipe.additionalNutrients?.minerals?.potassium || Math.round(aiRecipe.recipe_nutrition.calories * 1.5) || 0,
              iron: aiRecipe.additionalNutrients?.minerals?.iron || Math.round(aiRecipe.recipe_nutrition.calories * 0.008) || 0,
              zinc: aiRecipe.additionalNutrients?.minerals?.zinc || Math.round(aiRecipe.recipe_nutrition.calories * 0.005) || 0,
              phosphorus: aiRecipe.additionalNutrients?.minerals?.phosphorus || Math.round(aiRecipe.recipe_nutrition.calories * 0.35) || 0
            }
          }
        }
      });
      return;
    }
    
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`${API_URL}/api/recipes/${actualRecipeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipe details');
        }
        const data = await response.json();
        setRecipe({
          name: data.recipe_name,
          image: data.image,
          serves: 1, // Changed default value to 1
          calories: Math.round(data.calories_per_serving || 0),
          totalTime: data.totalTime || 0,
          categories: [
            ...(data.dietLabels || []),
            ...(data.recipe.healthLabels || []),
            ...(data.recipe.cautions || []),
            ...(data.recipe.cuisineType || []),
            ...(data.recipe.mealType || []),
            ...(data.recipe.dishType || [])
          ],
          ingredients: data.recipe.ingredientLines?.join('\n') || 'No ingredients available.',
          ingredientDetails: data.recipe.ingredients || [],
          labels: {
            diet: data.dietLabels || [],
            healthLabels: data.recipe.healthLabels || [],
            cautions: data.recipe.cautions || [],
            cuisineType: data.recipe.cuisineType || [],
            mealType: data.recipe.mealType || [],
            dish: data.recipe.dishType || []
          },
          nutrients: {
            mainNutrients: {
              calories: Math.round(data.calories_per_serving || 0),
              protein: Math.round(data.recipe.totalNutrients?.PROCNT?.quantity || 0), // Removed division by 4
              carbs: Math.round(data.recipe.totalNutrients?.CHOCDF?.quantity || 0),
              fat: {
                total: Math.round(data.recipe.totalNutrients?.FAT?.quantity || 0),
                saturated: Math.round(data.recipe.totalNutrients?.FASAT?.quantity || 0),
                trans: Math.round(data.recipe.totalNutrients?.FATRN?.quantity || 0),
                mono: Math.round(data.recipe.totalNutrients?.FAMS?.quantity || 0),
                poly: Math.round(data.recipe.totalNutrients?.FAPU?.quantity || 0)
              }
            },
            additionalNutrients: {
              fiber: Math.round(data.recipe.totalNutrients?.FIBTG?.quantity || 0),
              sugar: {
                total: Math.round(data.recipe.totalNutrients?.SUGAR?.quantity || 0),
                added: Math.round(data.recipe.totalNutrients?.['SUGAR.added']?.quantity || 0)
              },
              cholesterol: Math.round(data.recipe.totalNutrients?.CHOLE?.quantity || 0),
              minerals: {
                sodium: Math.round(data.recipe.totalNutrients?.NA?.quantity || 0),
                calcium: Math.round(data.recipe.totalNutrients?.CA?.quantity || 0),
                magnesium: Math.round(data.recipe.totalNutrients?.MG?.quantity || 0),
                potassium: Math.round(data.recipe.totalNutrients?.K?.quantity || 0),
                iron: Math.round(data.recipe.totalNutrients?.FE?.quantity || 0),
                zinc: Math.round(data.recipe.totalNutrients?.ZN?.quantity || 0),
                phosphorus: Math.round(data.recipe.totalNutrients?.P?.quantity || 0)
              },
              vitamins: {
                a: data.recipe.totalNutrients?.VITA_RAE?.quantity || 0,
                c: data.recipe.totalNutrients?.VITC?.quantity || 0,
                d: data.recipe.totalNutrients?.VITD?.quantity || 0,
                e: data.recipe.totalNutrients?.TOCPHA?.quantity || 0,
                k: data.recipe.totalNutrients?.VITK1?.quantity || 0,
                b1: data.recipe.totalNutrients?.THIA?.quantity || 0,
                b2: data.recipe.totalNutrients?.RIBF?.quantity || 0,
                b3: data.recipe.totalNutrients?.NIA?.quantity || 0,
                b6: data.recipe.totalNutrients?.VITB6A?.quantity || 0,
                b12: data.recipe.totalNutrients?.VITB12?.quantity || 0,
                folate: data.recipe.totalNutrients?.FOLDFE?.quantity || 0
              }
            }
          }
        });
      } catch (error) {
        console.error('Failed to load recipe details', error);
        Alert.alert('Error', 'Failed to load recipe details');
      }
    };

    const checkFavoriteStatus = async () => {
      if (!userId || !actualRecipeId) return;
      try {
        console.log('Checking favorite status for:', { userId, actualRecipeId });
        const response = await fetch(`${API_URL}/favorites/check/${userId}/recipe/${actualRecipeId}`);
        if (!response.ok) throw new Error('Failed to check favorite status');
        const data = await response.json();
        console.log('Favorite status response:', data);
        setIsFavorited(data.isFavorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    fetchRecipe();
    if (userId && actualRecipeId) {
      checkFavoriteStatus();
    }
  }, [actualRecipeId, userId]);

  const ProgressBar = ({ value, maxValue, color }) => (
    <View style={{
      height: 8,
      backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
      borderRadius: 9999,
      width: '100%',
      marginTop: 4
    }}>
      <View
        style={{
          height: 8,
          borderRadius: 9999,
          width: `${Math.min((value / maxValue) * 100, 100)}%`,
          backgroundColor: (value / maxValue) > 1 ? '#EF4444' : color
        }}
      />
    </View>
  );

  const NutrientProgress = ({ label, value, maxValue, icon, color }) => {
    const servingsAdjustedValue = value * (recipe.serves || 1);
    const percentage = (servingsAdjustedValue / maxValue) * 100;
    const isExceeded = percentage > 100;
    
    return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 9999, 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: isDarkMode ? `${isExceeded ? '#ef444440' : `${color}40`}` : `${isExceeded ? '#fee2e2' : `${color}20`}` 
            }}
          >
            <Icon name={icon} size={16} color={isExceeded ? '#ef4444' : color} />
          </View>
          <Text style={{
            color: isDarkMode ? '#F9FAFB' : '#111827',
            fontSize: 16,
            fontWeight: '500',
            marginLeft: 8
          }}>
            {label}
          </Text>
        </View>
        <Text style={{
          color: isDarkMode ? '#F9FAFB' : '#111827',
          fontWeight: '600',
          fontSize: 16,
          ...(isExceeded ? { color: '#ef4444' } : {})
        }}>
          {servingsAdjustedValue}g
        </Text>
      </View>
      <ProgressBar value={servingsAdjustedValue} maxValue={maxValue} color={color} />
      <Text style={{
        fontSize: 12,
        marginTop: 4,
        color: isDarkMode ? '#D1D5DB' : '#6B7280',
        ...(isExceeded ? { color: '#ef4444' } : {})
      }}>
        {percentage.toFixed(1)}% of daily goal {isExceeded ? '(Exceeded)' : ''}
      </Text>
    </View>
    );
  };
  const handleFavoritePress = async () => {
    if (!userId || !recipe) return;

    try {
      console.log('Handling favorite press:', { userId, recipeId: actualRecipeId, isFavorited });
      
      // For AI-generated recipes, we'll handle them differently since they don't exist in the database
      const isAiGenerated = recipe.isAiGenerated;
      
      if (isFavorited) {
        // First find the existing favorite
        const response = await fetch(`${API_URL}/favorites/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const favorites = await response.json();
        const favorite = favorites.find(f => {
          if (isAiGenerated) {
            return f.name === recipe.name && f.itemType === 'recipe';
          } else {
            return f.itemId.toString() === actualRecipeId.toString() && f.itemType === 'recipe';
          }
        });
        console.log('Found favorite to delete:', favorite);

        if (favorite) {
          const deleteResponse = await fetch(`${API_URL}/favorites/${favorite._id}`, {
            method: 'DELETE'
          });
          if (!deleteResponse.ok) throw new Error('Failed to remove from favorites');
          console.log('Successfully removed from favorites');
          setIsFavorited(false);
        }
      } else {
        // Try to add to favorites
        const addResponse = await fetch(`${API_URL}/favorites/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            itemType: 'recipe',
            itemId: isAiGenerated ? `ai-${Date.now()}` : actualRecipeId.toString(),
            name: recipe.name,
            image: recipe.image,
            isAiGenerated: isAiGenerated || false,
            instructions: isAiGenerated ? recipe.instructions : undefined,
            ingredients: isAiGenerated ? recipe.ingredients : undefined,
            tips: isAiGenerated ? recipe.tips : undefined,
            nutrition: {
              calories: recipe.calories,
              protein: recipe.nutrients.mainNutrients.protein,
              carbs: recipe.nutrients.mainNutrients.carbs,
              fats: recipe.nutrients.mainNutrients.fat.total
            }
          })
        });
        
        const responseData = await addResponse.json();
        if (!addResponse.ok) {
          console.error('Error response:', responseData);
          // If it's already favorited, just update the UI state
          if (responseData.message === 'Item already in favorites') {
            setIsFavorited(true);
            return;
          }
          throw new Error(responseData.message || 'Failed to add to favorites');
        }
        
        console.log('Successfully added to favorites');
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="black" />
        <Text style={{ color: '#000000', marginTop: 16, fontSize: 18, fontWeight: '500' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const handleAddToMeals = async (recipeId) => {
    if (!user) {
      console.error('User is not logged in');
      return;
    }
  
    try {
      const date = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata'
      });
      
      // Ensure values are parsed as floats and rounded to 2 decimal places
      const nutritionData = {
        calories: Number(recipe.calories || 0),
        carbs: Number(recipe.nutrients.mainNutrients.carbs || 0),
        protein: Number(recipe.nutrients.mainNutrients.protein || 0),
        fats: Number(recipe.nutrients.mainNutrients.fat.total || 0),
        servingSize: '1 serving'
      };
  
      const logData = {
        userId,
        foodId: null,
        recipeId,
        mealType: mealTypeState.toLowerCase(),
        entryId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nutrition: nutritionData,
        addedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/logged-food/loggedFood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error('Server error response:', responseData);
        throw new Error(responseData.error || 'Failed to log food');
      }
  
      setAlertVisible(true);
    } catch (error) {
      console.error('Error Logging Food:', error.message || error);
      Alert.alert('Error', 'Failed to add meal. Please try again.');
    }
  };

  const styles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#f3f4f6'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#F9FAFB' : '#000000'
    },
    favoriteButton: {
      backgroundColor: isDarkMode ? '#1F2937' : '#f3f4f6',
      borderRadius: 9999,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    cardContent: {
      padding: 20, // Increased from 16 to 20
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#F9FAFB' : '#111827',
      paddingHorizontal: 20, // Add horizontal padding for titles
      paddingTop: 20, // Add top padding for titles
    },
    contentPadding: {
      padding: 20, // Consistent padding for content sections
    },
    dietLabel: {
      backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5',
      borderRadius: 9999,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginRight: 8
    },
    dietLabelText: {
      color: isDarkMode ? '#ffffff' : '#059669'
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
      borderRadius: 9999,
      width: '100%',
      marginTop: 4
    },
    progressBar: (value, maxValue, color) => ({
      height: 8,
      borderRadius: 9999,
      width: `${Math.min((value / maxValue) * 100, 100)}%`,
      backgroundColor: (value / maxValue) > 1 ? '#EF4444' : color
    }),
    nutrientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4
    },
    nutritionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 20,
      paddingTop: 20
    },
    nutritionContent: {
      padding: 20,
      paddingTop: 0
    },
    caloriesBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 9999,
      backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5'
    },
    ingredientsContent: {
      padding: 20,
      paddingTop: 0
    },
    cardSection: {
      padding: 20,
      paddingTop: 0
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB'
    },
    // Add more styles as needed...
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{ shadowOpacity: 0.1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ padding: 8 }}
          >
            <Icon name="arrow-back" size={24} color={isDarkMode ? '#F9FAFB' : '#000000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
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
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
            style={styles.card}
          >
            <Image
              source={recipe.image}
              style={{ width: '100%', height: 192 }}
              contentFit="cover"
            />
            <View style={styles.cardContent}>
              <Text style={styles.title}>{recipe.name}</Text>
              <Text style={styles.subtitle}>Serves {recipe.serves || 1}</Text>
            </View>
          </LinearGradient>

          {/* Meal Type Selection */}
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
            style={[styles.card, { marginBottom: 16 }]}
          >
            <View style={[styles.cardContent, { paddingVertical: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Icon 
                  name="restaurant" 
                  size={24} 
                  color={isDarkMode ? '#10b981' : '#059669'} 
                  style={{ marginRight: 12 }}
                />
                <Text style={[
                  styles.title, 
                  { 
                    paddingHorizontal: 0, 
                    paddingTop: 0, 
                    marginBottom: 0,
                    flex: 1 
                  }
                ]}>
                  Meal Type
                </Text>
              </View>
              <CustomDropdown
                options={['Breakfast', 'Lunch', 'Dinner', 'Snacks']}
                selectedValue={mealTypeState}
                onSelect={setMealTypeState}
                placeholder="Select Meal Type"
              />
            </View>
          </LinearGradient>

          {/* Diet Labels Card */}
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
            style={styles.card}
          >
            <Text style={{
              ...styles.title,
              marginBottom: 12
            }}>
              Diet Labels
            </Text>
            <View style={styles.contentPadding}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row' }}>
                  {[...(recipe.labels?.diet || []), ...(recipe.labels?.healthLabels || [])].map((label, index) => (
                    <View
                      key={index}
                      style={styles.dietLabel}
                    >
                      <Text style={styles.dietLabelText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
            style={styles.card}
          >
            {/* Nutrition Overview */}
            <View style={styles.nutritionHeader}>
              <Text style={styles.title}>
                Nutrition Overview
              </Text>
              <View style={styles.caloriesBadge}>
                <Text style={{
                  color: isDarkMode ? '#ffffff' : '#059669',
                  fontWeight: '500'
                }}>
                  {recipe.calories} kcal
                </Text>
              </View>
            </View>
            <View style={styles.nutritionContent}>
              <NutrientProgress 
                label="Carbs" 
                value={recipe.nutrients.mainNutrients.carbs} 
                maxValue={300} 
                icon="nutrition" 
                color="#3399FF" 
              />
              <NutrientProgress 
                label="Protein" 
                value={recipe.nutrients.mainNutrients.protein} 
                maxValue={50} 
                icon="fitness" 
                color="#9400D3" 
              />
              <NutrientProgress 
                label="Fats" 
                value={recipe.nutrients.mainNutrients.fat.total} 
                maxValue={70} 
                icon="water" 
                color="#ffcc00" 
              />
            </View>
          </LinearGradient> 
          {/* Ingredients Card */}         
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
            style={styles.card}
          >
            <Text style={{
              ...styles.title,
              marginBottom: 12
            }}>
              Ingredients
            </Text>
            <View style={styles.ingredientsContent}>
              {recipe.isAiGenerated && Array.isArray(recipe.ingredientDetails) ? (
                <View>
                  {recipe.ingredientDetails.map((ing, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{
                        color: isDarkMode ? '#D1D5DB' : '#111827',
                        marginRight: 8
                      }}>•</Text>
                      <Text style={{
                        color: isDarkMode ? '#9CA3AF' : '#374151',
                        flex: 1
                      }}>
                        {ing.text}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{
                  color: isDarkMode ? '#9CA3AF' : '#374151',
                  lineHeight: 24
                }}>
                  {recipe.ingredients}
                </Text>
              )}
            </View>
          </LinearGradient>

          {/* Culinary Profile Card */}
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
            style={styles.card}
          >
            <Text style={{
              ...styles.title,
              marginBottom: 12
            }}>
              Culinary Profile
            </Text>
            <View style={styles.cardSection}>
              {Object.entries(recipe.labels).map(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && key !== 'diet' && key !== 'healthLabels') {
                  return (
                    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: 9999, 
                        backgroundColor: key === 'cautions' ? '#ef4444' : '#10b981',
                        marginRight: 8
                      }} />
                      <Text style={{
                        color: isDarkMode ? '#9CA3AF' : '#374151',
                        width: 96,
                        textTransform: 'capitalize'
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </Text>
                      <Text style={{
                        color: isDarkMode ? '#F9FAFB' : '#111827',
                        flex: 1
                      }}>
                        {value.join(', ')}
                      </Text>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </LinearGradient>

          {/* Detailed Nutrition Cards */}
          <View style={{ marginTop: 16 }}>
            {/* Macronutrients */}
            <LinearGradient
              colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
              style={styles.card}
            >
              <Text style={{
                ...styles.title,
                marginBottom: 12
              }}>
                Macronutrients
              </Text>
              <View style={styles.cardSection}>
                {Object.entries(recipe.nutrients.mainNutrients).map(([key, value]) => (
                  <View key={key} style={styles.listItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon 
                        name={key === 'calories' ? 'flame' : key === 'protein' ? 'fitness' : key === 'carbs' ? 'leaf' : 'water'} 
                        size={20} 
                        color={isDarkMode ? '#F9FAFB' : '#4B5563'} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={{
                        color: isDarkMode ? '#9CA3AF' : '#374151',
                        textTransform: 'capitalize'
                      }}>
                        {key}
                      </Text>
                    </View>
                    <Text style={{
                      color: isDarkMode ? '#F9FAFB' : '#111827',
                      fontWeight: '500'
                    }}>
                      {typeof value === 'object' ? value.total : value}
                      {key === 'calories' ? ' kcal' : 'g'}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Minerals */}
            <LinearGradient
              colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
              style={styles.card}
            >
              <Text style={{
                ...styles.title,
                marginBottom: 12
              }}>
                Minerals
              </Text>
              <View style={styles.cardSection}>
                {Object.entries(recipe.nutrients.additionalNutrients.minerals).map(([key, value]) => (
                  <View key={key} style={styles.listItem}>
                    <Text style={{
                      color: isDarkMode ? '#9CA3AF' : '#374151',
                      textTransform: 'capitalize'
                    }}>{key}</Text>
                    <Text style={{
                      color: isDarkMode ? '#F9FAFB' : '#111827',
                      fontWeight: '500'
                    }}>{value} mg</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Additional Information */}
            <LinearGradient
              colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
              style={styles.card}
            >
              <Text style={{
                ...styles.title,
                marginBottom: 12
              }}>
                Additional Information
              </Text>
              <View style={styles.cardSection}>
                {[
                  { label: 'Fiber', value: `${recipe.nutrients.additionalNutrients.fiber}g`, icon: 'leaf' },
                  { label: 'Total Sugar', value: `${recipe.nutrients.additionalNutrients.sugar.total}g`, icon: 'nutrition' },
                  { label: 'Added Sugar', value: `${recipe.nutrients.additionalNutrients.sugar.added}g`, icon: 'add-circle' },
                  { label: 'Cholesterol', value: `${recipe.nutrients.additionalNutrients.cholesterol}mg`, icon: 'medical' }
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name={item.icon} size={20} color={isDarkMode ? '#F9FAFB' : '#4B5563'} style={{ marginRight: 8 }} />
                      <Text style={{
                        color: isDarkMode ? '#9CA3AF' : '#374151'
                      }}>{item.label}</Text>
                    </View>
                    <Text style={{
                      color: isDarkMode ? '#F9FAFB' : '#111827',
                      fontWeight: '500'
                    }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Display Instructions for AI-generated recipes */}
          {recipe.isAiGenerated && recipe.instructions && (
            <LinearGradient
              colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
              style={styles.card}
            >
              <Text style={{
                ...styles.title,
                marginBottom: 12
              }}>
                Cooking Instructions
              </Text>
              {Array.isArray(recipe.instructions) ? (
                recipe.instructions.map((instruction, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <Text style={{
                      color: isDarkMode ? '#D1D5DB' : '#111827',
                      marginRight: 8,
                      fontWeight: 'bold'
                    }}>{idx + 1}.</Text>
                    <Text style={{
                      color: isDarkMode ? '#9CA3AF' : '#374151',
                      flex: 1
                    }}>
                      {instruction}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{
                  color: isDarkMode ? '#9CA3AF' : '#374151',
                  lineHeight: 24
                }}>
                  {recipe.instructions || 'No instructions available.'}
                </Text>
              )}
            </LinearGradient>
          )}

          {/* Display cooking tips if available in AI-generated recipes */}
          {recipe.isAiGenerated && recipe.tips && (
            <LinearGradient
              colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f0f9ff']}
              style={styles.card}
            >
              <Text style={{
                ...styles.title,
                marginBottom: 12
              }}>
                Cooking Tips
              </Text>
              <Text style={{
                color: isDarkMode ? '#9CA3AF' : '#374151',
                lineHeight: 24
              }}>
                {recipe.tips}
              </Text>
            </LinearGradient>
          )}
        </View>
      </ScrollView>

      {/* Bottom Add Meal Button */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? '#374151' : '#E5E7EB'
      }}>
        <TouchableOpacity
          onPress={() => handleAddToMeals(actualRecipeId)}
          style={{
            backgroundColor: isDarkMode ? '#10b981' : '#4caf50',
            borderRadius: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          disabled={!mealTypeState}
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
        message="Recipe added to meals successfully!"
        onClose={() => setAlertVisible(false)}
        animation={animationData}
      />
    </SafeAreaView>
  );
};

export default recipeDetails;

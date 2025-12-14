import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import IngredientInput from '../../components/IngredientInput';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const Recipe = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('All'); // Default tab is 'All'
  const [recipes, setRecipes] = useState([]); // State to store currently displayed recipes
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [myMeals, setMyMeals] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [myFoods, setMyFoods] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [ingredientBasedRecipes, setIngredientBasedRecipes] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [aiGeneratedRecipe, setAiGeneratedRecipe] = useState(null);
  const [isGeneratingAiRecipe, setIsGeneratingAiRecipe] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [seenRecipeIds, setSeenRecipeIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const cache = useRef(new Map()).current;

  const handleSearchClick = () => {
    navigation.navigate("RecipeSearch");
  };

  // Fetch recipes from API
  const fetchRecipes = async (isLoadMore = false, signal) => {
    const newPage = isLoadMore ? page + 1 : 1;

    // Prevent duplicate requests
    if (isLoadingMore || loading) return;

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setPage(1); // Reset page when fetching new recipes
    }
    setError(null);

    try {
      let url = `${API_URL}/api/recipes/?page=${newPage}&limit=10`;

      // Check cache first
      if (cache.has(url)) {
        const cachedData = cache.get(url);
        if (Date.now() - cachedData.timestamp < 300000) { // 5 minutes cache
          handleNewRecipes(cachedData.data, isLoadMore, newPage);
          return;
        }
      }

      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      cache.set(url, { data, timestamp: Date.now() });
      handleNewRecipes(data, isLoadMore, newPage);

    } catch (error) {
      if (error.name === 'AbortError') return; // Ignore abort errors
      console.error('Error fetching recipes:', error);
      setError('Failed to load recipes. Please try again later.');
      if (!isLoadMore) {
        setRecipes([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleNewRecipes = (data, isLoadMore, newPage) => {
    const newRecipes = data.recipes
      .filter(recipe => !seenRecipeIds.has(recipe.recipe_id))
      .map(recipe => ({
        _id: recipe._id, // <-- add _id to mapped object
        recipe_id: recipe.recipe_id,
        recipe_name: recipe.recipe_name.replace(/[#]/g, '').trim(),
        recipe_image: recipe.image || 'https://via.placeholder.com/400x300',
        recipe_description: [
          recipe.cuisineType?.[0],
          recipe.mealType?.[0],
          recipe.dishType?.[0]
        ].filter(Boolean).map(str => 
          str.charAt(0).toUpperCase() + str.slice(1)
        ).join(' • '),
        cooking_time: recipe.totalTime ? `${recipe.totalTime} min` : 'N/A',
        recipe_nutrition: { 
          calories: Math.round(recipe.calories_per_serving) || 0
        },
        diet_labels: recipe.dietLabels || []
      }));

    const newIds = new Set(newRecipes.map(r => r.recipe_id));
    setSeenRecipeIds(prev => new Set([...prev, ...newIds]));

    if (isLoadMore) {
      setRecipes(prev => [...prev, ...newRecipes]);
    } else {
      setRecipes(newRecipes);
    }
    setTotalPages(data.totalPages);
    setPage(newPage);
  };

  // Add this function for infinite scroll
  const handleLoadMore = () => {
    if (!isLoadingMore && page < totalPages) {
      const controller = new AbortController();
      fetchRecipes(true, controller.signal);
      // No need to abort here, as this is a one-off call for load more
    }
  };

  // Fetch default recipes on mount and when activeTab changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (activeTab === 'All' || activeTab === 'Available Ingredients') {
      setSeenRecipeIds(new Set()); // Reset seen IDs when switching tabs
      setPage(1);                  // Reset page
      setRecipes([]);              // Clear recipes to avoid stale state
      fetchRecipes(false, controller.signal);
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeTab]);
  
  // Fetch initial data on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetchRecipes(false, controller.signal);
    getUserIngredients().then(ingredients => {
      if (isMounted) setAvailableIngredients(ingredients);
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Handle navigation to favorites
  const handleFavorites = () => {
    navigation.navigate('favorite');
  };

  const renderRecipeCard = useCallback((recipe, index) => (
    <TouchableOpacity 
      key={recipe.recipe_id}
      style={{
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
        backgroundColor: isDarkMode ? '#2d3748' : '#fff',
      }}
      onPress={() => navigation.navigate('RecipeDetails', { recipeId: recipe.recipe_id })}
    >
      <Image
        source={recipe.recipe_image}
        style={{ height: 192, width: '100%' }}
        contentFit="cover"
      />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: isDarkMode ? '#fff' : '#222' }}>
          {recipe.recipe_name}
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8, color: isDarkMode ? '#e5e7eb' : '#666' }}>
          {recipe.recipe_description}
        </Text>
        {recipe.diet_labels?.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {recipe.diet_labels.map((label, idx) => (
              <View key={idx} style={{ backgroundColor: 'rgba(107,142,35,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, color: '#556B2F' }}>{label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="clock" size={16} color={isDarkMode ? '#999' : '#666'} />
            <Text style={{ marginLeft: 4, fontSize: 14, color: isDarkMode ? '#e5e7eb' : '#666' }}>
              {recipe.cooking_time}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(107,142,35,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
            <Icon name="trending-up" size={16} color="#556B2F" />
            <Text style={{ marginLeft: 4, fontSize: 14, color: '#556B2F', fontWeight: '500' }}>
              {recipe.recipe_nutrition.calories} kcal
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [isDarkMode, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSeenRecipeIds(new Set());
    setPage(1);
    setRecipes([]);
    await fetchRecipes();
    setRefreshing(false);
  };

  // Skeleton loader for recipe cards
  const SkeletonRecipeList = ({ count = 5 }) => (
    <View style={{ padding: 16 }}>
      {[...Array(count)].map((_, idx) => (
        <View
          key={idx}
          style={{
            marginBottom: 16,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            height: 260,
            opacity: 0.7,
          }}
        >
          <View style={{ height: 192, backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb' }} />
          <View style={{ padding: 16 }}>
            <View style={{ height: 24, width: '66%', backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db', borderRadius: 8, marginBottom: 8 }} />
            <View style={{ height: 16, width: '50%', backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db', borderRadius: 8, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={{ height: 20, width: 64, backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db', borderRadius: 999 }} />
              <View style={{ height: 20, width: 48, backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db', borderRadius: 999 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ height: 16, width: 64, backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db', borderRadius: 8 }} />
              <View style={{ height: 16, width: 80, backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db', borderRadius: 8 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    if (loading && activeTab !== 'Available Ingredients') {
      return (
        <SkeletonRecipeList count={5} />
      );
    }

    if (error && activeTab !== 'Available Ingredients') {
      return <Text style={{ color: '#dc2626', textAlign: 'center' }}>{error}</Text>;
    }

    // Handle different tab contents
    switch (activeTab) {
      case 'All':
        return (
          <FlatList
            data={recipes}
            renderItem={({ item, index }) => renderRecipeCard(item, index)}
            keyExtractor={item => item._id ? item._id : String(item.recipe_id)}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isLoadingMore ? (
              <ActivityIndicator size="small" color="#556B2F" className="py-4" />
            ) : null}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16 }}
            ref={flatListRef}
            nestedScrollEnabled={true}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        );
      
      case 'Available Ingredients':
        return renderIngredientsBasedRecipes();
      
      case 'My Meals':
        return renderMyMealsContent();
      
      case 'My Recipes':
        return renderMyRecipesContent();
      
      case 'My Foods':
        return renderMyFoodsContent();
      
      default:
        return null;
    }
  };

  const renderMyMealsContent = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {myMeals.length > 0 ? (
        <FlatList
          data={myMeals}
          renderItem={({ item, index }) => (
            <View
              key={index}
              style={{
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                backgroundColor: isDarkMode ? '#2d3748' : '#fff',
              }}
            >
              {/* Meal content */}
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 16 }}
          nestedScrollEnabled={true}
        />
      ) : (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Icon name="calendar" size={40} color="#556B2F" />
          <Text style={{ fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#525252' }}>Plan your meals</Text>
          <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 24, fontWeight: '500', color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
            Create meal plans and track your nutrition goals
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#556B2F', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
            onPress={() => Alert.alert('Create Meal Plan', 'Feature coming soon!')}
          >
            <Text style={{ color: '#fff', fontWeight: '500' }}>Create Meal Plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderMyRecipesContent = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {myRecipes.length > 0 ? (
        <FlatList
          data={myRecipes}
          renderItem={({ item, index }) => (
            <View
              key={index}
              style={{
                width: '48%',
                marginBottom: 16,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                backgroundColor: isDarkMode ? '#2d3748' : '#fff',
              }}
            >
              {/* Recipe card content */}
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Icon name="book-open" size={40} color="#556B2F" />
          <Text style={{ fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#525252' }}>Create your own recipes</Text>
          <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 24, fontWeight: '500', color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
            Save and organize your favorite recipes
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#556B2F', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
            onPress={() => Alert.alert('Create Recipe', 'Feature coming soon!')}
          >
            <Text style={{ color: '#fff', fontWeight: '500' }}>Create Recipe</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderMyFoodsContent = () => (
  <View style={{ flex: 1 }}>
      {myFoods.length > 0 ? (
        <FlatList
          data={myFoods}
          renderItem={({ item, index }) => (
            <View
              key={index}
              style={{
                padding: 16,
                marginBottom: 12,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                backgroundColor: isDarkMode ? '#2d3748' : '#fff',
              }}
            >
              {/* Food item content */}
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Icon name="database" size={40} color="#556B2F" />
          <Text style={{ fontSize: 18, marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#525252' }}>Add custom foods</Text>
          <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 24, fontWeight: '500', color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
            Create and track your own food items
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#556B2F', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
            onPress={() => Alert.alert('Add Food', 'Feature coming soon!')}
          >
            <Text style={{ color: '#fff', fontWeight: '500' }}>Add Food Item</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderIngredientsBasedRecipes = () => (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={true}
      bounces={true}
      nestedScrollEnabled={true}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View>
        {/* Ingredients selection section */}
        <LinearGradient
          colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f9fafb']}
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
        >
          <View style={{ padding: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8, color: isDarkMode ? '#fff' : '#222' }}>
              Available Ingredients
            </Text>
            <Text style={{ marginBottom: 16, fontSize: 14, color: isDarkMode ? '#d1d5db' : '#666' }}>
              Select ingredients you have to find matching recipes
            </Text>
            {/* Ingredient Input Component */}
            <View style={{ marginBottom: 16 }}>
              <IngredientInput 
                selectedIngredients={availableIngredients}
                onAddIngredient={(ingredient) => handleIngredientToggle(ingredient)}
                onRemoveIngredient={(ingredient) => handleIngredientToggle(ingredient)}
              />
            </View>
            {/* AI Recipe Generation Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#556B2F',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 8,
                opacity: isGeneratingAiRecipe || availableIngredients.length === 0 ? 0.7 : 1,
                elevation: 1,
              }}
              onPress={generateAiRecipe}
              disabled={isGeneratingAiRecipe || availableIngredients.length === 0}
            >
              {isGeneratingAiRecipe ? (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="sparkles" size={20} color="white" style={{ marginRight: 8 }} />
              )}
              <Text style={{ color: '#fff', fontWeight: '500' }}>
                {isGeneratingAiRecipe ? "Generating Recipe..." : "Generate AI Recipe"}
              </Text>
            </TouchableOpacity>
            {availableIngredients.length === 0 && (
              <Text style={{ fontSize: 12, textAlign: 'center', marginTop: 8, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                Please add ingredients to generate recipes
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Recipes based on ingredients */}
        {(loading || refreshing) ? (
          <SkeletonRecipeList count={4} />
        ) : recipes.length > 0 ? (
          <FlatList
            data={recipes}
            keyExtractor={item => item._id ? item._id : String(item.recipe_id)}
            renderItem={({ item, index }) => renderRecipeCard(item, index)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 20 }}
            scrollEnabled={false}
            ListHeaderComponent={
              <View style={{ paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '500', color: isDarkMode ? '#e5e7eb' : '#444', fontSize: 15 }}>
                  {recipes.length} recipes found
                </Text>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    Alert.alert(
                      'Chef Recommendations', 
                      'Try these popular ingredients for better results:\n\n• Protein: chicken, beef, fish, tofu\n• Starches: rice, pasta, potato\n• Vegetables: tomato, onion, garlic, carrot\n• Extras: olive oil, spices, herbs',
                      [{ text: 'Got it' }]
                    );
                  }}
                >
                  <Icon name="info" size={16} color="#556B2F" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#556B2F', fontSize: 13 }}>Suggestions</Text>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              <>
                {/* Loading indicator for more recipes */}
                {isLoadingMore && (
                  <ActivityIndicator size="small" color="#556B2F" style={{ paddingVertical: 16 }} />
                )}
                {/* Load more button */}
                {!isLoadingMore && page < totalPages && (
                  <TouchableOpacity 
                    style={{
                      marginTop: 8,
                      paddingVertical: 12,
                      borderRadius: 16,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isDarkMode ? '#2d3748' : '#fff',
                      elevation: 1,
                    }}
                    onPress={handleLoadMore}
                  >
                    <Icon name="refresh-cw" size={16} color="#556B2F" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#556B2F', fontWeight: '500' }}>Load More Recipes</Text>
                  </TouchableOpacity>
                )}
              </>
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        ) : error ? (
          <Text style={{ color: '#dc2626', textAlign: 'center', padding: 16 }}>{error}</Text>
        ) : (
          <View style={{ paddingBottom: 40 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 40 }}>
              <View style={{ padding: 16, borderRadius: 999, backgroundColor: 'rgba(107,142,35,0.1)' }}>
                <Ionicons name="sparkles" size={50} color="#556B2F" />
              </View>
              <Text style={{ fontSize: 20, marginTop: 24, marginBottom: 8, fontWeight: 'bold', textAlign: 'center', color: isDarkMode ? '#f3f4f6' : '#222' }}>
                Create Something Delicious
              </Text>
              <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 32, maxWidth: 320, color: isDarkMode ? '#d1d5db' : '#666' }}>
                Let our AI chef create personalized recipes with the ingredients you have available
              </Text>
              <View style={{ width: '100%', maxWidth: 400 }}>
                <TouchableOpacity 
                  style={{
                    backgroundColor: '#556B2F',
                    marginBottom: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 16,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                    opacity: availableIngredients.length === 0 ? 0.5 : 1,
                  }}
                  onPress={generateAiRecipe}
                  disabled={availableIngredients.length === 0}
                >
                  <Ionicons name="restaurant" size={22} color="white" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Generate Custom Recipe</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // We've removed fetchRecipesByIngredients since we're now using fetchRecipes for both tabs

  // Helper function to get user's available ingredients
  const getUserIngredients = async () => {
    try {
      // Try to get ingredients from AsyncStorage
      const savedIngredients = await AsyncStorage.getItem('userIngredients');
      if (savedIngredients) {
        return JSON.parse(savedIngredients);
      }
      
      // Return default ingredients for demo purposes
      return ['chicken', 'rice', 'tomato', 'onion', 'garlic']; 
    } catch (error) {
      console.error('Error fetching user ingredients:', error);
      return ['chicken', 'rice', 'tomato']; // Default fallback
    }
  };

  // Helper function to add/remove ingredients
  const handleIngredientToggle = async (ingredient) => {
    console.log('Toggle ingredient called with:', ingredient);
    console.log('Current available ingredients:', availableIngredients);
    
    try {
      let updatedIngredients;
      
      // Check if we received a special batch update from multi-select
      if (ingredient && typeof ingredient === 'object' && ingredient.type === 'UPDATE_ALL') {
        // Handle the special case where we receive the complete list of ingredients
        console.log('Updating with complete ingredient set:', ingredient.ingredients);
        updatedIngredients = [...ingredient.ingredients]; // Use the complete list
      } else {
        // Regular single ingredient toggle
        // Check if ingredient is in the list
        if (availableIngredients.includes(ingredient)) {
          // Remove ingredient
          console.log('Removing ingredient:', ingredient);
          updatedIngredients = availableIngredients.filter(item => item !== ingredient);
        } else {
          // Add ingredient - don't add duplicates
          console.log('Adding ingredient:', ingredient);
          updatedIngredients = [...availableIngredients, ingredient];
        }
      }
      
      console.log('Updated ingredients array:', updatedIngredients);
      
      // Update state with new ingredients array
      setAvailableIngredients(updatedIngredients);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userIngredients', JSON.stringify(updatedIngredients));
      
      // Refresh recipes based on new ingredients
      if (activeTab === 'Available Ingredients') {
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error updating ingredients:', error);
      Alert.alert('Error', 'Failed to update ingredients');
    }
  };

  // Format recipes in a consistent way
  const formatRecipes = (recipeData) => {
    return recipeData.map(recipe => ({
      recipe_id: recipe.recipe_id,
      recipe_name: recipe.recipe_name.replace(/[#]/g, '').trim(),
      recipe_image: recipe.image || 'https://via.placeholder.com/400x300',
      recipe_description: [
        recipe.cuisineType?.[0],
        recipe.mealType?.[0],
        recipe.dishType?.[0]
      ].filter(Boolean).map(str => 
        str.charAt(0).toUpperCase() + str.slice(1)
      ).join(' • '),
      cooking_time: recipe.totalTime ? `${recipe.totalTime} min` : 'N/A',
      recipe_nutrition: { 
        calories: Math.round(recipe.calories_per_serving) || 0
      },
      diet_labels: recipe.dietLabels || [],
      matched_ingredients: recipe.matched_ingredients || []
    }));
  };

  // Generate recipe with AI based on available ingredients
  const generateAiRecipe = async () => {
    if (isGeneratingAiRecipe || availableIngredients.length === 0) return;
    
    setIsGeneratingAiRecipe(true);
    
    try {
      const apiKey = "AIzaSyBo2UvOWtOOn6QoxDXUpobxB0wiAeYga7A"; // Use the same API key as in geminichat.jsx
      const modelName = "gemini-1.5-flash";
      
      // Import the GoogleGenerativeAI
      const GoogleGenerativeAI = (await import('@google/generative-ai')).GoogleGenerativeAI;
      
      // Initialize GoogleGenerativeAI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Create prompt with ingredients - emphasize valid JSON formatting and using exact ingredients
      const prompt = `Create a detailed recipe using EXACTLY these ingredients: ${availableIngredients.join(', ')}. 
      
      IMPORTANT: 
      1. You MUST use ALL the ingredients provided in your recipe. Don't omit any.
      2. You MUST respond with ONLY a valid, parseable JSON object - no explanation, no markdown, no code blocks.
      3. For ingredients field, list each ingredient with precise amounts.
      
      The JSON should have these fields: 
      { 
        "recipe_name": "Recipe Title", 
        "description": "Short description", 
        "image": "suggest a good image URL for this dish",
        "cooking_time": time in minutes as a number, 
        "calories_per_serving": estimated calories as a number,
        "ingredients": [array of ingredients with exact amounts, MUST include ALL ${availableIngredients.join(', ')}],
        "instructions": [array of step-by-step instructions],
        "tips": "optional cooking tips"
      }
      
      Make sure all JSON keys and values are properly quoted and the JSON is valid.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse the JSON recipe from the response
      try {
        let jsonResponse = responseText;
        // Extract JSON if it's wrapped in markdown code blocks or other text
        
        // First, try to clean up the response by removing markdown code block markers
        jsonResponse = jsonResponse.replace(/```json|```/g, '').trim();
        
        // More thorough JSON extraction
        const jsonRegex = /\{(?:[^{}]|(\{(?:[^{}]|(\{(?:[^{}]|(\{[^{}]*\}))*\}))*\}))*\}/g;
        const matches = jsonResponse.match(jsonRegex);
        
        console.log('AI Response:', jsonResponse);
        console.log('Found JSON matches:', matches?.length || 0);
        
        if (matches && matches.length > 0) {
          jsonResponse = matches[0]; // Take the first complete JSON object found
        }
        
        // Try to ensure we have a complete, valid JSON
        if (!jsonResponse.startsWith('{') || !jsonResponse.endsWith('}')) {
          throw new Error('Invalid JSON format in AI response');
        }
        
        const recipe = JSON.parse(jsonResponse);
        
        // Convert the AI response to a recipe format matching our app
        const formattedRecipe = {
          recipe_id: `ai-${Date.now()}`,
          recipe_name: recipe.recipe_name,
          recipe_image: recipe.image || 'https://via.placeholder.com/400x300?text=AI+Generated+Recipe',
          recipe_description: recipe.description,
          cooking_time: `${recipe.cooking_time} min`,
          recipe_nutrition: {
            calories: recipe.calories_per_serving,
            protein: Math.round(recipe.calories_per_serving * 0.15 / 4) || 0, // Estimate protein (15% of calories)
            carbs: Math.round(recipe.calories_per_serving * 0.5 / 4) || 0,   // Estimate carbs (50% of calories)
            fat: {
              total: Math.round(recipe.calories_per_serving * 0.35 / 9) || 0,  // Estimate fat (35% of calories)
              saturated: Math.round(recipe.calories_per_serving * 0.12 / 9) || 0,  // Estimate saturated fat
              trans: 0,
              mono: Math.round(recipe.calories_per_serving * 0.13 / 9) || 0,  // Estimate monounsaturated fat
              poly: Math.round(recipe.calories_per_serving * 0.10 / 9) || 0   // Estimate polyunsaturated fat
            }
          },
          additionalNutrients: {
            fiber: Math.round(recipe.calories_per_serving * 0.013) || 0,  // ~25g fiber per 2000 calories
            sugar: { 
              total: Math.round(recipe.calories_per_serving * 0.03) || 0,  // ~60g sugar per 2000 calories
              added: Math.round(recipe.calories_per_serving * 0.015) || 0  // ~30g added sugar per 2000 calories
            },
            cholesterol: Math.round(recipe.calories_per_serving * 0.15) || 0, // ~300mg per 2000 calories
            minerals: {
              sodium: Math.round(recipe.calories_per_serving * 1) || 0,     // ~2000mg per 2000 calories
              calcium: Math.round(recipe.calories_per_serving * 0.5) || 0,  // ~1000mg per 2000 calories
              magnesium: Math.round(recipe.calories_per_serving * 0.15) || 0,  // ~300mg per 2000 calories
              potassium: Math.round(recipe.calories_per_serving * 1.5) || 0,   // ~3000mg per 2000 calories
              iron: Math.round(recipe.calories_per_serving * 0.008) || 0,      // ~16mg per 2000 calories
              zinc: Math.round(recipe.calories_per_serving * 0.005) || 0,      // ~10mg per 2000 calories
              phosphorus: Math.round(recipe.calories_per_serving * 0.35) || 0   // ~700mg per 2000 calories
            }
          },
          diet_labels: [],
          ingredients: recipe.ingredients,
          ingredientList: Array.isArray(recipe.ingredients) ? 
            recipe.ingredients.map(ing => typeof ing === 'object' ? `${ing.amount} ${ing.item}` : ing) : 
            [],
          instructions: recipe.instructions,
          tips: recipe.tips,
          isAiGenerated: true
        };
        
        setAiGeneratedRecipe(formattedRecipe);
        
        // Navigate to the recipe details screen with the AI generated recipe
        navigation.navigate('RecipeDetails', { 
          recipeId: formattedRecipe.recipe_id, 
          recipe: formattedRecipe 
        });
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Problematic response text:', responseText);
        
        // Display more helpful error message
        Alert.alert(
          'Error', 
          `Could not generate recipe: ${parseError.message}. Please try again with different ingredients.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating recipe with AI:', error);
      Alert.alert(
        'Error', 
        'Failed to generate recipe with AI. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingAiRecipe(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1a202c' : '#f9fafb' }}>
      {/* Header - Keep this outside the main ScrollView */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: isDarkMode ? '#2d3748' : '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            onPress={handleSearchClick}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16, paddingHorizontal: 16, height: 48, borderRadius: 999, backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }}
          >
            <Icon name="search" size={20} color={isDarkMode ? '#FFFFFF' : '#666'} />
            <Text style={{ marginLeft: 8, color: isDarkMode ? '#f3f4f6' : '#525252' }}>
              Search recipes...
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleFavorites}
            style={{ width: 48, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }}
          >
            <Icon name="heart" size={22} color="#556B2F" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16, marginTop: 16 }}
        >
          <View style={{ flexDirection: 'row', marginLeft: 8 }}>
            {['All', 'Available Ingredients', 'My Meals', 'My Recipes', 'My Foods'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  marginRight: 16,
                  paddingBottom: 8,
                  borderBottomWidth: activeTab === tab ? 2 : 0,
                  borderBottomColor: activeTab === tab ? '#556B2F' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: activeTab === tab ? '#556B2F' : (isDarkMode ? '#f3f4f6' : '#525252'),
                    fontWeight: activeTab === tab ? '600' : '400',
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content - direct rendering without additional ScrollView wrapper */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

export default Recipe;

import { useNavigation, useRoute } from '@react-navigation/native'; // Import the useNavigation hook
import { Image } from 'expo-image'; // Use expo-image for better image loading performance
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { default as Icon, default as Ionicons } from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the back arrow
import animationData from '../assets/lottie/Animation - comfirmation.json'; // Use the .lottie file
import CustomAlert from '../components/CustomAlert';
import CustomDropdown from '../components/CustomDropdown'; // Import the CustomDropdown component
import { useGlobalContext } from '../context/GlobalProvider'; // Assuming context is set up

const API_URL = "https://trackeatfit.onrender.com";

// Assume you have the getAllFood function imported

// Add RecipeSkeletonItem component
const RecipeSkeletonItem = memo(() => (
  <View style={{ backgroundColor: '#fff', padding: 16, marginTop: 8, borderRadius: 12, marginHorizontal: 4 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Image skeleton */}
        <View style={{ width: 48, height: 48, backgroundColor: '#e5e7eb', borderRadius: 8, marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          {/* Title skeleton */}
          <View style={{ width: '80%', height: 16, backgroundColor: '#e5e7eb', borderRadius: 8, marginBottom: 8 }} />
          {/* Calories skeleton */}
          <View style={{ width: '40%', height: 12, backgroundColor: '#d1d5db', borderRadius: 8 }} />
        </View>
      </View>
      {/* Plus button skeleton */}
      <View style={{ width: 24, height: 24, backgroundColor: '#e5e7eb', borderRadius: 12, marginLeft: 8 }} />
    </View>
  </View>
));

const RecipeSearch = () => {
  const route = useRoute(); // Access the route parameter passed from the Meals screen
  const { mealType: passedMealType } = route.params || {};
  const [isAlertVisible, setAlertVisible] = useState(false);

  const navigation = useNavigation(); // Hook to navigate to the previous screen

  const { user } = useGlobalContext(); // Getting user context for user ID

  const userId = user?.$id || user?._id;

  console.log('User Context:', userId);

  // State hooks for search query, meal type, and the list of meals
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state for the API request
  const [error, setError] = useState(null); // Error state for the API request
  const [mealType, setMealType] = useState(passedMealType || 'Breakfast'); // Default value for meal type
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Add debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(async () => {
      if (searchQuery) {
        handleSearch();
      }
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchQuery]);

  // Handle search functionality with API request
  const handleSearch = async (pageNum = 1) => {
    if (!searchQuery && pageNum === 1) {
      setFilteredMeals([]);
      return;
    }
  
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
  
    try {
      const response = await fetch(
        `${API_URL}/api/recipes/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=10`
      );
  
      const data = await response.json();
  
      if (response.ok) {
        const filtered = data.recipes.map((recipe) => ({
          id: recipe.recipe_id,
          name: recipe.recipe_name,
          image: recipe.image,
          calories: recipe.calories_per_serving,
          cuisineType: recipe.cuisineType || ['Various'],
          mealType: recipe.mealType || ['Main Course'],
          dishType: recipe.dishType || ['Main'],
          nutrients: {
            carbs: Number(recipe.nutrients?.carbs || 0),
            protein: Number(recipe.nutrients?.protein || 0),
            fat: Number(recipe.nutrients?.fat || 0)
          }
        }));

        setFilteredMeals(pageNum === 1 ? filtered : [...filteredMeals, ...filtered]);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Add load more handler
  const handleLoadMore = () => {
    if (!isLoadingMore && page < totalPages) {
      handleSearch(page + 1);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    console.log('Navigating Back'); // Log when the back button is pressed
    navigation.goBack(); // Use navigation to go back to the previous screen
  };

  // Handle navigation to FoodDetails with item data and mealType
  const handleFoodDetails = (item) => {
    console.log('Navigating to Recipe Details with:', { recipeId: item.id, mealType }); // Update logging
    navigation.navigate('RecipeDetails', { 
      recipeId: item.id, // Change from food_id to id
      mealType 
    });
  };

  const handlePlusIconPress = async (item) => {
    if (!user) {
      console.error('User is not logged in');
      return;
    }
  
    try {
      const nutritionData = {
        calories: item.calories || 0,
        carbs: item.nutrients?.carbs || 0,
        protein: item.nutrients?.protein || 0,
        fats: item.nutrients?.fat || 0,
        servingSize: '1 serving'
      };
  
      const logData = {
        userId,
        foodId: null,
        recipeId: item.id,
        mealType: mealType.toLowerCase(),
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

  // Add a unique key generator function
  const generateUniqueKey = (id, index) => {
    return `recipe-${id}-${index}`;
  };

  const renderRecipeItem = ({ item, index }) => (
    <TouchableOpacity
      key={generateUniqueKey(item.id, index)}
      onPress={() => handleFoodDetails(item)}
      style={{ backgroundColor: '#fff', padding: 16, marginTop: 8, borderRadius: 12, marginHorizontal: 4 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={item.image || 'https://via.placeholder.com/50'}
          style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#000', fontWeight: '600', fontSize: 16 }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{ color: '#4b5563', fontSize: 14 }}>
            {`${Math.round(item.calories)} Cal`}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>
              {item.cuisineType[0]?.charAt(0).toUpperCase() + item.cuisineType[0]?.slice(1)}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              {item.dishType[0]?.charAt(0).toUpperCase() + item.dishType[0]?.slice(1)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>
              P: {Math.round(item.nutrients?.protein)}g
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>
              C: {Math.round(item.nutrients?.carbs)}g
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              F: {Math.round(item.nutrients?.fat)}g
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => handlePlusIconPress(item)}
          style={{ padding: 8 }}
        >
          <Icon name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#e5e7eb' }}>
      {/* Back Button and Dropdown for Meal Type */}
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color="black" style={{ marginRight: 10 }} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10, marginRight: 20 }}>
          <CustomDropdown
            options={['Breakfast', 'Lunch', 'Dinner', 'Snacks']}
            selectedValue={mealType}
            onSelect={(value) => {
              console.log('Meal Type Selected:', value); // Log the selected meal type
              setMealType(value); // Update meal type on selection
            }}
            placeholder="Select Meal Type"
            style={{ width: '80%' }} // Limit the width of the dropdown to 80% of the screen
          />
        </View>
      </View>
      {/* Search Input */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, marginLeft: 10, marginRight: 10 }}>
        <TextInput
          style={{
            backgroundColor: '#fff',
            color: 'black',
            height: 50,
            borderRadius: 20,
            fontSize: 18,
            flex: 1, // Make the input field take up remaining space
            paddingLeft: 35,
            paddingRight: 40, // Give space for the search icon on the right
          }}
          placeholder="Search recipes..."
          placeholderTextColor="black"
          value={searchQuery}
          onChangeText={setSearchQuery} // Update searchQuery directly
        />
        <Ionicons
          name="search"
          size={24}
          color="black"
          style={{ position: 'absolute', right: 20 }} // Position the icon on the right inside the input field
          onPress={handleSearch} // Trigger the handleSearch function when the icon is pressed
        />
      </View>
      {/* Modified loading state to show skeleton */}
      {loading ? (
        <View style={{ flex: 1 }}>
          {[1, 2, 3, 4].map((key) => (
            <RecipeSkeletonItem key={key} />
          ))}
        </View>
      ) : (
        <>
          {error && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: 'red' }}>{error}</Text>
            </View>
          )}
          <CustomAlert
            visible={isAlertVisible}
            onClose={() => setAlertVisible(false)}
            message="Food logged successfully!"
            animation={animationData}
          />
          <FlatList
            data={filteredMeals}
            renderItem={renderRecipeItem}
            keyExtractor={(item, index) => generateUniqueKey(item.id, index)}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              isLoadingMore ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              ) : null
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default RecipeSearch;

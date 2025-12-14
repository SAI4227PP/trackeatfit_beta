import { useNavigation, useRoute } from '@react-navigation/native'; // Import the useNavigation hook
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { default as Icon, default as Ionicons } from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the back arrow
import animationData from '../assets/lottie/Animation - comfirmation.json'; // Use the .lottie file
import CustomAlert from '../components/CustomAlert';
import CustomDropdown from '../components/CustomDropdown'; // Import the CustomDropdown component
import { useGlobalContext } from '../context/GlobalProvider'; // Assuming context is set up
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

// Assume you have the getAllFood function imported

const SearchItemSkeleton = memo(() => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{
      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
      padding: 16,
      marginTop: 8,
      borderRadius: 8,
      marginHorizontal: 4
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
              width: '70%',
              height: 20,
              borderRadius: 4,
              marginBottom: 8
            }} />
            <View style={{
              backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
              width: 20,
              height: 20,
              borderRadius: 10,
              marginLeft: 4
            }} />
          </View>
          <View style={{
            backgroundColor: isDarkMode ? '#4B5563' : '#D1D5DB',
            width: '50%',
            height: 16,
            borderRadius: 4
          }} />
        </View>
        <View style={{
          backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
          width: 24,
          height: 24,
          borderRadius: 12,
          marginLeft: 8
        }} />
      </View>
    </View>
  );
});

const Search = () => {
  const route = useRoute(); // Access the route parameter passed from the Meals screen
  const { mealType: passedMealType } = route.params || {};
  const [isAlertVisible, setAlertVisible] = useState(false);
  const { isDarkMode } = useTheme();

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

  // Add debounce timeout state
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Add new state variables for pagination
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFoodId, setLoadingFoodId] = useState(null); // Add this new state

  // Modified search functionality with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchQuery) {
      setFilteredMeals([]);
      setPage(0);
      setTotalResults(0);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: searchQuery,
            page: 0,
            maxResults: 20 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setFilteredMeals(data.foods.food);
          setTotalResults(parseInt(data.foods.total_results));
          setPage(0);
        } else {
          setError(data.error || 'Something went wrong');
        }
      } catch (err) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }, 500); // Wait 500ms after user stops typing

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchQuery]);

  // Add loadMore function
  const loadMore = async () => {
    if (loadingMore || filteredMeals.length >= totalResults) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          page: nextPage,
          maxResults: 20 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFilteredMeals(prev => [...prev, ...data.foods.food]);
        setPage(nextPage);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    console.log('Navigating Back'); // Log when the back button is pressed
    navigation.goBack(); // Use navigation to go back to the previous screen
  };

  // Handle navigation to FoodDetails with item data and mealType
  const handleFoodDetails = (item) => {
    console.log('Navigating to FoodDetails with item:', item.food_id, 'and mealType:', mealType); // Log the item and mealType being passed
    navigation.navigate('FoodDetails', { foodId: item.food_id, mealType }); // Pass ID, title, and mealType
  };

  // Handle action for + icon (for example, adding a meal)
const handlePlusIconPress = async (foodId) => {
  if (!user) {
    console.error('User is not logged in');
    return; // If user is not logged in, prevent the operation
  }

  setLoadingFoodId(foodId); // Set loading state for this specific food item

  try {
    console.log('Plus Icon Pressed for foodId:', foodId);
    console.log('Meal Type:', mealType);

    // First fetch nutrition data
    const foodDetailResponse = await fetch(`${API_URL}/get-food-by-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ foodId }),
    });

    if (!foodDetailResponse.ok) {
      throw new Error('Failed to fetch food details');
    }

    const foodData = await foodDetailResponse.json();
    const servingData = foodData.food.servings.serving;
    // Use the first serving if array, otherwise use the single serving
    const serving = Array.isArray(servingData) ? servingData[0] : servingData;

    // Format mealType to match the enum values in the model
    const formattedMealType = mealType.toLowerCase();
    
    // Now send both food and nutrition data
    const response = await fetch(`${API_URL}/logged-food/loggedFood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        foodId,
        recipeId: null,
        mealType: formattedMealType,
        entryId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nutrition: {
          calories: parseFloat(serving.calories || 0),
          carbs: parseFloat(serving.carbohydrate || 0),
          protein: parseFloat(serving.protein || 0),
          fats: parseFloat(serving.fat || 0),
          servingSize: serving.serving_description || '1 serving'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error logging food:', errorData); // Log the error message from backend
      throw new Error('Failed to log food');
    }

    const data = await response.json();
    console.log('Logged Food successfully:', data); // Log success response from backend
    setAlertVisible(true); // Set the alert visible after a successful action
  } catch (error) {
    console.error('Error Logging Food:', error.message || error);
  } finally {
    setLoadingFoodId(null); // Clear loading state
  }
};

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleFoodDetails(item)}
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        padding: 15,
        marginTop: 10,
        borderRadius: 10,
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left side content remains the same */}
        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* ...existing title and description... */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              className={`${isDarkMode ? 'text-white' : 'text-black'} font-semibold`}
              style={{
                width: '80%', // Set width to 80%
                wordWrap: 'break-word', // Allows the text to break into a second line if necessary
              }}
            >
              {item.food_name}
            </Text>

            <Icon name="shield-checkmark-outline" size={20} color="#80EE98" style={{ marginLeft: 5 }} />
          </View>
          {/* Calories and Serving Size below */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text className={isDarkMode ? 'text-white' : 'text-black'}>{item.food_description.replace(/\s*\|.*$/, '')}</Text>
          </View>
        </View>

        {/* Updated Plus Icon with loading state */}
        <TouchableOpacity 
          onPress={() => handlePlusIconPress(item.food_id)} 
          style={{ marginLeft: 10, marginRight: 4 }}
          disabled={loadingFoodId === item.food_id}
        >
          {loadingFoodId === item.food_id ? (
            <ActivityIndicator size="small" color={isDarkMode ? "white" : "#000"} />
          ) : (
            <Icon name="add" size={26} color={isDarkMode ? "white" : "black"} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111827' : '#E5E7EB'
    }}>


      {/* Back Button and Dropdown for Meal Type */}
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
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
            backgroundColor: isDarkMode ? '#1f2937' : '#fff',
            color: isDarkMode ? 'white' : 'black',
            height: 50,
            borderRadius: 20,
            fontSize:18,
            flex: 1, // Make the input field take up remaining space
            paddingLeft: 35,
            paddingRight: 40, // Give space for the search icon on the right
          }}
          placeholder="Search meals..."
          placeholderTextColor={isDarkMode ? 'white' : 'black'}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setIsSearchActive(text.length > 0);
          }}
          onFocus={() => setIsSearchActive(true)}
          // Only hide cards if there's no text when blurring
          onBlur={() => !searchQuery && setIsSearchActive(false)}
        />
        <Ionicons
          name="search"
          size={24}
          color={isDarkMode ? "white" : "black"}
          style={{ position: 'absolute', right: 20 }} // Position the icon on the right inside the input field
        />
      </View>

      {/* Scan and Image Options Cards */}
      {!isSearchActive && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          {/* Image Upload Card */}
          <TouchableOpacity 
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#fff',
              padding: 16,
              borderRadius: 8,
              width: '48%',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5
            }}
            onPress={() => navigation.navigate('Camera', { mode: 'upload' })}
          >
            <Ionicons name="image-outline" size={24} color={isDarkMode ? "white" : "#000"} />
            <Text style={{ 
              marginTop: 8,
              color: isDarkMode ? '#fff' : '#000',
              fontSize: 12
            }}>Upload Image</Text>
          </TouchableOpacity>

          {/* Take Photo Card */}
          <TouchableOpacity 
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#fff',
              padding: 16,
              borderRadius: 8,
              width: '48%',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5
            }}
            onPress={() => navigation.navigate('Camera', { mode: 'camera' })}
          >
            <Ionicons name="camera-outline" size={24} color={isDarkMode ? "white" : "#000"} />
            <Text style={{ 
              marginTop: 8,
              color: isDarkMode ? '#fff' : '#000',
              fontSize: 12
            }}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, padding: 10 }}>
          {[1, 2, 3, 4, 5].map((key) => (
            <SearchItemSkeleton key={key} />
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

          {/* List of Search Results */}
          <FlatList
            data={filteredMeals}
            renderItem={renderItem}
            keyExtractor={(item) => item.food_id} // Use Document ID as the unique key
            showsVerticalScrollIndicator={false} // Disable the vertical scroll indicator
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              loadingMore ? (
                <View style={{ padding: 10 }}>
                  {[1, 2].map((key) => (
                    <SearchItemSkeleton key={`loading-more-${key}`} />
                  ))}
                </View>
              ) : null
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default Search;


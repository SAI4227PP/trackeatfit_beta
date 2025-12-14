import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import animationData from '../assets/lottie/Animation - comfirmation.json';
import CustomAlert from '../components/CustomAlert';
import CustomDropdown from '../components/CustomDropdown';
import { useGlobalContext } from '../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

const { width } = Dimensions.get('window');

const CameraScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode = 'capture' } = route.params || {};
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mealType, setMealType] = useState('Breakfast');
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [loadingFoodId, setLoadingFoodId] = useState(null);
  const [isLoggingAll, setIsLoggingAll] = useState(false);
  const [loggedItems, setLoggedItems] = useState(new Set());
  const { user } = useGlobalContext();
  const userId = user?.$id || user?._id;

  useEffect(() => {
    checkCameraPermission();
  }, []);

  useEffect(() => {
    if (mode === 'upload') {
      pickImage();
    }
  }, []);

  const checkCameraPermission = async () => {
    try {
      const cameraStatus = await AsyncStorage.getItem('cameraPermission');
      setHasCameraPermission(cameraStatus === 'granted');
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      
      if (granted) {
        await AsyncStorage.setItem('cameraPermission', 'granted');
        setHasCameraPermission(true);
        return true;
      }

      Alert.alert(
        'Permission Required',
        'Please enable camera access in settings to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              await Linking.openSettings();
            }
          }
        ]
      );
      return false;
    } catch (error) {
      console.error('Error handling camera permission:', error);
      return false;
    }
  };

  const handleImageCapture = async (imageResult) => {
    if (!imageResult.canceled && imageResult.assets && imageResult.assets[0]) {
      const image = imageResult.assets[0];
      setCapturedImage(image);
      await processImage(image.uri);
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = hasCameraPermission || await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: false, // Remove editing step
        aspect: [4, 3],
      });

      await handleImageCapture(result);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: true, // Keep editing for gallery picks as users might want to crop those
        aspect: [4, 3],
      });

      if (!result.canceled) {
        await handleImageCapture(result);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      navigation.goBack();
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRecognitionResult(null);
    setErrorMessage(null);
    setSearchResults([]);
  };

  const searchFoodItems = async (items) => {
    try {
      setSearchLoading(true);
      console.log('Searching for items:', items); // Debug log

      const promises = items.map(async (item) => {
        const searchBody = {
          query: item.trim(),
          page: 0,
          maxResults: 1
        };
        console.log('Search request for:', item, searchBody); // Debug log

        const response = await fetch(`${API_URL}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchBody),
        });

        const data = await response.json();
        console.log('Search response for:', item, data); // Debug log

        // Handle both array and single item responses
        const foodItem = data.foods?.food;
        if (!foodItem) return null;

        const bestMatch = Array.isArray(foodItem) ? foodItem[0] : foodItem;
        return bestMatch ? {
          ...bestMatch,
          detectedAs: item.trim()
        } : null;
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(Boolean);
      console.log('Final results:', validResults); // Debug log
      
      setSearchResults(validResults);
    } catch (error) {
      console.error('Search Error:', error);
      setErrorMessage('Failed to search food items');
    } finally {
      setSearchLoading(false);
    }
  };

  const processImage = async (imageUri) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      const apiKey = "AIzaSyAp1HYxY8xgTDzW5TsPcB2C4qfGvCet_n0";
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

      // Convert image to base64
      const imageResponse = await fetch(imageUri);
      const blob = await imageResponse.blob();
      const reader = new FileReader();
      const base64data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Prepare the image part correctly
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64data.split(',')[1]
        }
      };

      // Updated prompt for better food detection
      const parts = [
        { text: "Analyze this image for food items only. If you see food items, list them in a comma-separated format. If there are no food items, respond with 'NO_FOOD_ITEMS'." },
        imagePart
      ];

      const result = await model.generateContent(parts);
      const aiResponse = await result.response;
      const responseText = aiResponse.text().trim();

      // Check for no food items response
      if (responseText === 'NO_FOOD_ITEMS' || responseText.toLowerCase().includes('no food items')) {
        setErrorMessage('No food items detected in this image');
        setRecognitionResult(null);
        return null;
      }

      // Process food items
      const itemsList = responseText
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0 && !item.toLowerCase().includes('no food'));

      if (itemsList.length === 0) {
        setErrorMessage('No food items detected in the image');
        setRecognitionResult(null);
        return null;
      }

      setRecognitionResult({ items: itemsList });
      await searchFoodItems(itemsList);
      return { items: itemsList };

    } catch (error) {
      console.error('Process Image Error:', error);
      setErrorMessage(error.message || 'Failed to process image');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;
    try {
      setIsProcessing(true);
      const results = await processImage(capturedImage.uri);
      if (results) {
        setRecognitionResult(results);
        setErrorMessage(null);
      } else {
        setErrorMessage('No results found. Please try again.');
      }
    } catch (error) {
      console.error('Confirmation Error:', error);
      setErrorMessage(error.message || 'Failed to process image');
      setRecognitionResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogMeal = async (foodItem) => {
    if (!user) {
      setErrorMessage('User is not logged in');
      return;
    }

    setLoadingFoodId(foodItem.food_id);
    try {
      // Fetch nutrition data
      const foodDetailResponse = await fetch(`${API_URL}/get-food-by-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodId: foodItem.food_id }),
      });

      if (!foodDetailResponse.ok) throw new Error('Failed to fetch food details');

      const foodData = await foodDetailResponse.json();
      const servingData = foodData.food.servings.serving;
      const serving = Array.isArray(servingData) ? servingData[0] : servingData;

      // Log the meal
      const response = await fetch(`${API_URL}/logged-food/loggedFood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          foodId: foodItem.food_id,
          recipeId: null,
          mealType: mealType.toLowerCase(),
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

      if (!response.ok) throw new Error('Failed to log food');

      setLoggedItems(prev => new Set([...prev, foodItem.food_id]));
      setAlertVisible(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingFoodId(null);
    }
  };

  const handleLogAllMeals = async () => {
    if (!user) {
      setErrorMessage('User is not logged in');
      return;
    }

    setIsLoggingAll(true);
    try {
      // Process all food items sequentially
      const newLoggedItems = new Set(loggedItems);
      for (const item of searchResults) {
        // Fetch nutrition data
        const foodDetailResponse = await fetch(`${API_URL}/get-food-by-id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ foodId: item.food_id }),
        });

        if (!foodDetailResponse.ok) continue; // Skip if error, continue with next item

        const foodData = await foodDetailResponse.json();
        const servingData = foodData.food.servings.serving;
        const serving = Array.isArray(servingData) ? servingData[0] : servingData;

        // Log the meal
        await fetch(`${API_URL}/logged-food/loggedFood`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            foodId: item.food_id,
            recipeId: null,
            mealType: mealType.toLowerCase(),
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
        newLoggedItems.add(item.food_id);
      }
      setLoggedItems(newLoggedItems);
      setAlertVisible(true);
    } catch (error) {
      setErrorMessage('Failed to log all items');
    } finally {
      setIsLoggingAll(false);
    }
  };

  const areAllItemsLogged = () => {
    return searchResults.every(item => loggedItems.has(item.food_id));
  };

  return (
    <LinearGradient 
      colors={['#f8f9fa', '#e9ecef']} 
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Fixed Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity 
              onPress={handleBack}
              style={{ 
                backgroundColor: 'white',
                borderRadius: 9999,
                padding: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#2563eb" />
            </TouchableOpacity>
            <Text style={{ 
              fontSize: 20,
              fontWeight: '600',
              marginLeft: 16,
              color: '#1f2937'
            }}>
              {mode === 'upload' ? 'Upload Image' : 'Take Photo'}
            </Text>
          </View>
          
          {capturedImage && (
            <TouchableOpacity 
              onPress={handleRetake}
              disabled={isProcessing}
              style={{ 
                backgroundColor: 'white',
                borderRadius: 9999,
                padding: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                marginLeft: 16
              }}
            >
              <Ionicons 
                name="camera-reverse" 
                size={24} 
                color={isProcessing ? "#9ca3af" : "#2563eb"} 
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {errorMessage && (
            <View style={{
              backgroundColor: '#fef2f2',
              padding: 16,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              borderWidth: 1,
              borderColor: '#fecaca',
              marginBottom: 16
            }}>
              <Text style={{ color: '#dc2626', textAlign: 'center', fontWeight: '500' }}>
                {errorMessage}
              </Text>
              <TouchableOpacity 
                style={{ marginTop: 8 }} 
                onPress={() => setErrorMessage(null)}
              >
                <Text style={{ color: '#991b1b', textAlign: 'center', fontWeight: '500' }}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {capturedImage ? (
            <View>
              <View style={{
                width: '100%',
                aspectRatio: 4/3,
                backgroundColor: 'white',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                overflow: 'hidden',
                marginBottom: 16
              }}>
                <Image
                  source={{ uri: capturedImage.uri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {isProcessing && (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={{ color: 'white', marginTop: 8, fontWeight: '500' }}>
                      Analyzing...
                    </Text>
                  </View>
                )}
              </View>

              {/* Detected Items Section */}
              {recognitionResult && (
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1f2937' }}>Detected Items</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {recognitionResult.items.map((item, index) => (
                      <View key={index} style={{ backgroundColor: '#eff6ff', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6, margin: 4 }}>
                        <Text style={{ color: '#2563eb', fontWeight: '500', fontSize: 14 }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Database Results Section */}
              {recognitionResult && (
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, marginBottom: 16 }}>
                  <View style={{ marginBottom: 16 }}>
                    <CustomDropdown
                      options={['Breakfast', 'Lunch', 'Dinner', 'Snacks']}
                      selectedValue={mealType}
                      onSelect={setMealType}
                      placeholder="Select Meal Type"
                    />
                  </View>
                  {searchLoading ? (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <ActivityIndicator size="large" color="#2563eb" />
                      <Text style={{ color: '#4b5563', marginTop: 8 }}>Searching database...</Text>
                    </View>
                  ) : searchResults && searchResults.length > 0 ? (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937' }}>Best Matches Found</Text>
                        <TouchableOpacity
                          onPress={handleLogAllMeals}
                          disabled={isLoggingAll || areAllItemsLogged()}
                          style={{ 
                            borderRadius: 12, 
                            paddingHorizontal: 16, 
                            paddingVertical: 8, 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            backgroundColor: isLoggingAll || areAllItemsLogged() ? '#d1fae5' : '#2563eb'
                          }}
                        >
                          {isLoggingAll ? (
                            <>
                              <ActivityIndicator size="small" color="white" />
                              <Text style={{ color: 'white', marginLeft: 8 }}>Logging...</Text>
                            </>
                          ) : areAllItemsLogged() ? (
                            <>
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                              <Text style={{ color: 'white', marginLeft: 8 }}>All Logged</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="add-circle" size={20} color="white" />
                              <Text style={{ color: 'white', marginLeft: 8 }}>Log All</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                      <View>
                        {searchResults.map((item, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={{ 
                              backgroundColor: '#f9fafb', 
                              padding: 16, 
                              marginBottom: 12, 
                              borderRadius: 12, 
                              borderWidth: 1, 
                              borderColor: '#e5e7eb',
                              opacity: loggedItems.has(item.food_id) ? 0.5 : 1
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text style={{ color: '#2563eb', fontWeight: '500', fontSize: 12 }}>
                                Detected as: {item.detectedAs}
                              </Text>
                              {loggedItems.has(item.food_id) ? (
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                              ) : (
                                <TouchableOpacity
                                  onPress={() => handleLogMeal(item)}
                                  disabled={loadingFoodId === item.food_id || loggedItems.has(item.food_id)}
                                >
                                  {loadingFoodId === item.food_id ? (
                                    <ActivityIndicator size="small" color="#2563eb" />
                                  ) : (
                                    <Ionicons name="add-circle" size={24} color="#2563eb" />
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{item.food_name}</Text>
                            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{item.food_description}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    <View style={{ paddingVertical: 16 }}>
                      <Text style={{ textAlign: 'center', color: '#6b7280' }}>Processing detected items...</Text>
                      <Text style={{ textAlign: 'center', color: '#4b5563', fontSize: 12, marginTop: 4 }}>
                        {recognitionResult.items.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80
            }}>
              <TouchableOpacity 
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 32,
                  backgroundColor: 'white',
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  width: '80%'
                }}
                onPress={mode === 'upload' ? pickImage : takePhoto}
              >
                <View style={{
                  backgroundColor: '#eff6ff',
                  padding: 16,
                  borderRadius: 9999,
                  marginBottom: 16
                }}>
                  <Ionicons 
                    name={mode === 'upload' ? "images" : "camera"} 
                    size={40} 
                    color="#2563eb" 
                  />
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '500',
                  color: '#1f2937'
                }}>
                  Tap to {mode === 'upload' ? 'select image' : 'take photo'}
                </Text>
                <Text style={{
                  color: '#6b7280',
                  textAlign: 'center',
                  marginTop: 8
                }}>
                  {mode === 'upload' ? 'Choose a photo from your gallery' : 'Take a photo of your food'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        <CustomAlert
          visible={isAlertVisible}
          onClose={() => setAlertVisible(false)}
          message="Food logged successfully!"
          animation={animationData}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CameraScreen;

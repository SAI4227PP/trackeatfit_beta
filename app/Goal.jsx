import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const GoalItem = ({ label, value, icon, onPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowOpacity: 0.1,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 }
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#065f46' : '#ecfdf5',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons name={icon} size={20} color={isDarkMode ? '#34d399' : '#059669'} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 14 }}>{label}</Text>
              <Text style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontSize: 18, fontWeight: 'bold' }}>{value}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={isDarkMode ? '#d1d5db' : '#374151'} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const Goal = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  // State management
  const [isModalVisible, setModalVisible] = useState(false);
  const { user } = useGlobalContext(); // Getting user context for user ID

  const userId = user?.$id || user?._id;

  const [netCalories, setNetCalories] = useState(2400); // Default Net Calories
  const [macronutrients, setMacronutrients] = useState({
    carbohydrates: 250,
    protein: 120,
    fat: 80,
    carbsPercentage: 50,
    proteinPercentage: 25,
    fatPercentage: 25,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Toggle Modal visibility
  const toggleModal = useCallback(() => {
    setModalVisible((prev) => !prev);
  }, []);

  // Create an array of calorie values from 1500 to 3500 (step 100)
  const calorieOptions = useMemo(() => {
    const options = [];
    for (let i = 1500; i <= 3500; i += 100) {
      options.push(i);
    }
    return options;
  }, []);

  // Handle selecting a new calories goal
  const handleSelectCalories = useCallback(async (value) => {
    setNetCalories(value);
    setModalVisible(false);

    if (userId) {
      try {
        const response = await fetch(`${API_URL}/user-goals/update-calories/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ calories: value }),
        });

        if (!response.ok) {
          throw new Error('Failed to update calories goal.');
        }

        console.log('User calories goal updated successfully!');
      } catch (error) {
        console.error('Error updating user calories goal:', error);
        setError('Failed to update calories goal.');
      }
    } else {
      console.error('User not authenticated.');
      setError('User is not authenticated.');
    }
  }, [userId]);

  // Render Item with dynamic scaling for the middle item
  const renderItem = useCallback(({ item, index }) => {
    const scale = index === Math.floor(calorieOptions.length / 2) ? 1.2 : 0.9;
    const opacity = index === Math.floor(calorieOptions.length / 2) ? 1 : 0.5;

    return (
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <TouchableOpacity
          onPress={() => handleSelectCalories(item)}
          accessible={true}
          accessibilityLabel={`Select ${item} calorie goal`}
          style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#FFFFFF' : 'gray', alignItems: 'center' }}
        >
          <Text style={{ color: isDarkMode ? 'white' : 'black', fontSize: 18, textAlign: 'center' }}>{item} kcal</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleSelectCalories, calorieOptions, isDarkMode]);

  // Fetch user-specific macronutrient data and calorie goal when the component mounts
  useEffect(() => {
    const fetchUserGoals = async () => {
      if (!userId) {
        setError('User ID is missing or invalid.');
        setLoading(false);
        return;
      }

      try {
        // Fetch macronutrient data
        const response = await fetch(
          `${API_URL}/macronutrient/get-macronutrient-data/${userId}`
        );
        const data = await response.json();
        console.log('Fetched data:', data); // Log the data response

        // Check if the response is successful and contains the expected data
        if (response.ok && data.data) {
          const userGoal = data.data; // Access the first item if available
          setMacronutrients({
            carbohydrates: parseFloat(userGoal.carbsWeight) || 250,
            protein: parseFloat(userGoal.proteinsWeight) || 120,
            fat: parseFloat(userGoal.fatsWeight) || 80,
            carbsPercentage: userGoal.carbsPercentage || 50,
            proteinPercentage: userGoal.proteinsPercentage || 25,
            fatPercentage: userGoal.fatsPercentage || 25,
          });

          // Fetch calories goal
          const calorieResponse = await fetch(`${API_URL}/user-goals/get-calories/${userId}`);
          const calorieData = await calorieResponse.json();
          setNetCalories(calorieData.calories || 2400);
        } else {
          console.log('No macronutrient data found for user. Using defaults.');
          setMacronutrients({
            carbohydrates: 250,
            protein: 120,
            fat: 80,
            carbsPercentage: 25,
            proteinPercentage: 25,
            fatPercentage: 25,
          });
          setNetCalories(2400);
        }
      } catch (error) {
        console.error('Error fetching user goals:', error);
        setError('Failed to fetch data. Using defaults.');
        setMacronutrients({
          carbohydrates: 250,
          protein: 120,
          fat: 80,
          carbsPercentage: 25,
          proteinPercentage: 25,
          fatPercentage: 25,
        });
        setNetCalories(2400);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGoals();
  }, [userId]);

  // Navigate to the Micronutrients screen
  const handleNavigateToMicronutrients = useCallback(() => {
    navigation.navigate('Micronutrients');
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }}>
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{ shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{
                padding: 8,
                backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
                borderRadius: 20,
                marginRight: 12,
                shadowOpacity: 0.1,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 }
              }}
            >
              <Icon name="arrow-back" size={24} color={isDarkMode ? '#d1d5db' : '#374151'} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '500' }}>Settings</Text>
              <Text style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontSize: 20, fontWeight: 'bold' }}>Nutrition Goals</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={isDarkMode ? '#34d399' : '#059669'} />
          </View>
        ) : error ? (
          <View style={{ 
            padding: 16, 
            backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2', 
            borderRadius: 12, 
            marginBottom: 16 
          }}>
            <Text style={{ color: isDarkMode ? '#fecaca' : '#dc2626', textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>Daily Target</Text>
              <GoalItem
                label="Daily Calorie Goal"
                value={`${netCalories} kcal`}
                icon="flame-outline"
                onPress={toggleModal}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>Macronutrient Goals</Text>
              <GoalItem
                label="Carbohydrates"
                value={`${macronutrients.carbohydrates}g (${macronutrients.carbsPercentage}%)`}
                icon="leaf-outline"
                onPress={handleNavigateToMicronutrients}
              />
              <GoalItem
                label="Protein"
                value={`${macronutrients.protein}g (${macronutrients.proteinPercentage}%)`}
                icon="fitness-outline"
                onPress={handleNavigateToMicronutrients}
              />
              <GoalItem
                label="Fat"
                value={`${macronutrients.fat}g (${macronutrients.fatPercentage}%)`}
                icon="water-outline"
                onPress={handleNavigateToMicronutrients}
              />
            </View>
          </>
        )}
      </View>

      <Modal
        transparent={true}
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <LinearGradient
            colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
            style={{
              width: '90%',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: isDarkMode ? '#f9fafb' : '#111827', fontSize: 20, fontWeight: 'bold' }}>Set Calorie Goal</Text>
              <TouchableOpacity 
                onPress={toggleModal}
                style={{
                  padding: 8,
                  backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
                  borderRadius: 20
                }}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#d1d5db' : '#374151'} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={calorieOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              style={{ height: 240, marginBottom: 16 }}
              initialScrollIndex={Math.floor(calorieOptions.length / 2)}
              getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
            />

            <TouchableOpacity
              onPress={toggleModal}
              style={{
                backgroundColor: isDarkMode ? '#047857' : '#059669',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>Done</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Goal;

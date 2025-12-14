import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit'; // Import the PieChart component
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LoggedFoodCard from '../../components/LoggedFoodCard';
import { useCaloriesContext } from '../../context/CaloriesContext';
import { useGlobalContext } from '../../context/GlobalProvider'; // Assuming context is setup
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const Meals = () => {
  const navigation = useNavigation(); // Get the navigation object
  const { isDarkMode } = useTheme();

  // State for handling modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0); // State to store total calories
  const [loading, setLoading] = useState(true);
  const { user, updateUserStreak } = useGlobalContext(); // Add updateUserStreak
  const [dragDistance, setDragDistance] = useState(0);  // Track drag distance
  const { goalCalories } = useCaloriesContext();
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [isWaterModalVisible, setIsWaterModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [waterAmount, setWaterAmount] = useState(0);
  const [note, setNote] = useState('');
  const userId = user?.$id || user?._id;
  const [error, setError] = useState('');

  // Define your data here
  const foodCalories = totalCalories; // Example calories consumed (should use totalCalories here)
  const exerciseCalories = 0; // Example calories burned

  const baseCalories = goalCalories ?? 2400;

  const remainingCalories = Math.max(0, baseCalories - (foodCalories - exerciseCalories)); // Cap at 0

  const { setGoalCalories, setFoodCalories, setExerciseCalories, setRemainingCalories } = useCaloriesContext();

  useEffect(() => {
    // Assuming you have these values calculated somewhere in your component
    setGoalCalories(baseCalories);
    setFoodCalories(foodCalories);
    setExerciseCalories(exerciseCalories);
    setRemainingCalories(remainingCalories);
  }, [totalCalories, setGoalCalories, setFoodCalories, setExerciseCalories, setRemainingCalories]);

  // Handle search input or icon click
  const handleSearchClick = () => {
    navigation.navigate('Search'); // Navigate to Search screen
  };

  // Handle opening and closing the modal
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible); // Toggle modal visibility
  };

  // Handle each of the icon clicks for redirection
  const handleNutrition = () => {
    navigation.navigate('Nutrition'); // Navigate to different screens based on icon clicked
  };

  const handlestreakClick = () => {
    setShowStreakInfo(true);
  };

  // Modal options data
  const modalOptions = [
    { id: 'editMeals', label: 'Edit Meals', iconName: 'create-outline' },
    { id: 'completeMeal', label: 'Complete Meal', iconName: 'checkmark-circle-outline' },
    { id: 'addWater', label: 'Add Water', iconName: 'water-outline' },
    { id: 'addNote', label: 'Add Note', iconName: 'document-text-outline' },
    { id: 'settings', label: 'Settings', iconName: 'settings-outline' }
  ];

  // Handle each option click in the modal
  const handleOptionClick = (option) => {
    switch (option) {
      case 'editMeals':
        navigation.navigate('EditMealCard'); // Navigate to Edit Meals screen
        break;
      case 'completeMeal':
        navigation.navigate('Meals_complete', {
          totalCalories: foodCalories, // Replace with actual food calories data
          userCalories: goalCalories,  // Replace with actual user calories goal
        }); // Navigate to Complete Meals screen
        break;
      case 'addWater':
        setIsWaterModalVisible(true);
        break;
      case 'addNote':
        setIsNoteModalVisible(true);
        break;
      case 'settings':
        navigation.navigate('Home/preferences/notifications'); // Navigate to Settings screen
        break;
      default:
        break;
    }
    setIsModalVisible(false); // Close the modal after selecting an option
  };

  const handleSaveWater = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/logged-food/add-water/${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: waterAmount })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save water intake');
      }

      const data = await response.json();
      if (data.success) {
        setIsWaterModalVisible(false);
        setWaterAmount(0);
        setError('');
      } else {
        throw new Error(data.error || 'Failed to save water intake');
      }
    } catch (error) {
      console.error('Error saving water:', error);
      setError(error.message || 'Failed to save water intake');
    }
  };

  const handleSaveNote = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (!note.trim()) {
      setError('Note cannot be empty');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/logged-food/add-note/${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: note.trim() })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const data = await response.json();
      if (data.success) {
        setIsNoteModalVisible(false);
        setNote('');
        setError('');
      } else {
        throw new Error(data.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError(error.message || 'Failed to save note');
    }
  };

  const renderStreakInfoModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showStreakInfo}
      onRequestClose={() => setShowStreakInfo(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowStreakInfo(false)}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TouchableWithoutFeedback>
            <View style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              margin: 16,
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 400
            }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{
                  backgroundColor: '#FEF3C7',
                  padding: 16,
                  borderRadius: 9999,
                  marginBottom: 16
                }}>
                  <Ionicons name="flash" size={32} color="#D97706" />
                </View>
                <Text style={{
                  color: isDarkMode ? '#F9FAFB' : '#111827',
                  fontSize: 24,
                  fontWeight: '700',
                  marginBottom: 8
                }}>Daily Streak</Text>
                <Text style={{
                  color: isDarkMode ? '#D1D5DB' : '#374151',
                  textAlign: 'center'
                }}>
                  Keep your streak going by logging your meals daily!
                </Text>
              </View>

              <View style={{ marginBottom: 24 }}>
                {[
                  { day: 1, text: 'Log your meals daily to build your streak' },
                  { day: 7, text: 'Maintain 7-day streak for 20% XP bonus' },
                  { day: '🎉', text: 'Earn rewards and level up faster' }
                ].map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      backgroundColor: '#FEF3C7',
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{
                        color: '#D97706',
                        fontWeight: '700'
                      }}>{item.day}</Text>
                    </View>
                    <Text style={{
                      color: isDarkMode ? '#D1D5DB' : '#374151',
                      flex: 1
                    }}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: '#FEF3C7',
                borderRadius: 16
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{
                      color: isDarkMode ? '#D1D5DB' : '#111827',
                      fontWeight: '700'
                    }}>Current Streak</Text>
                    <Text style={{
                      color: '#D97706',
                      fontSize: 28,
                      fontWeight: '700'
                    }}>{user?.streak || 0} days</Text>
                  </View>
                  {user?.streak >= 7 && (
                    <View style={{
                      backgroundColor: '#FEF3C7',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 9999
                    }}>
                      <Text style={{
                        color: '#D97706',
                        fontWeight: '600'
                      }}>+20% XP Active</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowStreakInfo(false)}
                style={{ marginTop: 24 }}
              >
                <LinearGradient
                  colors={['#D97706', '#B45309']}
                  style={{
                    borderRadius: 9999,
                    paddingVertical: 12
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontWeight: '700'
                  }}>Got it!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderWaterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isWaterModalVisible}
      onRequestClose={() => setIsWaterModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setIsWaterModalVisible(false)}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TouchableWithoutFeedback>
            <View style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              margin: 16,
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 400
            }}>
              <Text style={{
                color: isDarkMode ? '#F9FAFB' : '#111827',
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 16
              }}>Add Water</Text>
              
              {error ? (
                <Text style={{
                  color: '#EF4444',
                  marginBottom: 16
                }}>{error}</Text>
              ) : null}
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
              }}>
                <TouchableOpacity
                  onPress={() => setWaterAmount(Math.max(0, waterAmount - 250))}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                    padding: 12,
                    borderRadius: 9999
                  }}
                >
                  <Ionicons name="remove" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                </TouchableOpacity>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    fontSize: 32,
                    fontWeight: '700'
                  }}>
                    {waterAmount}
                  </Text>
                  <Text style={{
                    color: isDarkMode ? '#D1D5DB' : '#6B7280'
                  }}>ml</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setWaterAmount(waterAmount + 250)}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                    padding: 12,
                    borderRadius: 9999
                  }}
                >
                  <Ionicons name="add" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSaveWater}
                style={{
                  marginTop: 16,
                  borderRadius: 9999,
                  overflow: 'hidden'
                }}
              >
                <LinearGradient
                  colors={['#0EA5E9', '#0284C7']}
                  style={{
                    borderRadius: 9999,
                    paddingVertical: 12
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontWeight: '700'
                  }}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderNoteModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isNoteModalVisible}
      onRequestClose={() => setIsNoteModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setIsNoteModalVisible(false)}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TouchableWithoutFeedback>
            <View style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              margin: 16,
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 400
            }}>
              <Text style={{
                color: isDarkMode ? '#F9FAFB' : '#111827',
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 16
              }}>Add Note</Text>
              
              {error ? (
                <Text style={{
                  color: '#EF4444',
                  marginBottom: 16
                }}>{error}</Text>
              ) : null}

              <TextInput
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                  color: isDarkMode ? '#FFFFFF' : '#111827',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                  maxHeight: 120,
                  textAlignVertical: 'top'
                }}
                placeholder="Write your note here..."
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity
                onPress={handleSaveNote}
                style={{
                  marginTop: 16,
                  borderRadius: 9999,
                  overflow: 'hidden'
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={{
                    borderRadius: 9999,
                    paddingVertical: 12
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontWeight: '700'
                  }}>Save Note</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const commonStyles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1F2937' : '#E5E7EB',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      margin: 16,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderRadius: 9999,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 16,
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={commonStyles.header}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={handleSearchClick}
              style={commonStyles.searchBar}
            >
              <Ionicons name="search" size={20} color={isDarkMode ? '#FFFFFF' : '#6B7280'} />
              <Text style={{ 
                color: isDarkMode ? '#F9FAFB' : '#6B7280',
                marginLeft: 8 
              }}>Search for meals...</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity 
                style={{ alignItems: 'center' }}
                onPress={handlestreakClick}
              >
                <View style={[
                  commonStyles.iconContainer,
                  { backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.3)' : '#FEF3C7' }
                ]}>
                  <Ionicons name="flash" size={20} color={isDarkMode ? '#FCD34D' : '#D97706'} />
                </View>
                <View style={{
                  backgroundColor: isDarkMode ? '#374151' : '#FEF3C7',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  marginTop: 4
                }}>
                  <Text style={{
                    color: isDarkMode ? '#FCD34D' : '#D97706',
                    fontWeight: '600',
                    fontSize: 12
                  }}>
                    {user?.streak || 0}🔥
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5'
                }}
                onPress={handleNutrition}
              >
                <Ionicons name="pie-chart" size={20} color={isDarkMode ? '#34D399' : '#059669'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? '#374151' : '#F9FAFB'
                }}
                onPress={toggleModal}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? '#D1D5DB' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Calories Overview Section */}
        <View style={{
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          padding: 16,
          borderRadius: 16,
          marginBottom: 16
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{
              color: isDarkMode ? '#F9FAFB' : '#111827',
              fontSize: 20,
              fontWeight: '700'
            }}>Calories Overview</Text>
            <TouchableOpacity 
              onPress={handleNutrition}
              style={{
                backgroundColor: '#D1FAE5',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999
              }}
            >
              <Text style={{
                color: '#059669',
                fontWeight: '500',
                fontSize: 14
              }}>Details</Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Pie Chart */}
          <View style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16
          }}>
            <PieChart
              data={[
                {
                  name: 'Remaining',
                  population: remainingCalories > 0 ? remainingCalories : 0, // Ensure non-negative for pie chart
                  color: '#4F46E5',
                  legendFontColor: isDarkMode ? '#FFFFFF' : '#374151',
                  legendFontSize: 12,
                },
                {
                  name: 'Consumed',
                  population: foodCalories,
                  color: foodCalories > baseCalories ? '#EF4444' : '#10B981', // Red if exceeded, green otherwise
                  legendFontColor: isDarkMode ? '#FFFFFF' : '#374151',
                  legendFontSize: 12,
                }
              ]}
              width={Dimensions.get('window').width - 56}
              height={200}
              chartConfig={{
                backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
                backgroundGradientFrom: isDarkMode ? '#1F2937' : '#ffffff',
                backgroundGradientTo: isDarkMode ? '#1F2937' : '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => isDarkMode ? `rgba(209, 213, 219, ${opacity})` : `rgba(55, 65, 81, ${opacity})`,
                labelColor: (opacity = 1) => isDarkMode ? `rgba(209, 213, 219, ${opacity})` : `rgba(55, 65, 81, ${opacity})`,
                style: { borderRadius: 16 },
                propsForLabels: { 
                  fontSize: 14, 
                  fontWeight: '600',
                  fill: isDarkMode ? '#D1D5DB' : '#374151'
                },
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </View>

          {/* Enhanced Stats Grid */}
          <View style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
            borderRadius: 16,
            padding: 16
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {[
                { label: 'Goal', value: goalCalories || 2400, color: 'blue' },
                { label: 'Food', value: foodCalories, color: 'emerald' },
                { label: 'Exercise', value: exerciseCalories, color: 'violet' },
                { label: 'Remaining', value: remainingCalories, color: remainingCalories > 0 ? 'emerald' : 'red' }
              ].map((stat, index) => (
                <React.Fragment key={stat.label}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: stat.color === 'red' ? '#EF4444' : stat.color === 'emerald' ? '#10B981' : '#4F46E5'
                    }}>
                      {stat.value}
                    </Text>
                    <Text style={{
                      color: isDarkMode ? '#D1D5DB' : '#374151',
                      fontWeight: '500',
                      fontSize: 12,
                      marginTop: 4
                    }}>
                      {stat.label}
                    </Text>
                  </View>
                  {index < 3 && <View style={{ height: 40, width: 1, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }} />}
                </React.Fragment>
              ))}
            </View>

            {/* Progress Bar */}
            <View style={{ marginTop: 16 }}>
              <View style={{
                height: 8,
                backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                borderRadius: 9999,
                overflow: 'hidden'
              }}>
                <LinearGradient
                  colors={['#4F46E5', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    borderRadius: 9999,
                    width: `${(foodCalories / goalCalories) * 100}%`
                  }}
                />
              </View>
              {remainingCalories > 0 ? (
                <Text style={{
                  color: isDarkMode ? '#D1D5DB' : '#374151',
                  textAlign: 'right',
                  fontSize: 12,
                  marginTop: 4
                }}>
                  {((foodCalories / goalCalories) * 100).toFixed(0)}% of daily goal
                </Text>
              ) : (
                <Text style={{
                  color: '#EF4444',
                  textAlign: 'right',
                  fontSize: 12,
                  marginTop: 4
                }}>
                  Exceeded daily goal by {Math.abs(baseCalories - foodCalories).toFixed(0)} calories
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Logged Food Section */}
        <LoggedFoodCard 
          setTotalCalories={setTotalCalories}
          totalCalories={totalCalories}
          userCalories={goalCalories}
        />
      </ScrollView>

      {/* Enhanced Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={isModalVisible} 
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={{
            flex: 1,
            justifyContent: 'flex-end'
          }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{
                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                padding: 16,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
              }}>
                <View style={{
                  width: 80,
                  height: 4,
                  backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
                  borderRadius: 9999,
                  alignSelf: 'center',
                  marginBottom: 16
                }} />

                {/* Modal Options */}
                <View style={{ gap: 8 }}>
                  {modalOptions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleOptionClick(item.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                        borderRadius: 12
                      }}
                    >
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDarkMode ? '#4B5563' : '#F3F4F6',
                        marginRight: 12
                      }}>
                        <Ionicons name={item.iconName} size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
                      </View>
                      <Text style={{
                        color: isDarkMode ? '#F9FAFB' : '#111827',
                        fontWeight: '500',
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

      {/* Add the streak info modal */}
      {renderStreakInfoModal()}
      {renderWaterModal()}
      {renderNoteModal()}
    </SafeAreaView>
  );
};

export default Meals;

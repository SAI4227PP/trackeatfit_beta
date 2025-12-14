import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const CalorySummaryItem = ({ label, value, color, prefix = '', suffix = 'Cal' }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12
    }}>
      <Text style={{
        color: isDarkMode ? '#d1d5db' : '#374151',
        fontWeight: '500'
      }}>
        {label}
      </Text>
      <Text style={{ fontWeight: '700', color: color }}>
        {prefix}{value}{suffix}
      </Text>
    </View>
  );
};

const MealCaloryItem = ({ mealType, calories, color, icon = "restaurant-outline" }) => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode ? [`${color}15`, `${color}25`] : [`${color}08`, `${color}15`]}
      style={{
        width: '48%',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}20`
        }}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={{
          color: isDarkMode ? '#d1d5db' : '#1f2937',
          fontWeight: '500',
          marginLeft: 8,
          textTransform: 'capitalize'
        }}>
          {mealType}
        </Text>
      </View>
      <Text style={{
        color: isDarkMode ? '#f3f4f6' : '#111827',
        fontSize: 24,
        fontWeight: '700'
      }}>
        {calories}
      </Text>
      <Text style={{
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        fontSize: 14,
        marginTop: 4
      }}>calories</Text>
    </LinearGradient>
  );
};

const StateIndicator = ({ current, goal, label, color = "#10B981" }) => {
  const { isDarkMode } = useTheme();
  const percentage = Math.min((current / goal) * 100, 100);
  const status = current > goal ? 'exceeded' : current === goal ? 'met' : 'in-progress';

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{
          color: isDarkMode ? '#9ca3af' : '#4b5563',
          fontWeight: '500'
        }}>{label}</Text>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 9999,
          backgroundColor: status === 'exceeded' ? '#fee2e2' : '#d1fae5'
        }}>
          <Text style={{
            color: status === 'exceeded' ? '#dc2626' : '#10b981',
            fontSize: 12,
            fontWeight: '500'
          }}>
            {status === 'exceeded' ? 'Exceeded' : status === 'met' ? 'Goal Met' : 'In Progress'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{
        backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
        height: 8,
        borderRadius: 9999,
        marginBottom: 8,
        overflow: 'hidden'
      }}>
        <LinearGradient
          colors={status === 'exceeded' ? ['#FCA5A5', '#EF4444'] : ['#6EE7B7', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${percentage}%`, height: '100%' }}
          className="rounded-full"
        />
      </View>

      {/* Values */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{
          color: isDarkMode ? '#f3f4f6' : '#111827',
          fontSize: 24,
          fontWeight: '700'
        }}>{current}</Text>
        <Text style={{
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontWeight: '500'
        }}>/ {goal} Cal</Text>
      </View>
    </LinearGradient>
  );
};

const StatisticBox = ({ label, value, previousValue, icon, color }) => {
  const { isDarkMode } = useTheme();
  const percentage = previousValue ? ((value - previousValue) / previousValue * 100).toFixed(1) : 0;
  const isIncrease = value > previousValue;

  return (
    <LinearGradient
      colors={isDarkMode ? [`${color}15`, `${color}25`] : [`${color}08`, `${color}15`]}
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 12
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}20`
          }}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#4b5563',
            marginLeft: 12,
            fontWeight: '500'
          }}>{label}</Text>
        </View>
        {previousValue && (
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 9999,
            backgroundColor: isIncrease ? '#d1fae5' : '#fee2e2'
          }}>
            <Text style={{
              color: isIncrease ? '#10b981' : '#dc2626',
              fontSize: 12,
              fontWeight: '500'
            }}>
              {isIncrease ? '↑' : '↓'} {Math.abs(percentage)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={{
        color: isDarkMode ? '#f3f4f6' : '#111827',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8
      }}>{value}</Text>
    </LinearGradient>
  );
};

const DailyDistribution = ({ pieData, totalCalories }) => {
  const { isDarkMode } = useTheme();
  // Ensure consistent meal type mapping
  const mealTypeData = {
    breakfast: { icon: 'sunny-outline', label: 'Breakfast' },
    lunch: { icon: 'restaurant-outline', label: 'Lunch' },
    dinner: { icon: 'moon-outline', label: 'Dinner' },
    snacks: { icon: 'cafe-outline', label: 'Snacks' }
  };

  // Sort data to ensure consistent order
  const sortedData = [...pieData].sort((a, b) => {
    const order = ['breakfast', 'lunch', 'dinner', 'snacks'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return (
    <View style={{ marginTop: 16, marginBottom: 24 }}>
      <Text style={{
        color: isDarkMode ? '#f3f4f6' : '#111827',
        fontWeight: '600',
        fontSize: 18,
        marginBottom: 16
      }}>Daily Distribution</Text>
      
      {/* Distribution Bars */}
      <View style={{ marginBottom: 24 }}>
        {sortedData.map((item) => {
          const mealType = item.name.toLowerCase();
          const mealConfig = mealTypeData[mealType];
          const percentage = totalCalories > 0 
            ? Math.round((item.population / totalCalories) * 100) 
            : 0;

          return (
            <View key={mealType} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View 
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                      backgroundColor: `${item.color}15`
                    }}
                  >
                    <Ionicons 
                      name={mealConfig.icon} 
                      size={16} 
                      color={item.color} 
                    />
                  </View>
                  <Text style={{
                    color: isDarkMode ? '#d1d5db' : '#374151',
                    fontWeight: '500'
                  }}>
                    {mealConfig.label}
                  </Text>
                </View>
                <Text style={{
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                  fontWeight: '600'
                }}>
                  {item.population} Cal
                </Text>
              </View>
              
              <View style={{
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                height: 8,
                borderRadius: 9999,
                overflow: 'hidden'
              }}>
                <LinearGradient
                  colors={[`${item.color}80`, item.color]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: `${percentage}%`, height: '100%' }}
                  className="rounded-full"
                />
              </View>
              
              <Text style={{
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontSize: 12,
                marginTop: 4,
                textAlign: 'right'
              }}>
                {percentage}% of daily total
              </Text>
            </View>
          );
        })}
      </View>

      {/* Mini Pie Chart */}
      <View style={{
        backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
        borderRadius: 12,
        padding: 16
      }}>
        <PieChart
          data={pieData}
          width={Dimensions.get('window').width - 80}
          height={160}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          hasLegend={false}
          center={[Dimensions.get('window').width / 6, 0]}
        />
      </View>
    </View>
  );
};

const CalorieProgressBar = ({ current, goal }) => {
  const { isDarkMode } = useTheme();
  const percentage = Math.min((current / goal) * 100, 100);
  const status = current > goal ? 'exceeded' : current === goal ? 'met' : 'in-progress';
  const remaining = goal - current;
  const isOverBudget = remaining < 0;

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
      }}
    >
      {/* Main Progress Bar */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{
            color: isDarkMode ? '#f3f4f6' : '#111827',
            fontSize: 20,
            fontWeight: '700'
          }}>{current}</Text>
          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          }}>of {goal} Cal</Text>
        </View>
        <View style={{
          backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
          height: 12,
          borderRadius: 9999,
          overflow: 'hidden'
        }}>
          <LinearGradient
            colors={status === 'exceeded' ? ['#FCA5A5', '#EF4444'] : ['#6EE7B7', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${percentage}%`, height: '100%' }}
            className="rounded-full"
          />
        </View>
      </View>

      {/* Status Indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: 12
          }}>Consumed</Text>
          <Text style={{
            color: isDarkMode ? '#f3f4f6' : '#111827',
            fontWeight: '700'
          }}>{current}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: 12
          }}>
            {isOverBudget ? 'Over by' : 'Remaining'}
          </Text>
          <Text style={{
            fontWeight: '700',
            color: isOverBudget ? '#dc2626' : '#10b981'
          }}>
            {Math.abs(remaining)}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: 12
          }}>Goal</Text>
          <Text style={{
            color: isDarkMode ? '#f3f4f6' : '#111827',
            fontWeight: '700'
          }}>{goal}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// Add a helper function to calculate total calories for duplicate items
const calculateMealTypeCalories = (mealType, pieData, filteredFood) => {
  const mealItems = filteredFood.filter(item => item.mealType === mealType);
  
  // Group by foodId and sum calories
  const groupedCalories = mealItems.reduce((acc, item) => {
    const foodId = item.foodId;
    if (!acc[foodId]) {
      acc[foodId] = {
        count: 1,
        calories: parseInt(item.calories) || 0
      };
    } else {
      acc[foodId].count += 1;
      acc[foodId].calories += parseInt(item.calories) || 0;
    }
    return acc;
  }, {});

  // Sum up total calories for this meal type
  return Object.values(groupedCalories).reduce((total, item) => total + item.calories, 0);
};

const CaloriesCard = ({ pieData, calculateTotalCalories, totalCalories, userCalories, loading, filteredFood = [], groupedFood }) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();

  // Update statistics calculation to handle duplicates
  const statistics = useMemo(() => {
    if (!filteredFood || !groupedFood) return {
      avgCaloriesPerMeal: 0,
      caloriesRemaining: userCalories,
      percentageComplete: 0,
      isOverBudget: false
    };

    const { totalsByMealType } = groupedFood;
    const activeMealTypes = Object.keys(totalsByMealType).length || 1;
    const remaining = userCalories - totalCalories;

    return {
      avgCaloriesPerMeal: Math.round(totalCalories / activeMealTypes),
      caloriesRemaining: remaining,
      percentageComplete: Math.round((totalCalories / userCalories) * 100),
      isOverBudget: remaining < 0
    };
  }, [totalCalories, userCalories, filteredFood, groupedFood]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        }}
      >
        {/* Daily Progress Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{
              color: isDarkMode ? '#f3f4f6' : '#111827',
              fontSize: 20,
              fontWeight: '700'
            }}>Daily Progress</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Goal')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{
                color: '#059669',
                fontWeight: '500',
                marginRight: 4,
                fontSize: 16
              }}>Set Goal</Text>
              <Ionicons name="chevron-forward" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
          <CalorieProgressBar 
            current={totalCalories} 
            goal={userCalories} 
          />
        </View>

        {/* Statistics Grid */}
        <View style={{ marginBottom: 24 }}>
          <StatisticBox
            label="Average per Meal"
            value={`${statistics.avgCaloriesPerMeal} Cal`}
            icon="calculator-outline"
            color="#7C3AED"
          />
          <StatisticBox
            label={statistics.isOverBudget ? "Exceeds Goal" : "Remaining"}
            value={`${Math.abs(statistics.caloriesRemaining)} Cal`}
            icon={statistics.isOverBudget ? "alert-circle-outline" : "timer-outline"}
            color={statistics.isOverBudget ? "#DC2626" : "#059669"}
          />
          <StatisticBox
            label="Goal Progress"
            value={`${statistics.percentageComplete}%`}
            icon="trending-up-outline"
            color="#2563EB"
          />
        </View>

        {/* Daily Distribution Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            color: isDarkMode ? '#f3f4f6' : '#111827',
            fontWeight: '600',
            fontSize: 18,
            marginBottom: 16
          }}>Daily Distribution</Text>
          {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType, index) => {
            const mealItems = filteredFood.filter(item => item.mealType === mealType);
            const groupedItems = mealItems.reduce((acc, item) => {
              const id = item.foodId;
              if (!acc[id]) {
                acc[id] = { ...item, count: 1 };
              } else {
                acc[id].count += 1;
              }
              return acc;
            }, {});

            const totalMealCalories = calculateMealTypeCalories(mealType, pieData, filteredFood);
            const percentage = totalCalories > 0 ? (totalMealCalories / totalCalories) * 100 : 0;
            
            return (
              <View key={mealType} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View 
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                        backgroundColor: `${pieData[index].color}15`
                      }}
                    >
                      <Ionicons 
                        name={mealType === 'breakfast' ? 'sunny-outline' : 
                              mealType === 'lunch' ? 'restaurant-outline' :
                              mealType === 'dinner' ? 'moon-outline' : 'cafe-outline'} 
                        size={16} 
                        color={pieData[index].color} 
                      />
                    </View>
                    <View>
                      <Text style={{
                        color: isDarkMode ? '#d1d5db' : '#374151',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>{mealType}</Text>
                      <Text style={{
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: 12
                      }}>
                        {Object.values(groupedItems).length} unique items
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{
                      color: isDarkMode ? '#f3f4f6' : '#111827',
                      fontWeight: '600'
                    }}>{totalMealCalories} Cal</Text>
                    <Text style={{
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      fontSize: 12
                    }}>
                      {Object.values(groupedItems).reduce((sum, item) => sum + item.count, 0)} total items
                    </Text>
                  </View>
                </View>
                
                <View style={{
                  backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                  height: 8,
                  borderRadius: 9999,
                  overflow: 'hidden'
                }}>
                  <LinearGradient
                    colors={[`${pieData[index].color}80`, pieData[index].color]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${percentage}%`, height: '100%' }}
                    className="rounded-full"
                  />
                </View>
                
                <Text style={{
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontSize: 12,
                  marginTop: 4,
                  textAlign: 'right'
                }}>
                  {Math.round(percentage)}% of daily total
                </Text>
              </View>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Meals_complete', { totalCalories, userCalories })}
        >
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 9999,
              paddingVertical: 12
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 18,
                marginLeft: 8
              }}>
                Complete Meal
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

export default CaloriesCard;

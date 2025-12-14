import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatisticsSkeleton from '../../components/Skeletons/StatisticsSkeleton';
import { useCaloriesContext } from '../../context/CaloriesContext';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const Statistics = () => {
  const navigation = useNavigation();
  const { user } = useGlobalContext(); // Remove xp from destructuring
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('daily');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calories'); // calories, macros, trends
  const screenWidth = Dimensions.get('window').width;
  const { goalCalories, foodCalories, exerciseCalories, carbs, protein, fats } = useCaloriesContext();
  const [macronutrientTargets, setMacronutrientTargets] = useState(null);
  const { isDarkMode } = useTheme();

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0.00';
    return Number(parseFloat(num)).toFixed(2);
  };

  // Modify useEffect to remove timeFrame dependency
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/logged-food/get-statistics/${user._id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        if (data.success) {
          setStatsData(data.data);
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?._id]); // Remove timeFrame dependency

  // Add new useEffect to fetch macronutrient data
  useEffect(() => {
    const fetchMacronutrientTargets = async () => {
      if (!user?._id) return;

      try {
        const response = await fetch(`${API_URL}/macronutrient/get-macronutrient-data/${user._id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch macronutrient targets');
        }

        const result = await response.json();
        // Only set macronutrient targets if data is not an empty array
        if (result.data && !Array.isArray(result.data)) {
          setMacronutrientTargets(result.data);
        } else {
          // Set to null to trigger fallback values
          setMacronutrientTargets(null);
        }
      } catch (err) {
        console.error('Error fetching macronutrient targets:', err);
        setMacronutrientTargets(null);
      }
    };

    fetchMacronutrientTargets();
  }, [user?._id]);

  // Add a loading state for time frame changes
  const handleTimeFrameChange = (newTimeFrame) => {
    // No need for loading state since we're just switching views
    setTimeFrame(newTimeFrame);
  };

  // Update generateDetailedData to use real data
  const generateDetailedData = (period) => {
    if (!statsData) return null;
    return statsData[period];
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6'
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerButton: {
      padding: 8
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#111827'
    },
    tabContainer: {
      flexDirection: 'row',
      marginTop: 16,
      backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
      borderRadius: 9999,
      padding: 4
    },
    tabButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 9999
    },
    activeTab: {
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1
    },
    tabText: {
      textAlign: 'center',
      textTransform: 'capitalize'
    },
    activeTabText: {
      color: '#2563eb',
      fontWeight: '600'
    },
    inactiveTabText: {
      color: isDarkMode ? '#d1d5db' : '#4b5563'
    },
    metricCard: {
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    cardTitle: {
      marginLeft: 12,
      color: isDarkMode ? '#ffffff' : '#111827',
      fontWeight: '600'
    },
    cardTrendUp: {
      color: "#10b981"
    },
    cardTrendDown: {
      color: "#ef4444"
    },
    cardCurrent: {
      fontSize: 30,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#111827'
    },
    cardPrevious: {
      fontSize: 14,
      color: isDarkMode ? '#9ca3af' : '#6b7280'
    },
    // ... add more styles as needed
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detailed Analytics</Text>
        <TouchableOpacity 
          onPress={() => setDatePickerVisible(true)}
          style={styles.headerButton}
        >
          <Ionicons name="calendar" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        {['calories', 'macros', 'trends'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab ? styles.activeTabText : styles.inactiveTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMetricCard = ({ title, current, previous, trend, icon }) => (
    <View style={styles.metricCard}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
            padding: 8,
            borderRadius: 9999
          }}>
            <Ionicons name={icon} size={20} color="#3b82f6" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name={trend >= 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={trend >= 0 ? "#10b981" : "#ef4444"} 
          />
          <Text style={trend >= 0 ? styles.cardTrendUp : styles.cardTrendDown}>
            {Math.abs(Number(trend)).toFixed(2)}%
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.cardCurrent}>{current}</Text>
        <Text style={styles.cardPrevious}>vs {previous} last period</Text>
      </View>
    </View>
  );

  // Continue converting the rest of the components following the same pattern...
  // I'll show a few more examples of converted components:

  const processNutritionData = (timeFrame, statsData) => {
    if (!statsData?.nutrition) return null;

    switch (timeFrame) {
      case 'daily':
        // Daily data remains unchanged
        return {
          labels: statsData.daily.labels,
          datasets: [{
            data: statsData.daily.datasets[0].data,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 2
          }]
        };

      case 'weekly':
        // Use the actual data from the API response
        return {
          labels: statsData.weekly.labels,
          datasets: [{
            data: statsData.weekly.datasets[0].data,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 2
          }]
        };

      case 'monthly':
        return {
          labels: statsData.monthly.labels,
          datasets: [{
            data: statsData.monthly.datasets[0].data,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 2
          }]
        };

      default:
        return null;
    }
  };

  const getPeriodRange = (timeFrame) => {
    const now = new Date();
    const today = new Date(now.toLocaleDateString('en-CA'));
    
    switch(timeFrame) {
      case 'daily':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return {
          current: today,
          previous: yesterday
        };
      
      case 'weekly':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - 7);
        const twoWeeksAgoStart = new Date(lastWeekStart);
        twoWeeksAgoStart.setDate(lastWeekStart.getDate() - 7);
        return {
          current: {
            start: lastWeekStart,
            end: today
          },
          previous: {
            start: twoWeeksAgoStart,
            end: lastWeekStart
          }
        };
      
      case 'monthly':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const twoMonthsAgoStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        return {
          current: {
            start: lastMonthStart,
            end: today
          },
          previous: {
            start: twoMonthsAgoStart,
            end: lastMonthStart
          }
        };
    }
  };

  const getNutritionData = () => {
    if (!statsData?.nutrition) return null;

    const currentData = statsData.nutrition[timeFrame];
    const previousData = statsData.nutrition.previous[timeFrame];

    // Calculate percentage difference with a max of 100%
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return 100.00;
      const trend = ((current - previous) / previous * 100);
      return Number(Math.min(trend, 100).toFixed(2));
    };

    const trend = calculateTrend(currentData.calories, previousData.calories);

    // Add burned and previousBurned from the nutrition data
    const burned = currentData.burned || 0;
    const previousBurned = previousData?.burned || 0;
    const burnedTrend = calculateTrend(burned, previousBurned);

    return {
      current: Number(formatNumber(currentData.calories)),
      previous: Number(formatNumber(previousData.calories || 0)),
      trend: Number(trend.toFixed(2)),
      label: timeFrame === 'daily' ? "Yesterday" :
             timeFrame === 'weekly' ? "Last Week" : "Last Month",
      burned: Number(formatNumber(burned)),
      previousBurned: Number(formatNumber(previousBurned)),
      burnedTrend: Number(burnedTrend.toFixed(2))
    };
  };

  const getMacroComparison = () => {
    if (!statsData?.nutrition) return null;

    const currentData = statsData.nutrition[timeFrame];
    const previousData = statsData.nutrition.previous[timeFrame];

    return {
      current: {
        carbs: currentData.carbs,
        protein: currentData.protein,
        fats: currentData.fats
      },
      previous: previousData || {
        carbs: 0,
        protein: 0,
        fats: 0
      }
    };
  };

  // Add this function before renderMacrosSection
  const getTitle = () => {
    switch(timeFrame) {
      case 'daily':
        return "Today's Macros";
      case 'weekly':
        return "Weekly Macros";
      case 'monthly':
        return "Monthly Macros";
      default:
        return "Macros Distribution";
    }
  };

  // Update renderCaloriesSection to use the processed data
  const renderCaloriesSection = () => {
    if (!statsData) return null;

    const nutritionData = getNutritionData();
    if (!nutritionData) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 16 }}>
            {renderMetricCard({
              title: timeFrame === 'daily' ? "Today's Intake" :
                     timeFrame === 'weekly' ? "Weekly Average" : "Monthly Average",
              current: `${formatNumber(nutritionData.current)}cal`,
              previous: `${formatNumber(nutritionData.previous)}cal`,
              trend: nutritionData.trend,
              icon: "nutrition"
            })}
            {renderMetricCard({
              title: "Burned",
              current: `${formatNumber(nutritionData.burned)}cal`,
              previous: `${formatNumber(nutritionData.previousBurned)}cal`,
              trend: nutritionData.burnedTrend,
              icon: "fitness"
            })}
          </View>
        </ScrollView>

        {/* Calories Chart */}
        <View style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827'
            }}>
              {timeFrame === 'daily' ? "Today's Calories" :
               timeFrame === 'weekly' ? "This Week's Calories" :
               "Monthly Calories"}
            </Text>
            <View style={{
              backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 9999
            }}>
              <Text style={{
                color: '#2563eb',
                fontWeight: '500'
              }}>
                {formatNumber(statsData.nutrition[timeFrame].calories)}
                {timeFrame !== 'daily' ? 
                  ` (${formatNumber(statsData.nutrition[timeFrame].calories / (timeFrame === 'weekly' ? 7 : 30))} cal/day)` 
                  : ' cal'}
              </Text>
            </View>
          </View>

          <LineChart
            data={{
              labels: statsData[timeFrame].labels,
              datasets: statsData[timeFrame].datasets
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
              backgroundGradientFrom: isDarkMode ? '#1F2937' : '#ffffff',
              backgroundGradientTo: isDarkMode ? '#1F2937' : '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => isDarkMode 
                ? `rgba(229, 231, 235, ${opacity})`
                : `rgba(51, 65, 85, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: isDarkMode ? "#374151" : "#fff"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
            fromZero
          />

          {/* Additional period info */}
          {timeFrame !== 'daily' && (
            <View style={{
              marginTop: 16,
              backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
              borderRadius: 12,
              padding: 12
            }}>
              <Text style={{
                color: '#2563eb',
                fontSize: 14
              }}>
                {timeFrame === 'weekly' ?
                  `Total: ${formatNumber(statsData.nutrition.weekly.calories)} calories (${formatNumber(statsData.nutrition.weekly.calories / 7)} per day)` :
                  `Total: ${formatNumber(statsData.nutrition.monthly.calories)} calories (${formatNumber(statsData.nutrition.monthly.calories / 30)} per day)`}
              </Text>
            </View>
          )}
        </View>

        {/* Time distribution */}
        <View style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: isDarkMode ? '#ffffff' : '#111827',
            marginBottom: 16
          }}>
            {timeFrame === 'daily' ? "Time Distribution" :
             timeFrame === 'weekly' ? "Daily Distribution" :
             "Weekly Distribution"}
          </Text>
          <BarChart
            data={{
              labels: statsData[timeFrame].labels,
              datasets: statsData[timeFrame].datasets
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
              backgroundGradientFrom: isDarkMode ? '#1F2937' : '#ffffff',
              backgroundGradientTo: isDarkMode ? '#1F2937' : '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => isDarkMode 
                ? `rgba(229, 231, 235, ${opacity})`
                : `rgba(51, 65, 85, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: isDarkMode ? "#374151" : "#fff"
              },
              barPercentage: 0.7,
              propsForBackgroundLines: {
                strokeDasharray: ''
              }
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
            showValuesOnTopOfBars
            fromZero
          />

          {/* Add a legend or summary */}
          <View style={{
            marginTop: 16,
            backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
            borderRadius: 12,
            padding: 12
          }}>
            <Text style={{
              color: '#2563eb',
              fontSize: 14
            }}>
              {timeFrame === 'daily' ? 
                `Peak time: ${statsData.daily.labels[
                  statsData.daily.datasets[0].data.indexOf(
                    Math.max(...statsData.daily.datasets[0].data)
                  )
                ]}` :
                timeFrame === 'weekly' ?
                `Highest intake: ${Math.max(...statsData.weekly.datasets[0].data)}cal (${
                  statsData.weekly.labels[
                    statsData.weekly.datasets[0].data.indexOf(
                      Math.max(...statsData.weekly.datasets[0].data)
                    )
                  ]
                })` :
                `Highest week: Week ${
                  statsData.monthly.datasets[0].data.indexOf(
                    Math.max(...statsData.monthly.datasets[0].data)
                  ) + 1
                }`
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Update renderMacrosSection to handle different time frames
  const renderMacrosSection = () => {
    if (!statsData) return null;

    const comparison = getMacroComparison();
    if (!comparison) return null;

    const macros = statsData.nutrition[timeFrame];
    const previousMacros = statsData.nutrition.previous[timeFrame];
    const total = macros.carbs + macros.protein + macros.fats;
    
    const percentages = {
      carbs: Number((macros.carbs / total) * 100).toFixed(2),
      protein: Number((macros.protein / total) * 100).toFixed(2),
      fats: Number((macros.fats / total) * 100).toFixed(2)
    };

    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return 100.00;
      const trend = ((current - previous) / previous * 100);
      return Number(Math.min(trend, 100).toFixed(2));
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 16 }}>
            {[
              {
                title: "Carbs",
                current: `${formatNumber(macros.carbs)}g`,
                previous: `${formatNumber(previousMacros?.carbs || 0)}g`,
                trend: calculateTrend(macros.carbs, previousMacros?.carbs),
                icon: "leaf",
                color: "#3b82f6"
              },
              {
                title: "Protein",
                current: `${formatNumber(macros.protein)}g`,
                previous: `${formatNumber(previousMacros?.protein || 0)}g`,
                trend: calculateTrend(macros.protein, previousMacros?.protein),
                icon: "fitness",
                color: "#8b5cf6"
              },
              {
                title: "Fats",
                current: `${formatNumber(macros.fats)}g`,
                previous: `${formatNumber(previousMacros?.fats || 0)}g`,
                trend: calculateTrend(macros.fats, previousMacros?.fats),
                icon: "water",
                color: "#f59e0b"
              }
            ].map((macro, index) => renderMetricCard({ ...macro, key: index }))}
          </View>
        </ScrollView>

        {/* Macros Distribution Chart */}
        <View style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827'
            }}>{getTitle()}</Text>
            <View style={{
              backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
              borderRadius: 9999,
              paddingVertical: 8,
              paddingHorizontal: 12
            }}>
              <Text style={{
                color: '#2563eb',
                fontWeight: '500',
                fontSize: 14
              }}>
                {formatNumber(total)}g Total
                {timeFrame !== 'daily' && ` (${timeFrame})`}
              </Text>
            </View>
          </View>
          
          <PieChart
            data={[
              {
                name: "Carbohydrates",
                population: Number(formatNumber(macros.carbs)),
                color: "#3b82f6",
                legendFontColor: isDarkMode ? "#F9FAFB" : "#374151",
                legendFontSize: 12,
                legendSubtitle: `${percentages.carbs}% • ${formatNumber(macros.carbs)}g`
              },
              {
                name: "Protein",
                population: Number(formatNumber(macros.protein)),
                color: "#8b5cf6",
                legendFontColor: isDarkMode ? "#F9FAFB" : "#374151",
                legendFontSize: 12,
                legendSubtitle: `${percentages.protein}% • ${formatNumber(macros.protein)}g`
              },
              {
                name: "Fats",
                population: Number(formatNumber(macros.fats)),
                color: "#f59e0b",
                legendFontColor: isDarkMode ? "#F9FAFB" : "#374151",
                legendFontSize: 12,
                legendSubtitle: `${percentages.fats}% • ${formatNumber(macros.fats)}g`
              }
            ]}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
              backgroundGradientFrom: isDarkMode ? '#1F2937' : '#ffffff',
              backgroundGradientTo: isDarkMode ? '#1F2937' : '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => isDarkMode 
                ? `rgba(229, 231, 235, ${opacity})`
                : `rgba(51, 65, 85, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: isDarkMode ? "#374151" : "#fff"
              },
              decimalPlaces: 2,
              propsForLabels: {
                fontSize: 12,
                fontWeight: '600'
              }
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
            hasLegend={true}
            avoidFalseZero
          />

          {/* Macro distribution cards with period-specific data - UPDATED */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginHorizontal: 4 }}>
            {[
              { 
                label: "Carbs",
                value: macros.carbs,
                percentage: percentages.carbs,
                color: "#3b82f6",
                icon: "leaf-outline"
              },
              {
                label: "Protein",
                value: macros.protein,
                percentage: percentages.protein,
                color: "#8b5cf6",
                icon: "fitness-outline"
              },
              {
                label: "Fats",
                value: macros.fats,
                percentage: percentages.fats,
                color: "#f59e0b",
                icon: "water-outline"
              }
            ].map((item, index) => (
              <View key={index} style={{
                backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                borderRadius: 12,
                padding: 8,
                flex: 1,
                marginHorizontal: 4
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name={item.icon} size={14} color={item.color} />
                  <Text style={{
                    fontSize: 12,
                    marginLeft: 4,
                    color: isDarkMode ? '#d1d5db' : '#4b5563'
                  }}>{item.label}</Text>
                </View>
                <View>
                  <Text style={{
                    fontWeight: 'bold',
                    fontSize: 14,
                    color: isDarkMode ? '#ffffff' : '#111827'
                  }}>
                    {formatNumber(item.value)}g
                  </Text>
                  {timeFrame !== 'daily' && (
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      {`${formatNumber(item.value / (timeFrame === 'weekly' ? 7 : 30))}g/day`}
                    </Text>
                  )}
                </View>
                <Text style={{
                  fontSize: 12,
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>{item.percentage}%</Text>
              </View>
            ))}
          </View>

          {/* Period comparison info */}
          {timeFrame !== 'daily' && (
            <View style={{
              marginTop: 16,
              backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
              borderRadius: 12,
              padding: 12
            }}>
              <Text style={{
                color: '#2563eb',
                fontSize: 14
              }}>
                {timeFrame === 'weekly' ? 'Weekly average' : 'Monthly average'}: 
                {` ${formatNumber(total / (timeFrame === 'weekly' ? 7 : 30))}g per day`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderTrendsSection = () => {
    // Calculate weekly averages and trends
    const weeklyAverages = statsData?.weekly?.datasets[0]?.data || [];
    const currentWeekAvg = weeklyAverages.length > 0 
      ? weeklyAverages.reduce((a, b) => a + b, 0) / weeklyAverages.length 
      : 0;
    
    const previousWeekAvg = statsData?.nutrition?.previous?.weekly?.calories / 7 || 0;
    const weeklyChange = currentWeekAvg - previousWeekAvg;

    // Advanced Metrics Calculations
    const calorieAdherence = Math.min(100, (currentWeekAvg / goalCalories) * 100);
    
    // Updated XP calculations based on defined levels
    const levels = [
      { level: 1, xp: 0, status: 'Nutrition Novice', color: '#9ca3af' },
      { level: 2, xp: 50, status: 'Health Explorer', color: '#60a5fa' },
      { level: 3, xp: 100, status: 'Wellness Seeker', color: '#34d399' },
      { level: 4, xp: 200, status: 'Fitness Enthusiast', color: '#a78bfa' },
      { level: 5, xp: 350, status: 'Health Champion', color: '#f59e0b' },
      { level: 6, xp: 550, status: 'Nutrition Pro', color: '#ec4899' },
      { level: 7, xp: 800, status: 'Wellness Warrior', color: '#6366f1' },
      { level: 8, xp: 1100, status: 'Health Expert', color: '#8b5cf6' },
      { level: 9, xp: 1450, status: 'Elite Achiever', color: '#ef4444' },
      { level: 10, xp: 1850, status: 'Wellness Master', color: '#f59e0b' }
    ];

    const currentLevel = user.level || 1;
    const currentLevelXp = user.xp || 0;
    const currentLevelData = levels.find(l => l.level === currentLevel);
    const nextLevelData = levels.find(l => l.level === currentLevel + 1);
    const xpRequiredForNextLevel = nextLevelData ? nextLevelData.xp - currentLevelData.xp : 0;
    const xpProgress = nextLevelData ? currentLevelXp - currentLevelData.xp : 0;
    const consistencyScore = Math.min(100, (xpProgress / xpRequiredForNextLevel) * 100);
    
    // Calculate nutrition balance score
    const idealRatio = { carbs: 0.5, protein: 0.3, fats: 0.2 };
    const currentMacros = statsData?.nutrition?.weekly || { carbs: 0, protein: 0, fats: 0 };
    const totalMacros = currentMacros.carbs + currentMacros.protein + currentMacros.fats;
    const actualRatio = {
      carbs: currentMacros.carbs / totalMacros,
      protein: currentMacros.protein / totalMacros,
      fats: currentMacros.fats / totalMacros
    };

    // Update the nutrition balance card to use real targets
    const targetPercentages = macronutrientTargets ? {
      carbs: Number(macronutrientTargets.carbsPercentage || 0),
      protein: Number(macronutrientTargets.proteinsPercentage || 0),
      fats: Number(macronutrientTargets.fatsPercentage || 0)
    } : { carbs: 50, protein: 25, fats: 25 }; // updated fallback values

    // Calculate nutrition balance using actual targets
    const nutritionBalance = 100 - (
      Math.abs(targetPercentages.carbs/100 - actualRatio.carbs) +
      Math.abs(targetPercentages.protein/100 - actualRatio.protein) +
      Math.abs(targetPercentages.fats/100 - actualRatio.fats)
    ) * 100;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {/* Performance Overview */}
          <View style={{
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827',
              marginBottom: 8
            }}>
              Performance Overview
            </Text>
            <View style={{
              backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
              padding: 12,
              borderRadius: 12,
              marginBottom: 12
            }}>
              <Text style={{
                color: '#2563eb',
                fontWeight: '600'
              }}>
                Weekly Performance Score: {formatNumber((calorieAdherence + consistencyScore + nutritionBalance) / 3)}%
              </Text>
              <Text style={{
                color: '#4b5563',
                fontSize: 12,
                marginTop: 4
              }}>
                Based on calorie adherence, consistency, and nutrition balance
              </Text>
            </View>
            
            {/* Progress Indicators */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <View>
                <Text style={{
                  fontSize: 12,
                  color: isDarkMode ? '#9ca3af' : '#4b5563'
                }}>Current Level</Text>
                <Text style={{
                  fontWeight: 'bold',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>Level {currentLevel}</Text>
              </View>
              <View>
                <Text style={{
                  fontSize: 12,
                  color: isDarkMode ? '#9ca3af' : '#4b5563'
                }}>Active Streak</Text>
                <Text style={{
                  fontWeight: 'bold',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>{user.streak} days</Text>
              </View>
              <View>
                <Text style={{
                  fontSize: 12,
                  color: isDarkMode ? '#9ca3af' : '#4b5563'
                }}>XP Progress</Text>
                <Text style={{
                  fontWeight: 'bold',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>{currentLevelXp}/{xpRequiredForNextLevel}</Text>
              </View>
            </View>
          </View>

          {/* Analysis Cards with Enhanced Metrics */}
          {[
            {
              title: "Goal Adherence",
              value: `${formatNumber(calorieAdherence)}%`,
              change: `${weeklyChange >= 0 ? '+' : '-'}${formatNumber(Math.abs(weeklyChange))}cal`,
              desc: `${formatNumber(Math.abs(currentWeekAvg - goalCalories))}cal ${currentWeekAvg > goalCalories ? 'above' : 'below'} target`,
              icon: "trending-up",
              color: "bg-blue-500",
              detail: `Daily Average: ${formatNumber(currentWeekAvg)}cal`
            },
            {
              title: "Nutrition Balance",
              value: `${formatNumber(nutritionBalance)}%`,
              change: "Macros Distribution",
              desc: `Carbs: ${formatNumber(actualRatio.carbs * 100)}% • Protein: ${formatNumber(actualRatio.protein * 100)}% • Fats: ${formatNumber(actualRatio.fats * 100)}%`,
              icon: "nutrition",
              color: "bg-purple-500",
              detail: macronutrientTargets 
                ? `Target: ${formatNumber(targetPercentages.carbs)}% • ${formatNumber(targetPercentages.protein)}% • ${formatNumber(targetPercentages.fats)}%`
                : 'Default Target: 50% • 25% • 25%'
            },
            {
              title: "Progress Tracking",
              value: `${formatNumber(consistencyScore)}%`,
              change: `Level ${currentLevel}`,
              desc: `XP: ${xpProgress}/${xpRequiredForNextLevel}`,
              icon: "trophy",
              color: "bg-yellow-500",
              detail: `Next Level: ${xpRequiredForNextLevel - xpProgress} XP needed`
            },
            {
              title: "Health Score",
              value: user.streak >= 7 ? "Excellent" : user.streak >= 3 ? "Good" : "Getting Started",
              change: `${user.streak} day streak`,
              desc: "Based on streak and nutrition balance",
              icon: "fitness",
              color: "bg-green-500",
              detail: "Keep maintaining your streak!"
            }
          ].map((item, index) => (
            <View key={index} style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: item.color,
                    padding: 8,
                    borderRadius: 9999
                  }}>
                    <Ionicons name={item.icon} size={20} color="white" />
                  </View>
                  <Text style={{
                    marginLeft: 12,
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontWeight: '600'
                  }}>{item.title}</Text>
                </View>
                <Text style={{
                  color: item.change.startsWith('+') ? "#10b981" : "#ef4444",
                  fontWeight: '500'
                }}>{item.change}</Text>
              </View>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: isDarkMode ? '#ffffff' : '#111827',
                marginTop: 8
              }}>{item.value}</Text>
              <Text style={{
                fontSize: 12,
                marginTop: 4,
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}>{item.desc}</Text>
              <Text style={{
                color: '#2563eb',
                fontSize: 12,
                marginTop: 4
              }}>{item.detail}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Add your DateTimePicker component
  const renderDatePicker = () => (
    <DateTimePickerModal
      isVisible={isDatePickerVisible}
      mode="date"
      onConfirm={(date) => {
        setSelectedDate(date);
        setDatePickerVisible(false);
      }}
      onCancel={() => setDatePickerVisible(false)}
    />
  );

  // Replace the loading state with skeleton
  if (loading) {
    return <StatisticsSkeleton />;
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ef4444' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  const renderTimeFrameSelector = () => {
    // Only show time frame selector for calories and macros tabs
    if (activeTab === 'trends') return null;

    return (
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
      }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
          borderRadius: 9999,
          padding: 4
        }}>
          {['daily', 'weekly', 'monthly'].map((time) => (
            <TouchableOpacity
              key={time}
              onPress={() => handleTimeFrameChange(time)}
              style={[
                styles.tabButton,
                timeFrame === time && styles.activeTab
              ]}
            >
              <Text style={[
                styles.tabText,
                timeFrame === time ? styles.activeTabText : styles.inactiveTabText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={{ flex: 1 }}>
        {renderTimeFrameSelector()}
        <View style={{ flex: 1 }}>
          {activeTab === 'calories' && renderCaloriesSection()}
          {activeTab === 'macros' && renderMacrosSection()}
          {activeTab === 'trends' && renderTrendsSection()}
        </View>
        {renderDatePicker()}
      </View>
    </SafeAreaView>
  );
};

export default Statistics;
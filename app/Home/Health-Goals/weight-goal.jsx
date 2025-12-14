import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomPicker from '../../../components/CustomPicker';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const getColor = (color, shade) => {
  // Tailwind color mapping for RN
  const colors = {
    emerald: {
      50: '#ECFDF5', 100: '#D1FAE5', 400: '#34D399', 700: '#047857', 800: '#065F46', 900: '#064E3B'
    },
    blue: {
      50: '#EFF6FF', 100: '#DBEAFE', 600: '#2563EB', 800: '#1E40AF', 900: '#1E3A8A'
    },
    amber: {
      50: '#FFFBEB', 100: '#FEF3C7', 400: '#FBBF24', 900: '#78350F'
    },
    orange: {
      50: '#FFF7ED', 100: '#FFEDD5', 400: '#FB923C', 900: '#7C2D12'
    },
    red: {
      50: '#FEF2F2', 100: '#FEE2E2', 400: '#F87171', 900: '#7F1D1D'
    },
    gray: {
      50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 400: '#9CA3AF', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827'
    }
  };
  return colors[color]?.[shade] || '#fff';
};

const getStyles = (isDarkMode) => ({
  input: {
    backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
    color: isDarkMode ? '#fff' : getColor('gray', 900),
    borderColor: isDarkMode ? getColor('gray', 700) : getColor('gray', 200),
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputLabel: {
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 700),
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 900),
    marginBottom: 16,
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? 'rgba(31,41,55,0.8)' : '#fff',
    borderColor: isDarkMode ? getColor('gray', 700) : undefined,
    borderWidth: isDarkMode ? 1 : 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  pickerContainer: {
    backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
    borderColor: isDarkMode ? getColor('gray', 700) : getColor('gray', 200),
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColor('emerald', 50),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerButtonText: {
    color: isDarkMode ? getColor('emerald', 400) : getColor('emerald', 700),
    fontWeight: '500',
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: getColor('gray', 100),
    marginVertical: 16,
  },
  metricCardContainer: {
    backgroundColor: isDarkMode ? 'rgba(31,41,55,0.8)' : undefined,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: isDarkMode ? getColor('gray', 700) : undefined,
  },
  metricCardTitle: {
    fontWeight: '500',
    fontSize: 16,
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 900),
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 900),
  },
  metricCardSubtitle: {
    fontSize: 14,
    marginTop: 4,
    color: isDarkMode ? getColor('gray', 400) : getColor('gray', 600),
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  flexBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  mt1: { marginTop: 4 },
  ml1: { marginLeft: 4 },
  ml2: { marginLeft: 8 },
  mb4: { marginBottom: 16 },
  px4: { paddingHorizontal: 16 },
  py4: { paddingVertical: 16 },
  py1_5: { paddingVertical: 6 },
  p2: { padding: 8 },
  p4: { padding: 16 },
  roundedFull: { borderRadius: 999 },
  w10: { width: 40 },
  h10: { height: 40 },
  mb6: { marginBottom: 24 },
});

const WeightGoal = () => {
  const { user, setUser } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentWeight: user?.weight?.toString() || '',
    targetWeight: user?.targetWeight?.toString() || '',
    weeklyGoal: user?.weeklyGoal || 'moderate',
    timeframe: user?.timeframe || '12_weeks',
    weightUnit: user?.weightUnit || 'kg',
  });

  const [metrics, setMetrics] = useState({
    bmi: 0,
    idealWeight: { min: 0, max: 0 },
    weeklyChange: 0,
    expectedDate: null,
  });

  useEffect(() => {
    if (formData.currentWeight && formData.targetWeight) {
      calculateMetrics();
    }
  }, [formData.currentWeight, formData.targetWeight, formData.weeklyGoal]);

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'amber' };
    if (bmi < 25) return { label: 'Healthy Weight', color: 'emerald' };
    if (bmi < 30) return { label: 'Overweight', color: 'orange' };
    return { label: 'Obese', color: 'red' };
  };

  const getWeightChangeMessage = (current, target) => {
    const diff = target - current;
    if (Math.abs(diff) < 0.1) return "Maintain current weight";
    return diff > 0 ? "Weight gain goal" : "Weight loss goal";
  };

  const calculateMetrics = () => {
    const height = user?.height / 100; // Convert to meters
    const currentWeight = parseFloat(formData.currentWeight);
    const targetWeight = parseFloat(formData.targetWeight);

    // Calculate BMI
    const bmi = (currentWeight / (height * height)).toFixed(1);

    // Calculate ideal weight range using BMI method
    const idealWeight = {
      min: Math.round(18.5 * height * height),
      max: Math.round(24.9 * height * height),
    };

    // Calculate weekly change based on goal
    const weeklyGoals = {
      gentle: 0.25,
      moderate: 0.5,
      aggressive: 1,
    };
    const weeklyChange = weeklyGoals[formData.weeklyGoal];

    // Calculate expected completion date
    const weightDiff = Math.abs(targetWeight - currentWeight);
    const weeksNeeded = Math.ceil(weightDiff / weeklyChange);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + (weeksNeeded * 7));

    // Enhanced metrics
    const bmiCategory = getBMICategory(bmi);
    const weightChangeType = getWeightChangeMessage(currentWeight, targetWeight);
    const totalChange = Math.abs(targetWeight - currentWeight).toFixed(1);
    const estimatedCaloriesPerDay = Math.abs(
      (weeklyChange * 7700) / 7
    ).toFixed(0); // 7700 calories = 1kg

    setMetrics({
      ...metrics,
      bmi,
      bmiCategory,
      weightChangeType,
      totalChange,
      estimatedCaloriesPerDay,
      idealWeight,
      weeklyChange,
      expectedDate,
    });
  };

  const showHealthAlert = () => {
    const currentWeight = parseFloat(formData.currentWeight);
    const targetWeight = parseFloat(formData.targetWeight);
    const weightDiff = Math.abs(targetWeight - currentWeight);
    const weeklyRate = weightDiff / (parseInt(formData.timeframe) * 7);

    if (weeklyRate > 1) {
      Alert.alert(
        'Health Consideration',
        'Your planned rate of weight change may be aggressive. Consider these factors:\n\n' +
        '• Sustainable weight change is typically 0.5-1kg per week\n' +
        '• Rapid weight changes may affect your health\n' +
        '• Gradual changes are more likely to be maintained\n\n' +
        'Would you like to adjust to a more moderate goal?',
        [
          { text: 'Keep Current Goal', style: 'cancel' },
          { text: 'Adjust Goal', onPress: () => setFormData(prev => ({ ...prev, weeklyGoal: 'moderate' })) }
        ],
        { cancelable: false }
      );
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const currentWeight = parseFloat(formData.currentWeight);
    const targetWeight = parseFloat(formData.targetWeight);

    if (!currentWeight || !targetWeight) {
      Alert.alert(
        'Missing Information',
        'Please enter both your current and target weights to continue.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }

    if (currentWeight < 30 || currentWeight > 300) {
      Alert.alert(
        'Invalid Weight',
        'Please enter a valid weight between 30-300 kg.\n\n' +
        'If your weight is outside this range, please consult with a healthcare provider.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }

    if (Math.abs(targetWeight - currentWeight) > 50) {
      Alert.alert(
        'Significant Weight Change',
        'You\'ve set a goal to change your weight by more than 50kg.\n\n' +
        '• This is a significant change\n' +
        '• Consider setting intermediate goals\n' +
        '• Consult with a healthcare provider\n\n' +
        'Would you like to proceed?',
        [
          { text: 'Review Goal', style: 'cancel' },
          { 
            text: 'Proceed', 
            style: 'default',
            onPress: () => {
              if (showHealthAlert()) {
                handleSave();
              }
            }
          }
        ]
      );
      return false;
    }

    return showHealthAlert();
  };

  const updateWeightGoal = async (goalData) => {
    try {
      const response = await fetch(
        `${API_URL}/user-goals/update-weight-goal/${user._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(goalData),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update weight goal');
      }
      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const fetchWeightGoal = async () => {
    try {
      const response = await fetch(`${API_URL}/user-goals/weight-goal/${user._id}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server response was not JSON");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update form with user data
        if (data.userData) {
          setFormData(prev => ({
            ...prev,
            currentWeight: data.userData.weight?.toString() || '',
            targetWeight: data.userData.targetWeight?.toString() || '',
          }));

          // Update user context if needed
          setUser(prev => ({
            ...prev,
            weight: data.userData.weight,
            targetWeight: data.userData.targetWeight,
          }));
        }

        // Update goal settings from weightGoals
        if (data.weightGoals) {
          setFormData(prev => ({
            ...prev,
            weeklyGoal: data.weightGoals.weeklyGoal,
            timeframe: data.weightGoals.timeframe,
            weightUnit: data.weightGoals.weightUnit,
          }));
        }

        // Trigger metrics calculation if we have both weights
        if (data.userData?.weight && data.userData?.targetWeight) {
          calculateMetrics();
        }
      }
    } catch (error) {
      console.error('Error fetching weight goal:', error);
      Alert.alert('Error', 'Failed to fetch weight goal data. Please try again later.');
    }
  };

  const trackWeightProgress = async (weight) => {
    try {
      const response = await fetch(`${API_URL}/user-goals/track-weight/${user._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to track weight');
      }
      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const goalData = {
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        weeklyGoal: formData.weeklyGoal,
        timeframe: formData.timeframe,
        weightUnit: formData.weightUnit,
      };

      const result = await updateWeightGoal(goalData);
      
      if (result.success) {
        // Track the weight progress
        await trackWeightProgress(goalData.currentWeight);
        
        setUser({
          ...user,
          weight: goalData.currentWeight,
          targetWeight: goalData.targetWeight,
        });
        
        Alert.alert('Success', 'Weight goal updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update weight goal');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightGoal();
  }, []);

  const MetricCard = ({ title, value, unit, icon, color = 'emerald', subtitle = null }) => {
    const { isDarkMode } = useTheme();
    const styles = getStyles(isDarkMode);
    return (
      <View style={{
        ...styles.metricCardContainer,
        backgroundColor: isDarkMode ? 'rgba(31,41,55,0.8)' : getColor(color, 50),
        borderColor: isDarkMode ? getColor('gray', 700) : undefined,
      }}>
        <View style={styles.flexBetween}>
          <View style={styles.flex1}>
            <Text style={{
              ...styles.metricCardTitle,
              color: getColor(color, 900),
            }}>{title}</Text>
            <View style={[styles.flexRow, styles.mt1]}>
              <Text style={{
                ...styles.metricCardValue,
                color: getColor(color, 800),
              }}>{value}</Text>
              {unit && (
                <Text style={{
                  color: getColor(color, 600),
                  marginLeft: 4,
                  fontSize: 16,
                }}>{unit}</Text>
              )}
            </View>
            {subtitle && (
              <Text style={{
                ...styles.metricCardSubtitle,
                color: getColor(color, 600),
              }}>
                {subtitle}
              </Text>
            )}
          </View>
          <View style={{
            ...styles.w10,
            ...styles.h10,
            ...styles.roundedFull,
            backgroundColor: getColor(color, 100),
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons 
              name={icon} 
              size={24} 
              color={color === 'emerald' ? '#047857' : '#0369a1'} 
            />
          </View>
        </View>
      </View>
    );
  };

  const weeklyGoalOptions = [
    { id: '1', label: 'Gentle (0.25 kg per week)', value: 'gentle' },
    { id: '2', label: 'Moderate (0.5 kg per week)', value: 'moderate' },
    { id: '3', label: 'Aggressive (1 kg per week)', value: 'aggressive' },
  ];

  const timeframeOptions = [
    { id: '1', label: '12 weeks program', value: '12_weeks' },
    { id: '2', label: '16 weeks program', value: '16_weeks' },
    { id: '3', label: '24 weeks program', value: '24_weeks' },
  ];

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? getColor('gray', 900) : getColor('gray', 50),
    }}>
      <View style={{
        ...styles.flexBetween,
        ...styles.px4,
        ...styles.py4,
        backgroundColor: isDarkMode ? getColor('gray', 800) : '#fff',
        borderBottomWidth: 1,
        borderColor: isDarkMode ? getColor('gray', 700) : getColor('gray', 100),
      }}>
        <View style={styles.flexRow}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{
              ...styles.p2,
              marginLeft: -8,
              borderRadius: 999,
              backgroundColor: undefined,
            }}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            marginLeft: 8,
            color: isDarkMode ? getColor('gray', 200) : getColor('gray', 900),
          }}>
            Weight Goal
          </Text>
        </View>
      </View>

      <ScrollView style={{
        flex: 1,
        backgroundColor: isDarkMode ? getColor('gray', 900) : getColor('gray', 50),
      }} showsVerticalScrollIndicator={false}>
        {/* Weight Input Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.flexBetween}>
            <Text style={styles.sectionTitle}>Current Stats</Text>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>{formData.weightUnit.toUpperCase()}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#047857" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Current Weight</Text>
          <TextInput
            value={formData.currentWeight}
            onChangeText={(text) => setFormData(prev => ({ ...prev, currentWeight: text }))}
            keyboardType="decimal-pad"
            placeholder="Enter current weight"
            style={{ ...styles.input, marginBottom: 16 }}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>Target Weight</Text>
          <TextInput
            value={formData.targetWeight}
            onChangeText={(text) => setFormData(prev => ({ ...prev, targetWeight: text }))}
            keyboardType="decimal-pad"
            placeholder="Enter target weight"
            style={styles.input}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Goal Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Goal Settings</Text>
          
          <View style={styles.pickerContainer}>
            <CustomPicker
              value={formData.weeklyGoal}
              items={weeklyGoalOptions}
              onValueChange={(value) => setFormData(prev => ({ ...prev, weeklyGoal: value }))}
            />
          </View>

          <View style={styles.pickerContainer}>
            <CustomPicker
              value={formData.timeframe}
              items={timeframeOptions}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
            />
          </View>
        </View>

        {/* Enhanced Metrics Display */}
        {metrics.bmi > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Health Insights</Text>
            
            <MetricCard
              title="Body Mass Index (BMI)"
              value={metrics.bmi}
              icon="human"
              color={metrics.bmiCategory.color}
              subtitle={`Category: ${metrics.bmiCategory.label}`}
            />

            <MetricCard
              title="Weight Change Goal"
              value={metrics.totalChange}
              unit="kg"
              icon="scale"
              color="blue"
              subtitle={metrics.weightChangeType}
            />

            <MetricCard
              title="Recommended Range"
              value={`${metrics.idealWeight.min} - ${metrics.idealWeight.max}`}
              unit="kg"
              icon="chart-bell-curve"
              color="emerald"
              subtitle="Based on healthy BMI range"
            />

            <MetricCard
              title="Weekly Target"
              value={metrics.weeklyChange}
              unit="kg/week"
              icon="trending-up"
              color="blue"
              subtitle={`~${metrics.estimatedCaloriesPerDay} calories/day adjustment`}
            />

            {metrics.expectedDate && (
              <MetricCard
                title="Goal Achievement"
                value={metrics.expectedDate.toLocaleDateString()}
                icon="calendar"
                color="emerald"
                subtitle={`${formData.timeframe.replace('_', ' ')} program`}
              />
            )}
          </View>
        )}

        {/* Save Button */}
        <View style={styles.px4}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{ transform: [{ scale: 0.98 }], marginBottom: 24 }}
          >
            <LinearGradient
              colors={['#15803d', '#166534']}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Goal'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WeightGoal;

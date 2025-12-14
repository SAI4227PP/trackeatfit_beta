import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomPicker from '../../../components/CustomPicker';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const getColor = (color, shade) => {
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
      50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827'
    }
  };
  return colors[color]?.[shade] || '#fff';
};

const getStyles = (isDarkMode) => ({
  pickerContainer: {
    backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
    borderColor: isDarkMode ? getColor('gray', 700) : getColor('gray', 200),
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
    borderRadius: 16,
  },
  section: {
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: isDarkMode ? getColor('gray', 700) : getColor('gray', 200),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 500),
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 700),
  },
  input: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
    color: isDarkMode ? getColor('gray', 200) : getColor('gray', 700),
    marginBottom: 0,
  },
  errorText: {
    color: getColor('red', 400),
    fontSize: 14,
    marginTop: 4,
  },
  metricsContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
  },
  metricsTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: isDarkMode ? getColor('gray', 300) : getColor('gray', 700),
  },
  metricsLabel: {
    fontSize: 14,
    color: isDarkMode ? getColor('gray', 400) : getColor('gray', 600),
  },
  metricsValue: {
    fontWeight: '600',
    color: isDarkMode ? getColor('gray', 300) : getColor('gray', 700),
  },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  flexBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flexWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  wHalf: { width: '48%' },
  mb2: { marginBottom: 8 },
  mb4: { marginBottom: 16 },
  mb6: { marginBottom: 24 },
  px4: { paddingHorizontal: 16 },
  py4: { paddingVertical: 16 },
  py1_5: { paddingVertical: 6 },
  p2: { padding: 8 },
  p4: { padding: 16 },
  roundedFull: { borderRadius: 999 },
  ml2: { marginLeft: 8 },
  mt1: { marginTop: 4 },
  textRed: { color: getColor('red', 400) },
  textWhite: { color: '#fff' },
  textCenter: { textAlign: 'center' },
  fontBold: { fontWeight: '700' },
  fontMedium: { fontWeight: '500' },
  fontSemibold: { fontWeight: '600' },
  textSm: { fontSize: 14 },
  textBase: { fontSize: 16 },
  textLg: { fontSize: 18 },
  textXl: { fontSize: 20 },
});

const FormSection = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  return (
    <View style={styles.section}>
      <View style={[styles.flexRow, { marginBottom: 16 }]}>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.divider} />
      </View>
      {children}
    </View>
  );
};

const UserDetails = () => {
  const { user, updateUser } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    personal: {
      age: '',
      gender: 'select',
      height: '',
      weight: ''
    },
    health: {
      medicalConditions: [],
      allergies: [],
      medications: [],
      bloodType: 'unknown',
      dietaryRestrictions: 'none',
      activityLevel: 'sedentary',
      supplementsUsed: [],
      foodIntolerances: []
    },
    goals: {
      weightGoal: 'maintain',
      mealFrequency: '3_meals',
      dietaryPreference: 'no_preference',
      weeklyExerciseDays: '3',
      preferredExerciseTypes: []
    },
    metrics: {
      bmi: null,
      bmr: null,
      tdee: null,
      idealWeightRange: { min: null, max: null }
    }
  });

  // Add state for metrics display
  const [metrics, setMetrics] = useState({
    bmi: null,
    bmr: null,
    tdee: null,
    idealWeightRange: { min: null, max: null }
  });

  // Add username state
  const [username, setUsername] = useState('');

  // Update validation rules to remove name validation
  const validateField = useCallback((section, field, value) => {
    if (!value || value === '') return ''; // Allow empty values
    
    switch (field) {
      case 'age':
        const age = parseFloat(value);
        return !isNaN(age) && age >= 13 && age <= 120 ? '' : 'Age must be between 13 and 120';
      case 'height':
        const height = parseFloat(value);
        return !isNaN(height) && height > 0 && height < 300 ? '' : 'Height must be between 0 and 300 cm';
      case 'weight':
        const weight = parseFloat(value);
        return !isNaN(weight) && weight > 0 && weight < 500 ? '' : 'Weight must be between 0 and 500 kg';
      default:
        return '';
    }
  }, []);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      // Recalculate metrics if any of the relevant fields change
      if (
        (section === 'personal' && ['age', 'height', 'weight', 'gender'].includes(field)) ||
        (section === 'health' && field === 'activityLevel')
      ) {
        // Only calculate if we have all required fields
        if (
          newFormData.personal.height && 
          newFormData.personal.weight && 
          newFormData.personal.age
        ) {
          const newMetrics = calculateHealthMetrics(newFormData);
          setMetrics(newMetrics);
        }
      }

      return newFormData;
    });
    
    // Use nested path for errors
    const error = validateField(section, field, value);
    const errorKey = `${section}.${field}`;
    setErrors(prev => ({ ...prev, [errorKey]: error }));
  };

  const calculateHealthMetrics = (data) => {
    const height = parseFloat(data.personal.height) / 100; // convert to meters
    const weight = parseFloat(data.personal.weight);
    const age = parseFloat(data.personal.age);

    // Only calculate if we have valid numbers
    if (isNaN(height) || isNaN(weight) || isNaN(age)) {
      return {
        bmi: 0,
        bmr: 0,
        tdee: 0,
        idealWeightRange: { min: 0, max: 0 }
      };
    }

    // Calculate BMI
    const bmi = Number((weight / (height * height)).toFixed(1));

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (data.personal.gender === 'male') {
      bmr = (10 * weight) + (6.25 * data.personal.height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * data.personal.height) - (5 * age) - 161;
    }

    bmr = Math.round(bmr);

    // Calculate TDEE
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      super_active: 1.9,
    };
    
    const tdee = Math.round(bmr * (activityMultipliers[data.health.activityLevel] || 1.2));

    // Calculate Ideal Weight Range (using BMI method)
    const minHealthyBMI = 18.5;
    const maxHealthyBMI = 24.9;
    const idealWeightRange = {
      min: Math.round(minHealthyBMI * height * height),
      max: Math.round(maxHealthyBMI * height * height),
    };

    return {
      bmi: bmi,
      bmr: bmr,
      tdee: tdee,
      idealWeightRange
    };
  };

  // Update API integration function
  const updateHealthDetails = async (userData) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/health-details/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update health details');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  };

  const handleSave = async () => {
    // Validate all required fields
    const newErrors = {};
    const fieldsToValidate = [
      { section: 'personal', field: 'age' },
      { section: 'personal', field: 'height' },
      { section: 'personal', field: 'weight' }
    ];

    fieldsToValidate.forEach(({ section, field }) => {
      const error = validateField(section, field, formData[section][field]);
      if (error) {
        newErrors[`${section}.${field}`] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please check all required fields');
      return;
    }

    setLoading(true);
    try {
      const healthMetrics = calculateHealthMetrics(formData);
      
      const updatedUserData = {
        ...formData,
        metrics: healthMetrics,
        meta: {
          lastUpdated: new Date().toISOString()
        }
      };

      const result = await updateHealthDetails(updatedUserData);
      
      // Update metrics display
      setMetrics(healthMetrics);
      
      // Update global context if needed
      if (updateUser) {
        await updateUser(result.user);
      }

      Alert.alert('Success', 'Health profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update health profile');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadHealthDetails = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/users/health-details/${user._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load health details');
        }

        const { data } = await response.json();
        if (data) {
          const formDataToSet = {
            personal: data.personal || {},
            health: data.health || {},
            goals: data.goals || {},
            metrics: data.metrics || {}
          };
          
          setFormData(formDataToSet);
          
          // Calculate metrics if we have the required data
          if (formDataToSet.personal?.height && 
              formDataToSet.personal?.weight && 
              formDataToSet.personal?.age) {
            const calculatedMetrics = calculateHealthMetrics(formDataToSet);
            setMetrics(calculatedMetrics);
          }

          setUsername(data.username || user?.username || '');
        }
      } catch (error) {
        console.error('Failed to load health details:', error);
        Alert.alert('Error', 'Failed to load health profile');
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      loadHealthDetails();
    }
  }, [user?._id]);

  const renderInputField = (label, section, field, placeholder, keyboardType = 'default', required = true) => {
    const styles = getStyles(isDarkMode);
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.textRed}>*</Text>}
        </Text>
        <TextInput
          value={String(formData[section][field] || '')}
          onChangeText={(text) => handleInputChange(section, field, text)}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {errors[`${section}.${field}`] && (
          <Text style={styles.errorText}>{errors[`${section}.${field}`]}</Text>
        )}
      </View>
    );
  };

  const genderOptions = [
    { id: '1', label: 'Male', value: 'male' },
    { id: '2', label: 'Female', value: 'female' },
    { id: '3', label: 'Other', value: 'other' }
  ];

  const activityOptions = [
    { id: '1', label: 'Sedentary (little or no exercise)', value: 'sedentary' },
    { id: '2', label: 'Lightly active (1-3 days/week)', value: 'light' },
    { id: '3', label: 'Moderately active (3-5 days/week)', value: 'moderate' },
    { id: '4', label: 'Very active (6-7 days/week)', value: 'very_active' },
    { id: '5', label: 'Super active (athlete/physical job)', value: 'super_active' },
  ];

  const bloodTypeOptions = [
    { id: '1', label: 'A+', value: 'a_positive' },
    { id: '2', label: 'A-', value: 'a_negative' },
    { id: '3', label: 'B+', value: 'b_positive' },
    { id: '4', label: 'B-', value: 'b_negative' },
    { id: '5', label: 'AB+', value: 'ab_positive' },
    { id: '6', label: 'AB-', value: 'ab_negative' },
    { id: '7', label: 'O+', value: 'o_positive' },
    { id: '8', label: 'O-', value: 'o_negative' },
    { id: '9', label: 'Unknown', value: 'unknown' },
  ];

  const dietaryOptions = [
    { id: '1', label: 'No Restrictions', value: 'none' },
    { id: '2', label: 'Vegetarian', value: 'vegetarian' },
    { id: '3', label: 'Vegan', value: 'vegan' },
    { id: '4', label: 'Pescatarian', value: 'pescatarian' },
    { id: '5', label: 'Keto', value: 'keto' },
    { id: '6', label: 'Paleo', value: 'paleo' },
  ];

  const mealFrequencyOptions = [
    { id: '1', label: '3 meals per day', value: '3_meals' },
    { id: '2', label: '4-5 small meals', value: '4_5_meals' },
    { id: '3', label: '6 small meals', value: '6_meals' },
    { id: '4', label: 'Intermittent fasting', value: 'intermittent_fasting' },
  ];

  const renderPicker = (label, section, field, options, required = true) => {
    const styles = getStyles(isDarkMode);
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.textRed}>*</Text>}
        </Text>
        <View style={styles.pickerContainer}>
          <CustomPicker
            value={formData[section][field]}
            items={options}
            onValueChange={(value) => handleInputChange(section, field, value)}
          />
        </View>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  // Add Metrics Display Component
  const MetricsDisplay = () => {
    const styles = getStyles(isDarkMode);
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Health Metrics</Text>
        <View style={styles.flexWrap}>
          <View style={[styles.mb2, styles.wHalf]}>
            <Text style={styles.metricsLabel}>BMI</Text>
            <Text style={styles.metricsValue}>
              {metrics.bmi > 0 ? metrics.bmi.toFixed(1) : 'N/A'}
            </Text>
          </View>
          <View style={[styles.mb2, styles.wHalf]}>
            <Text style={styles.metricsLabel}>BMR</Text>
            <Text style={styles.metricsValue}>
              {metrics.bmr > 0 ? `${metrics.bmr} kcal` : 'N/A'}
            </Text>
          </View>
          <View style={[styles.mb2, styles.wHalf]}>
            <Text style={styles.metricsLabel}>TDEE</Text>
            <Text style={styles.metricsValue}>
              {metrics.tdee > 0 ? `${metrics.tdee} kcal` : 'N/A'}
            </Text>
          </View>
          <View style={styles.mb2}>
            <Text style={styles.metricsLabel}>Ideal Weight Range</Text>
            <Text style={styles.metricsValue}>
              {metrics.idealWeightRange?.min > 0 && metrics.idealWeightRange?.max > 0
                ? `${metrics.idealWeightRange.min}-${metrics.idealWeightRange.max} kg`
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? getColor('gray', 900) : '#fff',
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 100),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            marginLeft: 8,
            color: isDarkMode ? getColor('gray', 200) : getColor('gray', 900),
          }}>Health Profile</Text>
        </View>
        {loading && <ActivityIndicator color="#15803d" />}
      </View>

      <ScrollView style={{
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: isDarkMode ? getColor('gray', 900) : '#fff',
      }} showsVerticalScrollIndicator={false}>
        <FormSection title="BASIC INFORMATION">
          <View style={getStyles(isDarkMode).inputContainer}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              marginBottom: 8,
              color: isDarkMode ? getColor('gray', 300) : getColor('gray', 700),
            }}>Username</Text>
            <Text style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: isDarkMode ? getColor('gray', 800) : getColor('gray', 50),
              color: isDarkMode ? getColor('gray', 300) : getColor('gray', 700),
            }}>
              {username || user?.username || 'No username set'}
            </Text>
          </View>
          {renderInputField('Age', 'personal', 'age', 'Enter your age', 'numeric')}
          {renderPicker('Gender', 'personal', 'gender', genderOptions)}
        </FormSection>

        <FormSection title="PHYSICAL METRICS">
          {renderInputField('Height (cm)', 'personal', 'height', 'Enter your height', 'numeric')}
          {renderInputField('Weight (kg)', 'personal', 'weight', 'Enter your weight', 'numeric')}
          <MetricsDisplay />
        </FormSection>

        <FormSection title="HEALTH PROFILE">
          {renderPicker('Activity Level', 'health', 'activityLevel', activityOptions)}
          {renderPicker('Blood Type', 'health', 'bloodType', bloodTypeOptions, false)}
        </FormSection>

        <FormSection title="NUTRITION PREFERENCES">
          {renderPicker('Dietary Restrictions', 'health', 'dietaryRestrictions', dietaryOptions)}
          {renderPicker('Meal Frequency', 'goals', 'mealFrequency', mealFrequencyOptions)}
        </FormSection>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ marginBottom: 32 }}
        >
          <LinearGradient
            colors={['#15803d', '#166534']}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 16,
            }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserDetails;

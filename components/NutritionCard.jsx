import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const NutrientItem = ({ label, value, unit = 'g', icon, color }) => {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? `${color}30` : `${color}20`
          }}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={{
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            fontSize: 18,
            fontWeight: '500',
            marginLeft: 12
          }}>
            {label}
          </Text>
        </View>
        <Text style={{
          color: isDarkMode ? '#f3f4f6' : '#111827',
          fontWeight: '600'
        }}>
          {value} {unit}
        </Text>
      </View>
    </LinearGradient>
  );
};

const MicroNutrientItem = ({ label, value, unit, color = "#374151" }) => {
  const { isDarkMode } = useTheme();
  const formatValue = (val) => {
    if (val === undefined || val === null) return '0';
    const numValue = parseFloat(val);
    return isNaN(numValue) ? '0' : numValue.toFixed(1);
  };

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8
    }}>
      <Text style={{ color: isDarkMode ? '#d1d5db' : '#4b5563' }}>{label}</Text>
      <Text style={{
        fontWeight: '500',
        color: isDarkMode ? '#e5e7eb' : color
      }}>
        {formatValue(value)} {unit}
      </Text>
    </View>
  );
};

const NutritionSection = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: isDarkMode ? '#f3f4f6' : '#1f2937',
        marginBottom: 8
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
        borderRadius: 12,
        padding: 12
      }}>
        {children}
      </View>
    </View>
  );
};

const NutritionCard = ({ loading, nutrition }) => {
  const { isDarkMode } = useTheme();
  const defaultNutrition = {
    calcium: 0,
    calories: 0,
    carbs: 0,
    cholesterol: 0,
    fats: 0,
    fiber: 0,
    iron: 0,
    monounsaturated_fat: 0,
    polyunsaturated_fat: 0,
    potassium: 0,
    protein: 0,
    saturated_fat: 0,
    sodium: 0,
    sugar: 0,
    vitamin_a: 0,
    vitamin_c: 0
  };

  const safeNutrition = { ...defaultNutrition, ...(nutrition || {}) };

  Object.keys(safeNutrition).forEach(key => {
    safeNutrition[key] = parseFloat(safeNutrition[key]) || 0;
  });

  if (!nutrition && !loading) {
    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <LinearGradient
          colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
          style={{
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}
        >
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: isDarkMode ? '#f3f4f6' : '#111827',
            marginBottom: 16
          }}>
            Nutrition Facts
          </Text>
          <Text style={{
            color: '#6b7280',
            textAlign: 'center',
            paddingVertical: 16
          }}>
            No nutrition data available
          </Text>
        </LinearGradient>
      </ScrollView>
    );
  }

  const {
    calcium, calories, carbs, cholesterol,
    fats, fiber, iron, monounsaturated_fat,
    polyunsaturated_fat, potassium, protein,
    saturated_fat, sodium, sugar, vitamin_a,
    vitamin_c
  } = safeNutrition;

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: isDarkMode ? '#f3f4f6' : '#111827',
          marginBottom: 16
        }}>
          Nutrition Facts
        </Text>

        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <NutritionSection title="Energy & Macronutrients">
              <MicroNutrientItem 
                label="Calories" 
                value={calories} 
                unit="kcal" 
                color="#15803d"
              />
              <NutrientItem 
                label="Protein" 
                value={protein.toFixed(1)} 
                icon="fitness-outline" 
                color="#059669"
              />
              <NutrientItem 
                label="Carbs" 
                value={carbs.toFixed(1)} 
                icon="leaf-outline" 
                color="#7C3AED"
              />
              <NutrientItem 
                label="Fats" 
                value={fats.toFixed(1)} 
                icon="water-outline" 
                color="#EA580C"
              />
            </NutritionSection>

            <NutritionSection title="Fats Breakdown">
              <MicroNutrientItem 
                label="Saturated Fat" 
                value={saturated_fat.toFixed(1)} 
                unit="g"
              />
              <MicroNutrientItem 
                label="Monounsaturated" 
                value={monounsaturated_fat.toFixed(1)} 
                unit="g"
              />
              <MicroNutrientItem 
                label="Polyunsaturated" 
                value={polyunsaturated_fat.toFixed(1)} 
                unit="g"
              />
            </NutritionSection>

            <NutritionSection title="Carbohydrates Detail">
              <MicroNutrientItem 
                label="Dietary Fiber" 
                value={fiber.toFixed(1)} 
                unit="g"
              />
              <MicroNutrientItem 
                label="Sugar" 
                value={sugar.toFixed(1)} 
                unit="g"
              />
            </NutritionSection>

            <NutritionSection title="Minerals">
              <MicroNutrientItem 
                label="Sodium" 
                value={sodium} 
                unit="mg"
              />
              <MicroNutrientItem 
                label="Potassium" 
                value={potassium} 
                unit="mg"
              />
              <MicroNutrientItem 
                label="Calcium" 
                value={calcium} 
                unit="mg"
              />
              <MicroNutrientItem 
                label="Iron" 
                value={iron} 
                unit="mg"
              />
              <MicroNutrientItem 
                label="Cholesterol" 
                value={cholesterol} 
                unit="mg"
              />
            </NutritionSection>

            <NutritionSection title="Vitamins">
              <MicroNutrientItem 
                label="Vitamin A" 
                value={vitamin_a} 
                unit="%"
              />
              <MicroNutrientItem 
                label="Vitamin C" 
                value={vitamin_c} 
                unit="mg"
              />
            </NutritionSection>
          </>
        )}
      </LinearGradient>
    </ScrollView>
  );
};

export default NutritionCard;

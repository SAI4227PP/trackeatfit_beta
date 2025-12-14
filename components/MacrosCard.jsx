import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Dimensions, ScrollView, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const MacroIndicator = ({ type, value, color, percentage }) => {
  const { isDarkMode } = useTheme();
  const gradientColors = {
    Protein: isDarkMode ? ['#064e3b', '#065f46'] : ['#E8F5E9', '#C8E6C9'],
    Carbs: isDarkMode ? ['#1e3a8a', '#1e40af'] : ['#E8EAF6', '#C5CAE9'],
    Fats: isDarkMode ? ['#92400e', '#b45309'] : ['#FFF3E0', '#FFE0B2']
  };

  return (
    <LinearGradient
      colors={gradientColors[type]}
      style={{
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        width: '100%',
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ 
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: isDarkMode ? `${color}30` : `${color}15`,
            borderWidth: 1,
            borderColor: isDarkMode ? `${color}50` : `${color}30`
          }}>
            <Ionicons 
              name={type === 'Protein' ? 'fitness' : type === 'Carbs' ? 'leaf' : 'water'} 
              size={24} 
              color={color}
            />
          </View>
          <View>
            <Text style={{
              color: isDarkMode ? '#f3f4f6' : '#1f2937',
              fontWeight: '600',
              fontSize: 18
            }}>
              {type}
            </Text>
            <Text style={{
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: 14
            }}>
              {percentage}% of total
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 30, fontWeight: '700', color }}>
            {value}
          </Text>
          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: 14
          }}>
            grams
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const MacrosCard = ({ macrosPieData, totalProtein, totalCarbs, totalFats, loading }) => {
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 24,
          padding: 24,
          shadowColor: isDarkMode ? '#000' : '#1f2937',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 15,
          elevation: 5,
          justifyContent: 'center',
          alignItems: 'center',
          height: 160
        }}
      >
        <ActivityIndicator size="large" color={isDarkMode ? '#10B981' : '#047857'} />
      </LinearGradient>
    );
  }

  const totalMacros = totalProtein + totalCarbs + totalFats;
  const macroPercentages = {
    protein: ((totalProtein / totalMacros) * 100).toFixed(1),
    carbs: ((totalCarbs / totalMacros) * 100).toFixed(1),
    fats: ((totalFats / totalMacros) * 100).toFixed(1),
  };

  const chartColors = {
    Protein: isDarkMode ? '#34d399' : '#059669',
    Carbs: isDarkMode ? '#818cf8' : '#6366F1',
    Fats: isDarkMode ? '#fbbf24' : '#F59E0B'
  };

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ 
        flexGrow: 1,
        paddingVertical: 16
      }}
    >
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={{
          borderRadius: 24,
          padding: 24,
          shadowColor: isDarkMode ? '#000' : '#1f2937',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 15,
          elevation: 5,
        }}
      >
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 24
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDarkMode ? '#f3f4f6' : '#111827'
          }}>
            Macros Distribution
          </Text>
          <View style={{
            backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 9999
          }}>
            <Text style={{
              color: isDarkMode ? '#ecfdf5' : '#059669',
              fontWeight: '500'
            }}>
              Daily
            </Text>
          </View>
        </View>
        
        <View style={{ marginVertical: 12 }}>
          {[
            { type: 'Protein', value: totalProtein, percentage: macroPercentages.protein },
            { type: 'Carbs', value: totalCarbs, percentage: macroPercentages.carbs },
            { type: 'Fats', value: totalFats, percentage: macroPercentages.fats }
          ].map(macro => (
            <MacroIndicator 
              key={macro.type}
              {...macro}
              color={chartColors[macro.type]}
            />
          ))}
        </View>

        <View style={{
          marginTop: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          borderRadius: 24,
          padding: 16
        }}>
          <View style={{ height: 250 }}>
            <PieChart
              data={macrosPieData.map(item => ({
                ...item,
                color: chartColors[item.name],
                legendFontColor: isDarkMode ? '#f3f4f6' : '#1f2937'
              }))}
              width={Dimensions.get('window').width - 80}
              height={250}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 1,
                color: (opacity = 1) => isDarkMode 
                  ? `rgba(243, 244, 246, ${opacity})`
                  : `rgba(31, 41, 55, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={false}
              center={[Dimensions.get('window').width / 6, 0]}
            />
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
};

export default MacrosCard;

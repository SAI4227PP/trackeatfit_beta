import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const SummaryCard = ({ caloriesConsumed, caloriesRemaining, macros }) => {
  // Pie chart data for macronutrient breakdown
  const data = [
    { name: 'Carbs', population: macros.carbs, color: '#FF6347', legendFontColor: '#FF6347', legendFontSize: 15 },
    { name: 'Protein', population: macros.protein, color: '#1E90FF', legendFontColor: '#1E90FF', legendFontSize: 15 },
    { name: 'Fats', population: macros.fats, color: '#32CD32', legendFontColor: '#32CD32', legendFontSize: 15 },
  ];

  return (
    <View className="bg-gray-800 p-5 rounded-lg shadow-lg mb-4">
      {/* Horizontal Scroll View */}
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
        {/* Calories and Remaining Calories Section */}
        <View className="flex-row justify-between items-center mr-5">
          {/* Calories Consumed */}
          <View className="mr-3">
            <Text className="text-white text-4xl font-bold">{caloriesConsumed}</Text>
            <Text className="text-gray-300 text-lg">kcal Consumed</Text>
          </View>

          {/* Remaining Calories */}
          <View className="ml-3">
            <Text className="text-white text-3xl font-bold">{caloriesRemaining}</Text>
            <Text className="text-gray-300 text-lg">kcal Remaining</Text>
          </View>
        </View>

        {/* Macronutrient Breakdown - Pie Chart */}
        <View className="ml-5">
          <Text className="text-white text-2xl font-bold mb-3">Macronutrient Breakdown</Text>
          <PieChart
            data={data}
            width={300} // Chart width
            height={200} // Chart height
            chartConfig={{
              backgroundColor: '#1e1e1e',
              backgroundGradientFrom: '#000000',
              backgroundGradientTo: '#000000',
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#fff',
              },
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default SummaryCard;

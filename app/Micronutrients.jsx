import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

// Memoized FlatList item render
const ListItem = React.memo(({ item, onSelect }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
      }}
      onPress={() => onSelect(item)}
    >
      <Text
        style={{
          color: isDarkMode ? '#f3f4f6' : '#000',
          textAlign: 'center',
        }}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );
});

const Micronutrients = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('PERCENTAGE');
  const { user } = useGlobalContext(); // Getting user context for user ID

  const userId = user?.$id || user?._id;


  // Default middle percentages for each nutrient
  const [middlePercentageCarbs, setMiddlePercentageCarbs] = useState(50);
  const [middlePercentageProteins, setMiddlePercentageProteins] = useState(50);
  const [middlePercentageFats, setMiddlePercentageFats] = useState(50);

  // Grams values will be calculated based on the percentage
  const [gramsCarbs, setGramsCarbs] = useState(248.5); // Default value at 50% of 497g (max)
  const [gramsProteins, setGramsProteins] = useState(249.5); // Default value at 50% of 498g (max)
  const [gramsFats, setGramsFats] = useState(110.5); // Default value at 50% of 221g (max)

  const navigation = useNavigation();

  // Maximum and minimum values for each nutrient
  const nutrientLimits = {
    Fats: { min: 0, max: 221 },
    Proteins: { min: 0, max: 498 },
    Carbs: { min: 0, max: 497 }
  };

  // Generate range for percentage values (0% to 100%) with step of 5
  const percentageOptions = Array.from({ length: 21 }, (_, i) => `${i * 5}%`);

  // Helper function to calculate grams based on percentage for each nutrient
  const calculateGramsFromPercentage = useCallback((nutrient, percentage) => {
    const { min, max } = nutrientLimits[nutrient];
    const percentageValue = parseInt(percentage, 10); // Convert percentage to a number
    const grams = ((percentageValue / 100) * (max - min)) + min;
    return grams.toFixed(2); // Return grams as a string with two decimal places
  }, []);

  // Scroll handler to update the middle percentage and grams for a specific nutrient
  const onScroll = useCallback((event, nutrient) => {
    const contentOffset = event.nativeEvent.contentOffset.y;
    const middleOffset = contentOffset + 80; // Adjusted for middle item position (itemHeight/2)

    const middleIndex = Math.floor(middleOffset / 40); // Calculate the middle index
    const middleValue = percentageOptions[middleIndex];

    if (nutrient === 'Carbs') {
      const grams = calculateGramsFromPercentage('Carbs', middleValue);
      setMiddlePercentageCarbs(parseInt(middleValue, 10));
      setGramsCarbs(grams);
    } else if (nutrient === 'Proteins') {
      const grams = calculateGramsFromPercentage('Proteins', middleValue);
      setMiddlePercentageProteins(parseInt(middleValue, 10));
      setGramsProteins(grams);
    } else if (nutrient === 'Fats') {
      const grams = calculateGramsFromPercentage('Fats', middleValue);
      setMiddlePercentageFats(parseInt(middleValue, 10));
      setGramsFats(grams);
    }
  }, [calculateGramsFromPercentage]);

  // Calculate the total percentage of all macronutrients
  const totalPercentage = middlePercentageCarbs + middlePercentageProteins + middlePercentageFats;

  // Determine if the total percentage is valid (exactly 100%)
  const isTotalPercentageValid = totalPercentage === 100;

  const handleSaveData = useCallback(async () => {
    try {
      if (!isTotalPercentageValid) {
        alert('Total percentage must equal 100%');
        return;
      }

      // Convert grams values to strings (already done)
      const gramsCarbsStr = gramsCarbs.toString();
      const gramsProteinsStr = gramsProteins.toString();
      const gramsFatsStr = gramsFats.toString();

      // Calculate weight by adding the grams of each macronutrient
      const weight = (parseFloat(gramsCarbsStr) + parseFloat(gramsProteinsStr) + parseFloat(gramsFatsStr)).toString();

      // Log the values to check if they are correct
      console.log("gramsCarbsStr:", gramsCarbsStr);
      console.log("gramsProteinsStr:", gramsProteinsStr);
      console.log("gramsFatsStr:", gramsFatsStr);
      console.log("weight:", weight); // Check the calculated weight
      console.log("middlePercentageCarbs:", middlePercentageCarbs);
      console.log("middlePercentageFats:", middlePercentageFats);
      console.log("middlePercentageProteins:", middlePercentageProteins);

      // Save data to mongodb
      const response = await fetch(`${API_URL}/macronutrient/save-macronutrient-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carbsPercentage: middlePercentageCarbs,
          proteinsPercentage: middlePercentageProteins,
          fatsPercentage: middlePercentageFats,
          gramsCarbs: gramsCarbsStr,
          gramsProteins: gramsProteinsStr,
          gramsFats: gramsFatsStr,
          weight,
          userId
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Data saved successfully!');
        console.log('Response:', data);
      } else {
        alert('Error saving data: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving macronutrient data');
    }
  }, [isTotalPercentageValid, gramsCarbs, gramsProteins, gramsFats, middlePercentageCarbs, middlePercentageProteins, middlePercentageFats, userId]);

  // Fetch previously stored macronutrient data when the component mounts
  // Fetch Stored Data on mount
  useEffect(() => {
    const fetchStoredData = async () => {
      try {
        if (!userId) return;
        const response = await fetch(`${API_URL}/macronutrient/get-macronutrient-data/${userId}`);
        const data = await response.json();

        if (response.ok && data.data) {
          const macronutrientData = data.data;
          setMiddlePercentageCarbs(parseInt(macronutrientData.carbsPercentage, 10) || 50);
          setMiddlePercentageProteins(parseInt(macronutrientData.proteinsPercentage, 10) || 50);
          setMiddlePercentageFats(parseInt(macronutrientData.fatsPercentage, 10) || 50);

          setGramsCarbs(parseFloat(macronutrientData.carbsWeight) || 248.5);
          setGramsProteins(parseFloat(macronutrientData.proteinsWeight) || 249.5);
          setGramsFats(parseFloat(macronutrientData.fatsWeight) || 110.5);
        } else {
          alert('No data found for this user');
        }
      } catch (error) {
        console.error('Error fetching stored macronutrient data:', error);
        Alert.alert('Error', 'Failed to load previous macronutrient data');
      }
    };

    fetchStoredData();
  }, [userId]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={30} color={isDarkMode ? '#d1d5db' : 'black'} />
            <Text
              style={{
                color: isDarkMode ? '#f3f4f6' : '#000',
                fontWeight: '600',
                fontSize: 20,
                marginLeft: 8,
              }}
            >
              Micronutrients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, alignItems: 'flex-end' }}
            onPress={handleSaveData}
            disabled={!isTotalPercentageValid}
          >
            <Icon
              name="check-circle"
              size={30}
              color={
                isTotalPercentageValid
                  ? isDarkMode
                    ? '#34d399'
                    : 'lightgreen'
                  : isDarkMode
                  ? '#374151'
                  : '#B5C99A'
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
          paddingVertical: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('PERCENTAGE')}
          style={{
            paddingVertical: 8,
            borderBottomWidth: activeTab === 'PERCENTAGE' ? 2 : 0,
            borderBottomColor: isDarkMode ? '#f3f4f6' : '#000',
          }}
        >
          <Text
            style={{
              color: isDarkMode ? '#f3f4f6' : '#000',
              fontWeight: '500',
              fontSize: 18,
            }}
          >
            PERCENTAGE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('GRAMS')}
          style={{
            paddingVertical: 8,
            borderBottomWidth: activeTab === 'GRAMS' ? 2 : 0,
            borderBottomColor: isDarkMode ? '#f3f4f6' : '#000',
          }}
        >
          <Text
            style={{
              color: isDarkMode ? '#f3f4f6' : '#000',
              fontWeight: '500',
              fontSize: 18,
            }}
          >
            GRAMS
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
        {/* Carbs */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#000', fontWeight: '400', fontSize: 16 }}>Carbs</Text>
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#000', fontSize: 14 }}>
            {activeTab === 'PERCENTAGE'
              ? `${middlePercentageCarbs}% (${gramsCarbs}g)`
              : `${gramsCarbs}g`}
          </Text>
          <FlatList
            data={percentageOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <ListItem item={item} onSelect={(selectedItem) => alert(`Selected ${selectedItem} for Carbs`)} />
            )}
            style={{ maxHeight: 100, marginTop: 150 }}
            horizontal={false}
            onScroll={(event) => onScroll(event, 'Carbs')}
          />
        </View>

        {/* Proteins */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#000', fontWeight: '400', fontSize: 16 }}>Proteins</Text>
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#000', fontSize: 14 }}>
            {activeTab === 'PERCENTAGE'
              ? `${middlePercentageProteins}% (${gramsProteins}g)`
              : `${gramsProteins}g`}
          </Text>
          <FlatList
            data={percentageOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <ListItem item={item} onSelect={(selectedItem) => alert(`Selected ${selectedItem} for Proteins`)} />
            )}
            style={{ maxHeight: 100, marginTop: 150 }}
            horizontal={false}
            onScroll={(event) => onScroll(event, 'Proteins')}
          />
        </View>

        {/* Fats */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#000', fontWeight: '400', fontSize: 16 }}>Fats</Text>
          <Text style={{ color: isDarkMode ? '#d1d5db' : '#000', fontSize: 14 }}>
            {activeTab === 'PERCENTAGE'
              ? `${middlePercentageFats}% (${gramsFats}g)`
              : `${gramsFats}g`}
          </Text>
          <FlatList
            data={percentageOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <ListItem item={item} onSelect={(selectedItem) => alert(`Selected ${selectedItem} for Fats`)} />
            )}
            style={{ maxHeight: 100, marginTop: 150 }}
            horizontal={false}
            onScroll={(event) => onScroll(event, 'Fats')}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#000', fontSize: 18, fontWeight: '600' }}>%Total</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isTotalPercentageValid ? '#34d399' : '#ef4444',
            }}
          >
            {totalPercentage}%
          </Text>
        </View>
        <Text style={{ color: isDarkMode ? '#d1d5db' : '#000', fontSize: 14 }}>
          Macronutrients must equal 100%
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Micronutrients;

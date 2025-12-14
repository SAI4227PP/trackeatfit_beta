import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const DietPlanner = () => {
  const [responseText, setResponseText] = useState('');
  const [condition, setCondition] = useState('');
  const [disease, setDisease] = useState('');
  const [filteredConditions, setFilteredConditions] = useState([]);
  const [filteredDiseases, setFilteredDiseases] = useState([]);
  const [showConditionSuggestions, setShowConditionSuggestions] = useState(false);
  const [showDiseaseSuggestions, setShowDiseaseSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const navigation = useNavigation();

  const DIET_PLAN_PROMPT = 
  `Create a 7-day Indian diet plan for someone with ${condition} and ${disease}. 
  Start with Important Note in exactly this format with 5 points:

  **Important Note:**
  1. This is an informational diet plan only
  2. Consult healthcare providers before starting
  3. Individual needs may vary based on condition severity
  4. Regular monitoring and adjustment may be needed
  5. This plan should be part of a comprehensive treatment approach

  **Important Note:** This 7-day diet plan is designed for informational purposes only. Please consult healthcare professionals before starting any new diet regime, especially given your specific medical conditions.

  Then continue with the diet plan:
  **Day 1 (Approx. 1500-1600 Calories)**
  * **Breakfast (300 Calories):** [meal details]
  [and so on for each meal and day]

  End with Important Considerations:
  Important Considerations:
  - Medication Timing: Consider meal timing with medications
  - Allergies: Modify ingredients based on any food allergies
  - Portion Control: Adjust portions based on individual needs
  - Hydration: Maintain adequate water intake throughout the day
  - Monitoring: Keep track of any adverse reactions`;

  // Predefined lists
  const conditions = [
    "Acid Reflux (GERD)", "Addison's Disease", "Alopecia Areata", "Anxiety Disorders", "Arthritis", 
    "Asthma", "Attention Deficit Hyperactivity Disorder (ADHD)", "Autism Spectrum Disorder", "Bipolar Disorder", 
    "Cancer (Multiple Types)", "Chronic Fatigue Syndrome", "Chronic Pain", "Cystic Fibrosis", "Diabetes (Type 1, Type 2, Gestational)", 
    "Eczema", "Epilepsy", "Gout", "Heart Disease", "Hepatitis (A, B, C, D, E)", "High Blood Pressure (Hypertension)", 
    "Hypertension", "Irritable Bowel Syndrome (IBS)", "Kidney Disease", "Liver Disease", "Multiple Sclerosis", "Obesity", 
    "Osteoarthritis", "Osteoporosis", "Parkinson's Disease", "Post-Traumatic Stress Disorder (PTSD)", "Stroke", "Thyroid Disorders", 
    "Tinnitus", "Urinary Tract Infection (UTI)"
  ];

  const diseases = [
    "Acute Lymphoblastic Leukemia (ALL)", "Alzheimer's Disease", "Amebiasis", "Avian Flu (H5N1)", "Bacterial Meningitis", 
    "Bovine Spongiform Encephalopathy (Mad Cow Disease)", "Brucellosis", "Chickenpox", "Cholera", "Chronic Obstructive Pulmonary Disease (COPD)", 
    "Celiac Disease", "COVID-19", "Dengue Fever", "Diabetes Mellitus", "Diphtheria", "Ebola Virus Disease", "Gonorrhea", 
    "Hantavirus Pulmonary Syndrome", "HIV/AIDS", "Human Papillomavirus (HPV)", "Influenza (Flu)", "Kawasaki Disease", 
    "Leprosy", "Leptospirosis", "Lupus", "Malaria", "Measles", "Meningococcal Disease", "Mumps", "Myocardial Infarction (Heart Attack)", 
    "Norovirus Infection", "Polio (Poliomyelitis)", "Pneumonia", "Plague", "Rheumatic Fever", "Salmonella Infection", "Sepsis", 
    "Sickle Cell Anemia", "Smallpox", "Syphilis", "Tetanus", "Tuberculosis", "Typhoid Fever", "Viral Hepatitis", 
    "Whooping Cough (Pertussis)", "Zika Virus"
  ];

  // Filter conditions and diseases based on input
  const filterConditions = (text) => {
    setCondition(text);
    if (text) {
      const filtered = conditions.filter((item) => item.toLowerCase().includes(text.toLowerCase()));
      setFilteredConditions(filtered);
      setShowConditionSuggestions(true);
    } else {
      setShowConditionSuggestions(false);
    }
  };

  const filterDiseases = (text) => {
    setDisease(text);
    if (text) {
      const filtered = diseases.filter((item) => item.toLowerCase().includes(text.toLowerCase()));
      setFilteredDiseases(filtered);
      setShowDiseaseSuggestions(true);
    } else {
      setShowDiseaseSuggestions(false);
    }
  };

  const selectCondition = (item) => {
    setCondition(item);
    setShowConditionSuggestions(false);
  };

  const selectDisease = (item) => {
    setDisease(item);
    setShowDiseaseSuggestions(false);
  };


  const callGenerativeAI = async () => {
    if (!condition || !disease) {
      Alert.alert("Missing Information", "Please provide both a condition and disease.");
      return;
    }

    try {
      setLoading(true); // Start loading
      const apiKey = 'AIzaSyBo2UvOWtOOn6QoxDXUpobxB0wiAeYga7A'; // Replace with your actual API key
      const modelName = 'gemini-1.5-flash'; // Ensure this model is correct

      // Initialize GoogleGenerativeAI
      const genAI = new GoogleGenerativeAI(apiKey); // Initialize with API key
      const model = genAI.getGenerativeModel({ model: modelName }); // Get the model

      console.log('Prompt sent to AI:', DIET_PLAN_PROMPT); // Log the prompt

      const result = await model.generateContent(DIET_PLAN_PROMPT); // Generate content
      const rawResponse = await result.response.text(); // Call the function to get the response text
      console.log('Raw AI response:', rawResponse);
      setResponseText(rawResponse);
      setShowForm(false); // Hide form after successful generation
    } catch (error) {
      console.error('Error generating content:', error);
      setResponseText('Failed to generate content.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const parseDietPlan = () => {
    console.log('Parsing diet plan from:', responseText); // Debug log
  
    // Split content by day markers
    const dayRegex = /\*\*Day \d+\s*\([^)]+\)/g;
    const dayMatches = responseText.match(dayRegex);
    const dayContents = responseText.split(dayRegex).slice(1); // Skip the intro section
  
    if (!dayMatches || !dayContents.length) {
      console.log('No days found in response');
      return [];
    }
  
    console.log('Found days:', dayMatches.length); // Debug log
  
    return dayMatches.map((dayHeader, index) => {
      const content = dayContents[index];
      const dayCaloriesMatch = dayHeader.match(/\((.*?)\)/);
      const dayCalories = dayCaloriesMatch ? dayCaloriesMatch[1] : '';
  
      const dayPlan = {
        day: `Day ${index + 1} ${dayCalories ? `(${dayCalories})` : ''}`,
        meals: []
      };
  
      // Extract meals with updated regex
      const mealRegex = /\*\s*\*\*(.*?)\((\d+)\s*Calories\):\*\*\s*([^*\n]+)/g;
      let meal;
      while ((meal = mealRegex.exec(content)) !== null) {
        const [_, mealName, calories, dish] = meal;
        dayPlan.meals.push({
          meal: mealName.trim(),
          calories: calories.trim(),
          dish: dish.trim()
        });
      }
  
      console.log(`Day ${index + 1} meals:`, dayPlan.meals); // Debug log
      return dayPlan;
    }).filter(day => day.meals.length > 0);
  };

  const parseHeader = () => {
    const importantNote = responseText.match(/\*\*Important Note:\*\*(.*?)(?=\n\n|\*\*Day)/s);
    if (!importantNote) return { note: [] };

    // Extract numbered points
    const points = importantNote[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^\d\./.test(line))
      .map(point => point.replace(/^\d\.\s*/, '').trim());

    return {
      note: points
    };
  };

  const parseConsiderations = () => {
    const considerations = responseText.split('Important Considerations:')[1];
    if (!considerations) return [];

    // Remove asterisks and split by line breaks
    const cleanedConsiderations = considerations
      .replace(/\*/g, '')  // Remove all asterisks
      .trim()
      .split('\n')
      .filter(line => line.includes(':'))  // Only get lines with colons
      .map(line => {
        const [key, ...valueParts] = line.split(':');
        return {
          key: key.trim(),
          value: valueParts.join(':').trim()  // Rejoin in case value contains colons
        };
      })
      .filter(item => item.key && item.value);  // Remove empty entries

    return cleanedConsiderations;
  };

  const parseNote = () => {
    const noteMatch = responseText.match(/Note:\s*(.*)/);
    return noteMatch ? noteMatch[1] : ''; // Extract note if available
  };

  const handleRegenerate = () => {
    setShowForm(true);
    setResponseText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#e7e7f8]">
      <LinearGradient
        colors={['#fcfcfd', '#e0e0f5']}
        className="absolute w-full h-64"
      />
      <View className="flex-row items-center mb-4 mt-4 px-4">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
        >
          <Icon name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-cublack text-2xl font-bold flex-1 ml-4">Diet Planner</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {showForm ? (
          <View className="mb-6 rounded-3xl overflow-hidden">
            <View className="bg-white p-6 rounded-3xl shadow-xl">
              <View className="mb-6">
                <Text className="text-gray-800 text-xl font-bold mb-2">Personalized Diet Plan</Text>
                <Text className="text-gray-500 text-sm">Enter your health conditions for a customized plan</Text>
              </View>
            
              <View className="space-y-5">
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Medical Condition</Text>
                  <View className="relative">
                    <View className="absolute left-3 top-[14px] z-10">
                      <Icon name="medical" size={20} color="#4A90E2" />
                    </View>
                    <TextInput
                      className="p-4 pl-12 bg-gray-50/80 rounded-xl shadow-inner border border-gray-100 
                               text-gray-700 font-medium focus:border-blue-400"
                      placeholder="Enter condition (e.g., diabetes)"
                      placeholderTextColor="#9CA3AF"
                      value={condition}
                      onChangeText={filterConditions}
                    />
                  </View>
                  {showConditionSuggestions && filteredConditions.length > 0 && (
                    <View className="absolute z-20 top-[76px] left-0 right-0 bg-white rounded-xl 
                                   shadow-xl border border-gray-100 max-h-48">
                      <FlatList
                        data={filteredConditions.slice(0, 5)}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            onPress={() => selectCondition(item)}
                            className="px-4 py-3 border-b border-gray-50 active:bg-gray-50"
                          >
                            <Text className="text-gray-700">{item}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Disease</Text>
                  <View className="relative">
                    <View className="absolute left-3 top-[14px] z-10">
                      <Icon name="fitness" size={20} color="#4A90E2" />
                    </View>
                    <TextInput
                      className="p-4 pl-12 bg-gray-50/80 rounded-xl shadow-inner border border-gray-100 
                               text-gray-700 font-medium focus:border-blue-400"
                      placeholder="Enter disease (e.g., hypertension)"
                      placeholderTextColor="#9CA3AF"
                      value={disease}
                      onChangeText={filterDiseases}
                    />
                  </View>
                  {showDiseaseSuggestions && filteredDiseases.length > 0 && (
                    <View className="absolute z-20 top-[76px] left-0 right-0 bg-white rounded-xl 
                                   shadow-xl border border-gray-100 max-h-48">
                      <FlatList
                        data={filteredDiseases.slice(0, 5)}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            onPress={() => selectDisease(item)}
                            className="px-4 py-3 border-b border-gray-50 active:bg-gray-50"
                          >
                            <Text className="text-gray-700">{item}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={callGenerativeAI}
                  disabled={loading}
                  className={`mt-4 rounded-xl overflow-hidden shadow-lg ${
                    loading ? 'opacity-70' : ''
                  }`}
                >
                  <LinearGradient
                    colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4A90E2', '#357ABD']}
                    className="p-4"
                  >
                    <View className="flex-row items-center justify-center">
                      {loading ? (
                        <>
                          <ActivityIndicator color="white" className="mr-2" />
                          <Text className="text-white text-lg font-semibold">Creating...</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="nutrition" size={24} color="white" className="mr-2" />
                          <Text className="text-white text-lg font-semibold">Generate Diet Plan</Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleRegenerate}
            className="mb-6 rounded-xl overflow-hidden shadow-lg"
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-4"
            >
              <View className="flex-row items-center justify-center">
                <Icon name="refresh" size={24} color="white" className="mr-2" />
                <Text className="text-white text-lg font-semibold">
                  Create New Diet Plan
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {responseText && (
          <View className="mb-6">
            <View className="bg-white p-5 rounded-2xl border border-amber-200 mb-6">
              <View className="flex-row items-center mb-3">
                <Icon name="warning" size={24} color="#B45309" />
                <Text className="text-amber-800 font-bold ml-2">Medical Disclaimer</Text>
              </View>
              <Text className="text-amber-700 text-sm leading-6">
                This diet plan is generated for informational purposes only. Please consult your healthcare provider before starting any new diet regime.
              </Text>
            </View>

            {parseHeader().note && parseHeader().note.length > 0 && (
              <View className="bg-white rounded-2xl shadow-md p-5 mb-6">
                <View className="flex-row items-center mb-4">
                  <Icon name="information-circle" size={24} color="#4A90E2" />
                  <Text className="text-gray-800 font-bold text-lg ml-2">Important Points</Text>
                </View>
                <View className="space-y-3">
                  {parseHeader().note.map((point, index) => (
                    <View key={index} className="flex-row items-start">
                      <Text className="text-blue-600 font-bold mr-2">{index + 1}.</Text>
                      <Text className="flex-1 text-gray-700 leading-5">{point}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {parseDietPlan().map((dayPlan, index) => (
              <View key={index} className="mb-6 bg-white rounded-2xl shadow-md overflow-hidden">
                <LinearGradient
                  colors={['#4A90E2', '#50C9C3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-4"
                >
                  <Text className="text-white text-xl font-bold">{dayPlan.day}</Text>
                </LinearGradient>
                
                <View className="p-4">
                  {dayPlan.meals.map((item, mealIndex) => (
                    <View
                      key={mealIndex}
                      className={`p-4 ${
                        mealIndex % 2 === 0 ? 'bg-[#F8FAFC]' : 'bg-white'
                      } rounded-xl mb-2`}
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-800 font-semibold text-lg">{item.meal}</Text>
                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                          <Text className="text-blue-600 font-medium">{item.calories} Cal</Text>
                        </View>
                      </View>
                      <Text className="text-gray-600">{item.dish}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4"
              >
                <Text className="text-white text-xl font-bold">Important Considerations</Text>
              </LinearGradient>
              
              <View className="p-4">
                {parseConsiderations().map((consideration, index) => (
                  <View
                    key={index}
                    className="mb-4 last:mb-0"
                  >
                    <Text className="text-gray-800 font-semibold text-lg mb-1">
                      {consideration.key}
                    </Text>
                    <Text className="text-gray-600 leading-6">
                      {consideration.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DietPlanner;

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Use import here
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

const geminichat = () => {
  const [responseText, setResponseText] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);  // Add loading state
  const navigation = useNavigation();

  const callGenerativeAI = async () => {
    try {
      setLoading(true);  // Start loading
      const apiKey = "AIzaSyBo2UvOWtOOn6QoxDXUpobxB0wiAeYga7A"; // Replace with your actual API key
      const modelName = "gemini-1.5-flash"; // Ensure this model is correct and exists in your API

      // Initialize GoogleGenerativeAI
      const genAI = new GoogleGenerativeAI(apiKey); // Initialize with API key
      const model = genAI.getGenerativeModel({ model: modelName });  // Get the model
      const prompt = inputText || "Explain how AI works";  // Use inputText if provided, else fallback to default prompt

      const result = await model.generateContent(prompt);  // Generate content
      setResponseText(result.response.text);  // Set the response text
    } catch (error) {
      console.error('Error generating content:', error);
      setResponseText('Failed to generate content.');
    } finally {
      setLoading(false);  // Stop loading
      setInputText('');  // Clear the input box after response
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center mb-4 ml-3 mt-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Icon name="chevron-back" size={27} color="black" />
        </TouchableOpacity>

        <Text className="text-black text-2xl font-bold flex-1 ml-4 mb-1">AI Chat</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 py-5">
        {/* Response text will show above the input box */}
        {responseText ? (
          <Text className="mt-5 text-base text-gray-800 ml-4">{responseText}</Text>
        ) : (
          <Text className="mt-10 text-center text-base text-gray-500 justify-center items-center flex-1">
            How can I help you?
          </Text>
        )}
      </ScrollView>

      {/*  input box fixed at the bottom */}
      <View className="flex-row items-center w-80% border border-gray-300 rounded-xl shadow-md  mb-9 ml-4 mr-4 p-1 bg-white">
        <TextInput
          className="flex-1 h-12 pl-4 pr-4 bg-transparent text-gray-800 rounded-xl"
          placeholder="Enter your prompt"
          value={inputText}
          onChangeText={(text) => setInputText(text)}
          autoFocus
          multiline
          style={{ fontSize: 16 }}
        />
        <TouchableOpacity onPress={callGenerativeAI} className="ml-3 p-2">
          {loading ? (
            <ActivityIndicator size={26} color="black" />  // Show loading spinner
          ) : (
            <Icon name="send" size={24} color="black" />
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

export default geminichat;

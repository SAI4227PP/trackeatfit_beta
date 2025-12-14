import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ensure this import is correct

const FormField = ({ title, value, placeholder, handleChangeText, otherStyles, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`space-y-2 ${otherStyles} my-4`}> 
      <View className="border-2 border-lightMint w-full h-16 px-4 focus:border-paleSage rounded-2xl flex-row items-center">
        <Text className="text-base text-cublack font-medium absolute top-[-13px] left-4 bg-gray-50 px-1">{title}</Text>
        <TextInput
          className="flex-1 text-cublack font-semibold text-base"
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7b7b8b"
          onChangeText={handleChangeText}
          secureTextEntry={title === 'password' && !showPassword}
        />
        {title === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="black" />
        </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
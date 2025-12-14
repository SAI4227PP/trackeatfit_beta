import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CustomAlert = ({ visible, title, message, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-5 w-[90%] max-w-[340px]">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <MaterialCommunityIcons name="information" size={24} color="#3b82f6" />
            <Text className="text-lg font-bold ml-2 text-gray-800">{title}</Text>
          </View>
          
          {/* Message */}
          <Text className="text-gray-600 text-base mb-5">{message}</Text>
          
          {/* Button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-blue-500 rounded-lg py-3 px-5 self-end"
          >
            <Text className="text-white font-semibold">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

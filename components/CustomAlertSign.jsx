import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';

const CustomAlertSign = ({
  visible,
  onClose,
  message,
  animation,
  showAnimation = true,
}) => (
  <Modal transparent={true} visible={visible} animationType="fade">
    <View className="flex-1 justify-center items-center bg-black/40">
      <View className="w-72 px-5 py-8 bg-white rounded-2xl items-center shadow-lg">
        {/* Animation */}
        {showAnimation && animation ? (
          <View className="items-center mb-2">
            <LottieView
              source={animation}
              autoPlay
              loop={false}
              style={{ width: 100, height: 100 }}
            />
          </View>
        ) : null}
        {/* Message */}
        <Text className="mb-6 text-center text-base font-medium text-gray-700 leading-relaxed">
          {message}
        </Text>
        {/* OK Button */}
        <TouchableOpacity
          onPress={onClose}
          className="w-full bg-black py-3 rounded-xl"
          activeOpacity={0.85}
        >
          <Text className="text-white text-center font-semibold text-base">
            OK
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default CustomAlertSign;

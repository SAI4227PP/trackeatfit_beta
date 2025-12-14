import React, { useEffect, useRef } from 'react';
import { SafeAreaView, Text, Animated, View } from 'react-native';
import LottieView from 'lottie-react-native';

const LoadingScreen = ({ loading }) => {
  const scaleValue = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [loading]);

  return (
    loading && (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          {/* Lottie Animation */}
          <LottieView
            source={require('../assets/lottie/Animation - loading.json')} // Replace with the correct path to your Lottie file
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
        </Animated.View>
        <Text style={{ color: 'black', marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>Loading...</Text>
      </SafeAreaView>
    )
  );
};

export default LoadingScreen;

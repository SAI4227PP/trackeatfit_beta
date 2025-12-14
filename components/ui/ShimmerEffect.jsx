import React, { useEffect, useRef, memo } from 'react';
import { View, Animated } from 'react-native';

const ShimmerEffect = memo(({ width, height, borderRadius = 8, style }) => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: width,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [width]);

  return (
    <View style={[
      {
        width,
        height,
        borderRadius,
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
      },
      style
    ]}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          backgroundColor: '#e5e7eb',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
});

export default ShimmerEffect;

import React from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AchievementSkeleton = ({ width = 160 }) => {
  const shimmerAnimated = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimated, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimated, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const translateX = shimmerAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View className="mr-3 overflow-hidden" style={{ width }}>
      <View className="bg-gray-100 rounded-xl p-4">
        <View className="overflow-hidden">
          {/* Icon placeholder */}
          <View className="w-8 h-8 rounded-full bg-gray-200 mb-3 overflow-hidden">
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                transform: [{ translateX }],
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', height: '100%' }}
              />
            </Animated.View>
          </View>

          {/* Title placeholder */}
          <View className="h-5 bg-gray-200 rounded mb-2 overflow-hidden">
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                transform: [{ translateX }],
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', height: '100%' }}
              />
            </Animated.View>
          </View>

          {/* Description placeholder */}
          <View className="h-4 bg-gray-200 rounded w-3/4 overflow-hidden">
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                transform: [{ translateX }],
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', height: '100%' }}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default React.memo(AchievementSkeleton);

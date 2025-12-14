import React from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';

const StatisticsSkeleton = () => {
  const screenWidth = Dimensions.get('window').width;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, style }) => (
    <Animated.View
      className="bg-gray-200 rounded-lg overflow-hidden"
      style={[{ width, height, opacity }, style]}
    />
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Skeleton */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <SkeletonItem width={40} height={40} />
          <SkeletonItem width={150} height={30} />
          <SkeletonItem width={40} height={40} />
        </View>
        <View className="flex-row mt-4 space-x-2">
          {[1, 2, 3].map(i => (
            <SkeletonItem key={i} width={(screenWidth - 32) / 3} height={40} />
          ))}
        </View>
      </View>

      {/* Time Frame Selector Skeleton */}
      <View className="px-4 py-4">
        <View className="flex-row space-x-2">
          {[1, 2, 3].map(i => (
            <SkeletonItem key={i} width={(screenWidth - 32) / 3} height={40} />
          ))}
        </View>
      </View>

      {/* Metric Cards Skeleton */}
      <View className="px-4">
        <View className="flex-row space-x-4">
          {[1, 2].map(i => (
            <View key={i} className="flex-1 bg-white rounded-2xl p-4 shadow-sm mb-4">
              <SkeletonItem width={100} height={20} />
              <SkeletonItem width={80} height={30} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Chart Skeleton */}
      <View className="mx-4 bg-white rounded-2xl p-4 shadow-sm">
        <SkeletonItem width={150} height={24} style={{ marginBottom: 16 }} />
        <SkeletonItem width={screenWidth - 48} height={220} />
      </View>

      {/* Distribution Skeleton */}
      <View className="mx-4 mt-6 bg-white rounded-2xl p-4 shadow-sm">
        <SkeletonItem width={180} height={24} style={{ marginBottom: 16 }} />
        <SkeletonItem width={screenWidth - 48} height={180} />
      </View>
    </View>
  );
};

export default StatisticsSkeleton;

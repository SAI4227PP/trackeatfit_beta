import { View, Text, TouchableOpacity, FlatList, Dimensions, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGlobalContext } from '../../context/GlobalProvider';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

const API_URL = "https://trackeatfit.onrender.com";

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const { user } = useGlobalContext();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${API_URL}/api/plans`);
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        if (!isMounted) return;
        setPlans(data.plans || []);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
        setLoading(false);
      }
    };
    fetchPlans();
    return () => { isMounted = false; };
  }, []);

  const handlePurchase = (plan) => {
    if (plan.isActive) return;
    navigation.navigate('Payment/payment-confirmation', { plan });
  };


  // Memoize processed plans and activePlanIndex
  const processedPlans = useMemo(() => {
    return plans.map((plan) => {
      const isBasic = plan.name.toUpperCase() === 'FREE' || plan.name.toUpperCase() === 'BASIC';
      const planName = isBasic
        ? 'Basic'
        : plan.name.charAt(0) + plan.name.slice(1).toLowerCase();
      let isActive = false;
      if (user && Array.isArray(user.subscriptions) && user.subscriptions.length > 0) {
        const userPlan = user.subscriptions[0].plan;
        isActive = plan.name.toUpperCase() === userPlan.toUpperCase() || (isBasic && userPlan.toUpperCase() === 'BASIC');
      } else if (isBasic) {
        isActive = true;
      }
      // Use highlightColor from API, fallback to default
      const highlightColor = plan.highlightColor || (isBasic ? '#A0AEC0' : plan.name === 'STANDARD' ? '#38B2AC' : '#ECC94B');
      return {
        ...plan,
        name: planName,
        price: plan.price,
        features: plan.features || [],
        tagline: plan.tagline,
        description: plan.description,
        promo: plan.promo,
        highlightColor,
        gradient:
          isBasic
            ? ['#ffffff', '#f3f4f6']
            : plan.name === 'STANDARD'
            ? ['#ecfdf5', '#d1fae5']
            : ['#eff6ff', '#dbeafe'],
        buttonGradient:
          isBasic
            ? ['#4b5563', '#374151']
            : plan.name === 'STANDARD'
            ? ['#059669', '#047857']
            : ['#2563eb', '#1d4ed8'],
        popular: plan.isRecommended || false,
        savings:
          plan.name === 'STANDARD'
            ? 'Most Popular'
            : plan.name === 'PREMIUM'
            ? 'Best Value'
            : undefined,
        isActive,
      };
    });
  }, [plans, user]);

  const activePlanIndex = useMemo(() => processedPlans.findIndex((plan) => plan.isActive), [processedPlans]);

  // Memoized Plan Card
  const PlanCard = useCallback(({ item: plan, index }) => {
    let disableButton = false;
    let showUpgrade = false;
    if (!plan.isActive) {
      if (activePlanIndex !== -1) {
        if (index < activePlanIndex) {
          disableButton = true;
        }
        if (index > activePlanIndex && index === processedPlans.length - 1 && activePlanIndex === 1) {
          showUpgrade = true;
        }
      }
    }
    return (
      <Animated.View
        key={plan._id || plan.name}
        entering={FadeInRight.delay(300 + index * 100)}
        className={`mb-6 rounded-2xl overflow-hidden border`}
        style={{ borderColor: plan.popular ? plan.highlightColor : '#e5e7eb', backgroundColor: '#fff' }}
      >
        <LinearGradient
          colors={plan.gradient}
          className="p-6"
        >
          {/* Promo/Badge */}
          <View className="absolute right-0 top-0">
            <LinearGradient
              colors={[plan.highlightColor, plan.highlightColor]}
              className="px-4 py-1 rounded-bl-2xl"
            >
              <Text className="text-white text-xs font-bold">
                {plan.isActive ? 'Active' : (plan.savings ? plan.savings : plan.promo)}
              </Text>
            </LinearGradient>
          </View>
          <View className="mb-4">
            <Text className="text-xl font-extrabold" style={{ color: plan.highlightColor }}>{plan.name}</Text>
            {plan.tagline && (
              <Text className="text-base font-medium mt-1 mb-1 text-gray-700">{plan.tagline}</Text>
            )}
            <View className="flex-row items-baseline mt-2">
              <Text className="text-4xl font-bold text-gray-900">
                ₹{plan.price}
              </Text>
              <Text className="text-gray-600 ml-1">
                {plan.price === 0 || plan.price === '0' ? '' : '/month'}
              </Text>
            </View>
            {plan.description && (
              <Text className="text-sm text-gray-500 mt-2 mb-1">{plan.description}</Text>
            )}
            {plan.promo && (
              <View className="mt-1 mb-1 self-start">
                <Text style={{
                  backgroundColor: plan.highlightColor,
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  fontWeight: 'bold',
                  fontSize: 12,
                  overflow: 'hidden',
                }}>
                  {plan.promo}
                </Text>
              </View>
            )}
          </View>
          {/* Features */}
          <View className="space-y-3 mb-2">
            {plan.features.map((feature, idx) => (
              <View key={idx} className="flex-row items-center">
                <Ionicons 
                  name="checkmark-circle"
                  size={20} 
                  color={plan.highlightColor}
                />
                <Text className="ml-2 text-gray-900">
                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
          {/* Button logic: disable or show upgrade */}
          {!plan.isActive && (
            <TouchableOpacity
              onPress={() => handlePurchase(plan)}
              className="mt-6"
              disabled={disableButton}
              style={disableButton ? { opacity: 0.5 } : {}}
            >
              <LinearGradient
                colors={[plan.highlightColor, plan.buttonGradient[1]]}
                className="rounded-xl py-3"
              >
                <Text className="text-white text-center font-bold">
                  {showUpgrade ? 'Upgrade' : (plan.price === 0 || plan.price === '0' ? 'Get Started' : 'Choose Plan')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    );
  }, [activePlanIndex, processedPlans, handlePurchase]);

  // Skeleton Loader
  const SkeletonCard = () => (
    <View className="mb-6 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 animate-pulse p-6">
      <View className="h-6 w-1/3 bg-gray-300 rounded mb-4" />
      <View className="h-10 w-1/2 bg-gray-300 rounded mb-4" />
      <View className="space-y-3">
        {[1,2,3].map(i => (
          <View key={i} className="flex-row items-center">
            <View className="h-5 w-5 bg-gray-300 rounded-full" />
            <View className="ml-2 h-4 w-1/3 bg-gray-300 rounded" />
          </View>
        ))}
      </View>
      <View className="mt-6 h-10 bg-gray-300 rounded-xl" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
        className="p-4 border-b border-gray-100"
        style={{ 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="p-2 mr-3"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Premium Plans</Text>
              <Text className="text-sm text-gray-500">Choose the perfect plan for you</Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="help-circle-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 p-6">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={processedPlans}
          keyExtractor={(item) => item._id || item.name}
          renderItem={PlanCard}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Animated.View 
              entering={FadeInDown.delay(600)}
              className="mt-4 items-center space-y-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text className="text-gray-600 ml-2">
                  SSL Secure Payment
                </Text>
              </View>
              <View className="flex-row items-center flex-wrap justify-center">
                <Text className="text-gray-500 text-center text-sm">
                  By continuing, you agree to our {' '}
                </Text>
                <TouchableOpacity>
                  <Text className="text-blue-600 text-sm">Terms</Text>
                </TouchableOpacity>
                <Text className="text-gray-500 text-sm"> and </Text>
                <TouchableOpacity>
                  <Text className="text-blue-600 text-sm">Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default SubscriptionScreen;
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation, useRoute } from '@react-navigation/native';

const PaymentSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { plan, amount, paymentMethod, transactionId, subscriptionStart, subscriptionEnd } = route.params;

  // Use provided dates if available, else fallback to local calculation
  const startDate = subscriptionStart ? new Date(subscriptionStart) : new Date();
  const endDate = subscriptionEnd ? new Date(subscriptionEnd) : (() => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    return d;
  })();

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Map backend payment method to user-friendly label
  const paymentMethodLabel = {
    UPI: 'UPI',
    CARD: 'Card',
    NETBANKING: 'Net Banking',
    WALLET: 'Wallet',
    UNKNOWN: 'Unknown'
  }[paymentMethod?.toUpperCase()] || paymentMethod;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-4">
        <Animatable.View 
          animation="zoomIn" 
          duration={1000} 
          className="items-center w-full"
        >
          <View className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center mb-6">
            <MaterialIcons name="check-circle" size={64} color="#059669" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</Text>
          <Text className="text-gray-500 text-center mb-8">
            Your payment of ₹{amount} for {(plan && plan.name) ? plan.name : plan} plan has been processed successfully
          </Text>
          
          <View className="w-full bg-gray-50 rounded-xl p-6 mb-8">
            <View className="space-y-4">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Transaction ID</Text>
                <Text className="font-medium text-gray-900">
                  #{transactionId || 'N/A'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Plan Type</Text>
                <Text className="font-medium text-gray-900">{(plan && plan.name) ? plan.name : plan}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Payment Method</Text>
                <Text className="font-medium text-gray-900">{paymentMethodLabel}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Plan Start Date</Text>
                <Text className="font-medium text-gray-900">{formatDate(startDate)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Plan End Date</Text>
                <Text className="font-medium text-gray-900">{formatDate(endDate)}</Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        <TouchableOpacity
          onPress={() => navigation.navigate('home')}
          className="w-full bg-emerald-500 py-4 rounded-xl"
        >
          <Text className="text-white text-center font-bold text-lg">Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentSuccess;

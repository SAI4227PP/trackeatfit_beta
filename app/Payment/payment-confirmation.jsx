import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Dimensions, ActivityIndicator, Alert, FlatList } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import * as Animatable from 'react-native-animatable';
import { MaterialIcons } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';
import RazorpayCheckout from 'react-native-razorpay';

const API_URL = "https://trackeatfit.onrender.com";

const { width } = Dimensions.get('window');

const PaymentConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { plan } = route.params;
  const { user } = useGlobalContext();
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isValidCoupon, setIsValidCoupon] = useState(false);
  const [showCouponAlert, setShowCouponAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ type: '', message: '' });
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponList, setCouponList] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);

  // Replace with your backend API base URL

  // Replace with your actual user context or auth logic
  const userId = user?._id || user?.id; 
  const email = user?.email;

  console.log('PaymentConfirmation rendered');

  React.useEffect(() => {
    console.log('User:', user);
    console.log('Plan:', plan);
  }, [user, plan]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidCoupon(false);
    setAppliedDiscount(0);
    setAlertMessage({ type: '', message: '' });

    try {
      const res = await fetch(`${API_URL}/api/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          amount: parseFloat(plan.price),
          userId,
          plan: plan.name
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedDiscount(
          data.type === 'PERCENTAGE'
            ? Number(Number(data.value).toFixed(2))
            : Number(((data.discount / parseFloat(plan.price)) * 100).toFixed(2))
        );
        setIsValidCoupon(true);
        setAlertMessage({
          type: 'success',
          message: data.message || `Amazing! You saved ₹${Number(data.discount).toFixed(2)}`
        });
      } else {
        setAppliedDiscount(0);
        setIsValidCoupon(false);
        setAlertMessage({
          type: 'error',
          message: data.message || 'Invalid coupon code. Please try again.'
        });
      }
    } catch (err) {
      setAppliedDiscount(0);
      setIsValidCoupon(false);
      setAlertMessage({
        type: 'error',
        message: 'Could not verify coupon. Please try again.'
      });
    }
    setShowCouponAlert(true);
    setTimeout(() => setShowCouponAlert(false), 3000);
  };

  const calculateTotal = () => {
    const basePrice = parseFloat(plan.price);
    const discountAmount = (basePrice * appliedDiscount) / 100;
    const total = (basePrice - discountAmount).toFixed(2);
    console.log('Calculating total:', { basePrice, appliedDiscount, discountAmount, total });
    return total;
  };

  const handlePayment = async () => {
    console.log('Initiating payment...');
    setProcessing(true);
    setShowPaymentModal(true);

    // Calculate subscription dates
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    console.log('Payment payload:', {
      amount: parseFloat(calculateTotal()),
      userId,
      email,
      couponCode: couponCode || undefined,
      appliedDiscount: appliedDiscount || undefined,
      plan: plan.name,
      subscriptionStart,
      subscriptionEnd
    });

    try {
      // 1. Create order via your backend API
      const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(calculateTotal()),
          userId,
          email,
          couponCode: couponCode || undefined,
          appliedDiscount: appliedDiscount || undefined,
          plan: plan.name,
          subscriptionStart,
          subscriptionEnd
        })
      });
      console.log('Order creation status:', orderRes.status);
      const orderData = await orderRes.json();
      console.log('Order creation response:', orderData);
      if (!orderData.success || !orderData.orderId) throw new Error(orderData.message || 'Order creation failed');

      const keyId = orderData.keyId; // Always use keyId from backend

      setOrderId(orderData.orderId);

      // Use Razorpay SDK
      const options = {
        key: keyId,
        amount: Math.round(parseFloat(calculateTotal()) * 100).toString(),
        currency: 'INR',
        name: 'TrackEatFit',
        description: `${plan.name} Plan`,
        order_id: orderData.orderId,
        prefill: {
          email: email,
          name: user?.name || ''
        },
        theme: { color: '#059669' }
      };

      console.log('Razorpay options:', options);

      setProcessing(false);
      setShowPaymentModal(false);

      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Payment Success
          console.log('Razorpay payment success:', data);
          setProcessing(true);
          setShowPaymentModal(true);
          try {
            const verifyPayload = {
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
              userId,
              email,
              plan: plan.name,
              subscriptionStart: orderData.subscriptionStart,
              subscriptionEnd: orderData.subscriptionEnd
            };
            console.log('Verifying payment with payload:', verifyPayload);
            const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verifyPayload)
            });
            console.log('Verify response status:', verifyRes.status);
            const verifyData = await verifyRes.json();
            console.log('Verify response data:', verifyData);
            setProcessing(false);
            setShowPaymentModal(false);
            if (verifyData.success) {
              navigation.navigate('Payment/payment-success', {
                plan,
                amount: calculateTotal(),
                transactionId: data.razorpay_payment_id,
                paymentMethod: verifyData.paymentMethod,
                subscriptionStart: verifyData.subscriptionStart || orderData.subscriptionStart,
                subscriptionEnd: verifyData.subscriptionEnd || orderData.subscriptionEnd
              });
            } else {
              Alert.alert('Payment Failed', verifyData.message || 'Verification failed');
            }
          } catch (e) {
            setProcessing(false);
            setShowPaymentModal(false);
            console.log('Payment verification error:', e);
            Alert.alert('Payment Error', 'Unexpected error occurred.');
          }
        })
        .catch((error) => {
          // Payment Cancelled or Failed
          setProcessing(false);
          setShowPaymentModal(false);
          console.log('Razorpay payment cancelled or failed:', error);
          if (error && error.description) {
            Alert.alert('Payment Cancelled', error.description);
          } else {
            Alert.alert('Payment Cancelled', 'You cancelled the payment.');
          }
        });
    } catch (error) {
      setProcessing(false);
      setShowPaymentModal(false);
      console.log('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Something went wrong');
    }
  };

  // Custom Alert Component
  const CouponAlert = () => (
    <Animatable.View
      animation="slideInDown"
      duration={500}
      className={`absolute top-0 left-0 right-0 z-50 mx-4 mt-8 rounded-xl shadow-lg ${
        alertMessage.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'
      }`}
    >
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center ${
            alertMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <MaterialIcons
              name={alertMessage.type === 'success' ? 'check-circle' : 'error'}
              size={20}
              color={alertMessage.type === 'success' ? '#059669' : '#DC2626'}
            />
          </View>
          <Text className={`ml-3 font-medium ${
            alertMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {alertMessage.message}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowCouponAlert(false)}>
          <MaterialIcons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  const PaymentProcessingModal = () => (
    <Modal
      transparent={true}
      visible={showPaymentModal}
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-2xl w-[80%] items-center">
          {processing ? (
            <>
              <ActivityIndicator size="large" color="#059669" />
              <Text className="text-gray-900 font-semibold mt-4">Processing Payment...</Text>
              <Text className="text-gray-500 text-sm mt-2">Please don't close the app</Text>
            </>
          ) : paymentStatus === 'success' ? (
            <Animatable.View animation="bounceIn" className="items-center">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
                <MaterialIcons name="check-circle" size={40} color="#059669" />
              </View>
              <Text className="text-gray-900 font-semibold">Payment Successful!</Text>
            </Animatable.View>
          ) : paymentStatus === 'failed' ? (
            <Animatable.View animation="bounceIn" className="items-center">
              <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <MaterialIcons name="error" size={40} color="#DC2626" />
              </View>
              <Text className="text-gray-900 font-semibold">Payment Failed</Text>
              <Text className="text-gray-500 text-sm mt-2">Please try again</Text>
            </Animatable.View>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  // Handler to open coupon modal and fetch coupons
  const handleViewAllCoupons = async () => {
    setShowCouponModal(true);
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/coupon/all`);
      const data = await res.json();
      if (data.success) {
        setCouponList(data.coupons || []);
      } else {
        setCouponList([]);
      }
    } catch (e) {
      setCouponList([]);
    }
    setCouponLoading(false);
  };

  // Coupon List Modal
  const CouponListModal = () => (
    <Modal
      visible={showCouponModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCouponModal(false)}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-2xl p-6 max-h-[70%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Available Coupons</Text>
            <TouchableOpacity onPress={() => setShowCouponModal(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {couponLoading ? (
            <ActivityIndicator size="large" color="#059669" />
          ) : couponList.length === 0 ? (
            <Text className="text-gray-500 text-center py-8">No coupons available</Text>
          ) : (
            <FlatList
              data={couponList}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50"
                  onPress={() => {
                    setCouponCode(item.code);
                    setShowCouponModal(false);
                  }}
                >
                  {/* Fix: All text and values must be inside <Text> */}
                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-emerald-700 text-base">{item.code}</Text>
                    <Text className="font-semibold text-emerald-600">
                      {item.type === 'PERCENTAGE'
                        ? `${item.value}% OFF`
                        : `₹${item.value} OFF`}
                    </Text>
                  </View>
                  {item.description ? (
                    <Text className="text-gray-700 mt-1">{item.description}</Text>
                  ) : null}
                  <View className="flex-row mt-2">
                    <Text className="text-xs text-gray-400 mr-4">
                      {/* Fix: Wrap all values in <Text> */}
                      {`Valid Till: ${new Date(item.validTill).toLocaleDateString()}`}
                    </Text>
                    {item.minOrderAmount ? (
                      <Text className="text-xs text-gray-400">
                        {`Min Order: ₹${item.minOrderAmount}`}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {showCouponAlert && <CouponAlert />}
      <PaymentProcessingModal />
      <CouponListModal />
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        className="p-4 border-b border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="p-2 mr-3 bg-white rounded-full shadow-sm"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Checkout</Text>
              <Text className="text-sm text-gray-500">{plan.name} Plan</Text>
            </View>
          </View>
          <View className="bg-emerald-100 px-3 py-1 rounded-full">
            <Text className="text-emerald-700 text-xs font-medium">Secure Payment</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Enhanced Order Summary */}
        <View className="p-6">
          <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Order Summary</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Plan</Text>
                <Text className="font-semibold text-gray-900">{plan.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Duration</Text>
                <Text className="font-semibold text-gray-900">1 Month</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Amount</Text>
                <Text className="font-semibold text-gray-900">₹{plan.price}</Text>
              </View>
              <View className="mt-2 pt-2 border-t border-gray-200">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-gray-900">Total</Text>
                  <Text className="font-bold text-gray-900">₹{plan.price}</Text>
                </View>
              </View>
            </View>

            {/* Enhanced Coupon Section */}
            <View className="mt-4 pt-4 border-t border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 font-semibold">Promotional Code</Text>
                <TouchableOpacity onPress={handleViewAllCoupons}>
                  <Text className="text-emerald-600 font-semibold text-sm">View All</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center space-x-2">
                <TextInput
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Enter code"
                  placeholderTextColor="#9CA3AF"
                  className={`flex-1 px-4 py-3 bg-gray-50 rounded-xl ${
                    isValidCoupon ? 'border-2 border-emerald-500' : 'border border-gray-200'
                  }`}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={handleApplyCoupon}
                  className={`px-5 py-3 rounded-xl ${
                    couponCode ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                  disabled={!couponCode}
                >
                  <Text className={`font-semibold ${
                    couponCode ? 'text-white' : 'text-gray-500'
                  }`}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
              {isValidCoupon && (
                <Animatable.View 
                  animation="fadeIn" 
                  className="mt-3 flex-row items-center"
                >
                  <MaterialIcons name="check-circle" size={16} color="#059669" />
                  <Text className="text-emerald-600 text-sm ml-2">
                    {appliedDiscount}% discount applied successfully!
                  </Text>
                </Animatable.View>
              )}
            </View>

            {/* Price Breakdown */}
            <View className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="font-semibold text-gray-900">₹{plan.price}</Text>
              </View>
              {appliedDiscount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Discount ({appliedDiscount}%)</Text>
                  <Text className="font-semibold text-emerald-600">
                    -₹{((parseFloat(plan.price) * appliedDiscount) / 100).toFixed(2)}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between pt-2 border-t border-gray-200">
                <Text className="font-semibold text-gray-900">Total</Text>
                <Text className="font-bold text-gray-900">₹{calculateTotal()}</Text>
              </View>
            </View>
          </View>
        </View>

         {/* Secured by Razorpay badge */}
          <View className="flex-row items-center justify-center mt-3">
            <Text className="text-sm text-gray-400 mr-2 font-medium">Secured by</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <Text className="text-sm font-bold" style={{ color: '#0C254D' }}>Razorpay</Text>
            </View>
          </View>

        {/* Remove Payment Methods selection UI */}
        {/*
        <Text className="text-lg font-bold text-gray-900 mb-4 px-6">Select Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setSelectedPayment(method.id)}
            className={`mb-4 p-4 rounded-xl border mx-6 ${
              selectedPayment === method.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200'
            }`}
          >
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                selectedPayment === method.id ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <Ionicons 
                  name={method.icon} 
                  size={20} 
                  color={selectedPayment === method.id ? '#059669' : '#6B7280'} 
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-gray-900">{method.name}</Text>
                <Text className="text-sm text-gray-500">{method.description}</Text>
              </View>
              <Ionicons 
                name={selectedPayment === method.id ? 'checkmark-circle' : 'ellipse-outline'} 
                size={24} 
                color={selectedPayment === method.id ? '#059669' : '#D1D5DB'} 
              />
            </View>
          </TouchableOpacity>
        ))}
        */}
      </ScrollView>

      {/* Enhanced Payment Button */}
      <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-100">
        <View className="p-4">
          <TouchableOpacity
            onPress={handlePayment}
            className="w-full"
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-xl py-4 px-6"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-bold text-lg">
                  Pay Now
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-lg">
                    ₹{calculateTotal()}
                  </Text>
                  <MaterialIcons name="lock" size={16} color="white" style={{ marginLeft: 8 }} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
};

export default PaymentConfirmation;
// All logic for payment, order creation, and verification is in sync with backend expectations.
// No further changes required.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomPicker from '../../../components/CustomPicker';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const PhoneNumber = () => {
  const { user, updateUser } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [phoneData, setPhoneData] = useState({
    countryCode: user?.phoneCountryCode || 'in-91',
    number: user?.phoneNumber || '',
    verificationCode: '',
  });
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const countryCodes = [
    { id: 'us', label: 'United States (+1)', value: 'us-1' },
    { id: 'uk', label: 'United Kingdom (+44)', value: 'uk-44' },
    { id: 'ca', label: 'Canada (+1)', value: 'ca-1' },
    { id: 'au', label: 'Australia (+61)', value: 'au-61' },
    { id: 'in', label: 'India (+91)', value: 'in-91' },
  ];

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number.replace(/\D/g, ''));
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    // Add hyphen after first 5 digits
    if (limited.length > 5) {
      return `${limited.slice(0, 5)}-${limited.slice(5)}`;
    }
    return limited;
  };

  const handleSendVerification = async () => {
    const cleanNumber = phoneData.number.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanNumber)) {
      setErrors({ number: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setModalVisible(true);
      setIsVerifying(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (phoneData.verificationCode.length !== 6) {
      setErrors({ verificationCode: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await updateUser({
        ...user,
        phoneNumber: phoneData.number,
        phoneCountryCode: phoneData.countryCode,
        phoneVerified: true,
      });

      Alert.alert(
        'Success',
        'Phone number verified successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, onChangeText, keyboardType = 'default', error = '') => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        color: isDarkMode ? "#9CA3AF" : "#4B5563",
        fontWeight: '500',
        marginBottom: 8,
        paddingHorizontal: 4
      }}>{label}</Text>
      <TextInput
        value={label === 'Phone Number' ? formatPhoneNumber(value) : value}
        onChangeText={(text) => {
          if (label === 'Phone Number') {
            onChangeText(text.replace(/\D/g, ''));
          } else {
            onChangeText(text);
          }
        }}
        maxLength={label === 'Phone Number' ? 11 : undefined}
        keyboardType={keyboardType}
        style={{
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: error ? '#ef4444' : (focusedField === label ? '#10b981' : (isDarkMode ? '#374151' : '#e5e7eb')),
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          color: isDarkMode ? '#fff' : '#111827'
        }}
        onFocus={() => setFocusedField(label)}
        onBlur={() => setFocusedField(null)}
        placeholder={label === 'Phone Number' ? '12345-67890' : `Enter ${label.toLowerCase()}`}
        placeholderTextColor={isDarkMode ? "#4B5563" : "#9CA3AF"}
      />
      {error ? <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 8, paddingHorizontal: 4 }}>{error}</Text> : null}
    </View>
  );

  const renderVerificationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{
              color: isDarkMode ? '#fff' : '#111827',
              fontSize: 20,
              fontWeight: 'bold'
            }}>
              Enter Verification Code
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
            </TouchableOpacity>
          </View>
          {renderInput(
            'Verification Code',
            phoneData.verificationCode,
            (text) => setPhoneData(prev => ({ ...prev, verificationCode: text })),
            'numeric',
            errors.verificationCode
          )}
          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            <LinearGradient
              colors={isDarkMode ? ['#059669', '#047857'] : ['#15803d', '#166534']}
              style={{ paddingVertical: 16, borderRadius: 16 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={{
                color: '#fff',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 18
              }}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#fff'
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? 'rgba(31,41,55,0.8)' : '#f3f4f6'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              marginLeft: -8,
              borderRadius: 999,
              backgroundColor: undefined // active:bg-gray-100 not supported
            }}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: isDarkMode ? '#fff' : '#111827',
            marginLeft: 8
          }}>Phone Number</Text>
        </View>
        {loading && <ActivityIndicator color="#15803d" />}
      </View>
      <View style={{ padding: 24 }}>
        <View style={{
          backgroundColor: isDarkMode ? 'rgba(30, 64, 175, 0.3)' : '#eff6ff',
          padding: 20,
          borderRadius: 16,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(30, 64, 175, 0.2)' : 'rgba(219, 234, 254, 0.5)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="shield-check" size={20} color={isDarkMode ? "#60A5FA" : "#1D4ED8"} />
            <Text style={{
              color: isDarkMode ? "#60A5FA" : "#1D4ED8",
              fontWeight: '500',
              marginLeft: 8
            }}>Verification Required</Text>
          </View>
          <Text style={{
            color: isDarkMode ? "#60A5FA" : "#1D4ED8",
            fontSize: 14
          }}>
            • Add your phone number for enhanced security{'\n'}
            • Receive SMS notifications and alerts{'\n'}
            • Enable two-factor authentication
          </Text>
        </View>
        <View style={{ marginBottom: 24 }}>
          <CustomPicker
            value={phoneData.countryCode}
            items={countryCodes}
            onValueChange={(value) => setPhoneData(prev => ({ ...prev, countryCode: value }))}
          />
        </View>
        {renderInput(
          'Phone Number',
          phoneData.number,
          (text) => setPhoneData(prev => ({ ...prev, number: text })),
          'phone-pad',
          errors.number
        )}
        <TouchableOpacity
          onPress={handleSendVerification}
          disabled={loading}
          style={{ marginTop: 32 }}
        >
          <LinearGradient
            colors={isDarkMode ? ['#059669', '#047857'] : ['#15803d', '#166534']}
            style={{ paddingVertical: 16, borderRadius: 16 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 18
            }}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={{
          color: '#6b7280',
          fontSize: 14,
          textAlign: 'center',
          marginTop: 24
        }}>
          Standard message and data rates may apply
        </Text>
      </View>
      {renderVerificationModal()}
    </SafeAreaView>
  );
};

export default PhoneNumber;

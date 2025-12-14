import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const API_URL = "https://trackeatfit.onrender.com";

const styleObj = {
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, marginLeft: -8, borderRadius: 999 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  infoBox: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTitle: { color: '#1D4ED8', fontWeight: '500', marginLeft: 8 },
  infoText: { color: '#1D4ED8', fontSize: 14 },
  inputContainer: { marginBottom: 24 },
  inputLabel: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  inputFocused: { borderColor: '#10B981' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  passwordHint: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  showPasswordButton: { position: 'absolute', right: 16, top: 16 },
  strengthMeter: { height: 6, borderRadius: 999, backgroundColor: '#E5E7EB', marginBottom: 8, overflow: 'hidden' },
  strengthBar: { height: '100%', borderRadius: 999 },
  strengthText: { fontSize: 14, marginBottom: 16 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  gradientBtn: { paddingVertical: 16, borderRadius: 16 },
  btnText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  otpModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  otpModal: { backgroundColor: 'white', padding: 24, borderRadius: 24, width: '90%', maxWidth: 350, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  otpTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  otpDesc: { color: '#4B5563', marginBottom: 16 },
  otpInput: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, fontSize: 16 },
  otpBtnRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  otpCancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  otpCancelText: { color: '#6B7280' },
  otpVerifyBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginLeft: 12 },
  otpVerifyText: { color: 'white', fontWeight: '500' },
};

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const validatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 0.25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 0.25;
    if (password.match(/[0-9]/)) strength += 0.25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 0.25;
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength < 0.25) return { backgroundColor: '#EF4444' };
    if (strength < 0.5) return { backgroundColor: '#F59E42' };
    if (strength < 0.75) return { backgroundColor: '#FACC15' };
    return { backgroundColor: '#22C55E' };
  };

  const getStrengthText = (strength) => {
    if (strength < 0.25) return 'Weak';
    if (strength < 0.5) return 'Fair';
    if (strength < 0.75) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = (text) => {
    const strength = validatePasswordStrength(text);
    setPasswordStrength(strength);
    setFormData(prev => ({ ...prev, newPassword: text }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, formData]);

  const verifyOTPAndUpdate = async (otp) => {
    try {
      const updateResponse = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth: { email }, // updated to match backend model
          newPassword: formData.newPassword,
          otp: otp
        })
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        Alert.alert(
          'Success',
          'Password reset successfully. Please login with your new password.',
          [{
            text: 'OK',
            onPress: () => {
              setLoading(false);
              router.replace('/(auth)/sign-in');
            }
          }]
        );
      } else {
        if (updateData.message === 'Invalid OTP') {
          Alert.alert(
            'Invalid OTP',
            'The verification code you entered is incorrect. Please try again.',
            [{
              text: 'OK',
              onPress: () => {
                setOtpInput('');
                setOtpModalVisible(true);
              }
            }]
          );
        } else if (updateData.message === 'OTP expired') {
          Alert.alert(
            'OTP Expired',
            'The verification code has expired. Please request a new one.',
            [{
              text: 'OK',
              onPress: () => {
                setOtpInput('');
                handleUpdatePassword(); // This will request a new OTP
              }
            }]
          );
        } else {
          throw new Error(updateData.message || 'Failed to reset password');
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
      setOtpModalVisible(false);
      if (!otpInput) setOtpInput('');
    }
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const sendOtpResponse = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth: { email }, // updated to match backend model
          purpose: 'password_reset'
        })
      });

      const sendOtpData = await sendOtpResponse.json();

      if (sendOtpData.success) {
        setOtpModalVisible(true);
      } else {
        throw new Error(sendOtpData.message || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  const renderPasswordInput = (label, key, placeholder, error = '') => (
    <View style={styleObj.inputContainer}>
      <Text style={styleObj.inputLabel}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={formData[key]}
          onChangeText={(text) => key === 'newPassword' ?
            handlePasswordChange(text) :
            setFormData(prev => ({ ...prev, [key]: text }))
          }
          secureTextEntry={!showPasswords[key]}
          style={[
            styleObj.input,
            error ? styleObj.inputError : {},
            focusedField === key ? styleObj.inputFocused : {},
          ]}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={styleObj.showPasswordButton}
          onPress={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))
          }
        >
          <MaterialCommunityIcons
            name={showPasswords[key] ? 'eye-off' : 'eye'}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styleObj.errorText}>{error}</Text> : null}
      {key === 'newPassword' && (
        <>
          <View style={styleObj.strengthMeter}>
            <View
              style={[
                styleObj.strengthBar,
                getStrengthColor(passwordStrength),
                { width: `${passwordStrength * 100}%` }
              ]}
            />
          </View>
          <Text style={styleObj.strengthText}>
            Password Strength: <Text style={{ fontWeight: '500' }}>{getStrengthText(passwordStrength)}</Text>
          </Text>
          <Text style={styleObj.passwordHint}>
            Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters
          </Text>
        </>
      )}
    </View>
  );

  const renderOTPModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={otpModalVisible}
      onRequestClose={() => {
        setOtpModalVisible(false);
        setOtpInput('');
        setLoading(false);
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={Keyboard.dismiss}
          style={styleObj.otpModalOverlay}
        >
          <View style={styleObj.otpModal}>
            <Text style={styleObj.otpTitle}>Enter OTP</Text>
            <Text style={styleObj.otpDesc}>
              Please enter the verification code sent to {email}
            </Text>
            <TextInput
              value={otpInput}
              onChangeText={setOtpInput}
              style={styleObj.otpInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              onSubmitEditing={() => {
                setOtpModalVisible(false);
                verifyOTPAndUpdate(otpInput);
              }}
            />
            <View style={styleObj.otpBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  setOtpModalVisible(false);
                  setOtpInput('');
                  setLoading(false);
                }}
                style={styleObj.otpCancelBtn}
              >
                <Text style={styleObj.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setOtpModalVisible(false);
                  verifyOTPAndUpdate(otpInput);
                }}
                style={styleObj.otpVerifyBtn}
              >
                <Text style={styleObj.otpVerifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styleObj.container}>
      <View style={styleObj.header}>
        <View style={styleObj.headerLeft}>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/sign-in')}
            style={styleObj.backBtn}
          >
            <Icon name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styleObj.headerTitle}>Reset Password</Text>
        </View>
        {loading && <ActivityIndicator color="#15803d" />}
      </View>

      <ScrollView
        style={styleObj.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styleObj.content}>
          <View style={styleObj.infoBox}>
            <View style={styleObj.infoRow}>
              <MaterialCommunityIcons name="shield-lock" size={20} color="#1D4ED8" />
              <Text style={styleObj.infoTitle}>Password Security</Text>
            </View>
            <Text style={styleObj.infoText}>
              • Choose a strong, unique password{'\n'}
              • Never share your password with anyone{'\n'}
              • Use a combination of letters, numbers, and symbols
            </Text>
          </View>

          <View style={styleObj.inputContainer}>
            <Text style={styleObj.inputLabel}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={[
                styleObj.input,
                errors.email ? styleObj.inputError : {},
              ]}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            {errors.email && <Text style={styleObj.errorText}>{errors.email}</Text>}
          </View>

          {renderPasswordInput(
            'New Password',
            'newPassword',
            'Enter new password',
            errors.newPassword
          )}

          {renderPasswordInput(
            'Confirm Password',
            'confirmPassword',
            'Confirm new password',
            errors.confirmPassword
          )}

          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={loading}
            style={{ marginTop: 16, marginBottom: 24 }}
          >
            <LinearGradient
              colors={['#15803d', '#166534']}
              style={styleObj.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styleObj.btnText}>
                {loading ? 'Sending OTP...' : 'Reset Password'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderOTPModal()}
    </SafeAreaView>
  );
};

export default ResetPassword;

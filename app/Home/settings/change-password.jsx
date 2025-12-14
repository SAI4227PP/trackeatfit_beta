import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const styles = {
  container: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  inputFocused: {
    borderColor: '#10b981',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4,
  },
  infoBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  strengthMeter: {
    height: 6,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 8,
  },
  strengthText: {
    fontSize: 14,
    marginBottom: 16,
  },
  passwordHint: {
    fontSize: 14,
    marginTop: 4,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: '500',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
  },
  gradientBtn: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    width: '90%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDesc: {
    color: '#4b5563',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    fontSize: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#6b7280',
  },
  modalVerifyBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalVerifyText: {
    color: '#fff',
    fontWeight: '500',
  },
};

const ChangePassword = () => {
  const { user, signOut } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const userEmail = user?.auth?.email || user?.email;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
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
    if (strength < 0.25) return { backgroundColor: '#ef4444' };
    if (strength < 0.5) return { backgroundColor: '#f59e42' };
    if (strength < 0.75) return { backgroundColor: '#fde047' };
    return { backgroundColor: '#22c55e' };
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

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const verifyOTPAndUpdate = async (otp) => {
    console.log('Starting OTP verification with length:', otp.length);
    try {
      console.log('Sending verification request with OTP');
      const updateResponse = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth: { email: userEmail },
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          otp: otp
        })
      });

      console.log('Verify API Response status:', updateResponse.status);
      const updateData = await updateResponse.json();
      console.log('Verify API Response:', updateData);

      if (updateData.success) {
        console.log('Password updated successfully');
        Alert.alert(
          'Success',
          'Password updated successfully.',
          [{
            text: 'OK',
            onPress: () => {
              setLoading(false);
              router.back();
            }
          }]
        );
      } else {
        if (updateData.message === 'Current password is incorrect') {
          Alert.alert(
            'Incorrect Password',
            'The current password you entered is incorrect. Please verify and try again.',
            [{
              text: 'OK',
              onPress: () => {
                setFormData(prev => ({ ...prev, currentPassword: '' }));
                setErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
              }
            }]
          );
        } else {
          throw new Error(updateData.message || 'Failed to update password');
        }
      }
    } catch (error) {
      console.error('Error in verifyOTPAndUpdate:', error);
      Alert.alert(
        'Error',
        error.message || 'Invalid OTP or update failed'
      );
    } finally {
      setLoading(false);
      setOtpModalVisible(false);
      setOtpInput('');
    }
  };

  const handleUpdatePassword = async () => {
    console.log('Starting password update process...');
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending OTP request for:', userEmail);
      const sendOtpResponse = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth: { email: userEmail },
          purpose: 'password_change'
        })
      });

      console.log('OTP API Response status:', sendOtpResponse.status);
      const sendOtpData = await sendOtpResponse.json();
      console.log('OTP API Response:', sendOtpData);

      if (sendOtpData.success) {
        console.log('OTP sent successfully, showing modal');
        setOtpModalVisible(true);
      } else {
        throw new Error(sendOtpData.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error in handleUpdatePassword:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    }
  };

  const getThemedStyles = {
    container: {
      ...styles.container,
      backgroundColor: isDarkMode ? '#111827' : '#fff',
    },
    inputLabel: {
      ...styles.inputLabel,
      color: isDarkMode ? '#d1d5db' : '#374151',
    },
    input: {
      ...styles.input,
      backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
      color: isDarkMode ? '#fff' : '#111827',
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    },
    infoBox: {
      ...styles.infoBox,
      backgroundColor: isDarkMode ? 'rgba(30, 64, 175, 0.5)' : '#eff6ff',
    },
    passwordHint: {
      ...styles.passwordHint,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    },
  };

  const renderPasswordInput = (label, key, placeholder, error = '') => (
    <View style={styles.inputContainer}>
      <Text style={getThemedStyles.inputLabel}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={formData[key]}
          onChangeText={(text) => key === 'newPassword' ? 
            handlePasswordChange(text) : 
            setFormData(prev => ({ ...prev, [key]: text }))
          }
          secureTextEntry={!showPasswords[key]}
          style={{
            ...getThemedStyles.input,
            ...(error ? styles.inputError : {}),
            ...(focusedField === key ? styles.inputFocused : {}),
          }}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
        />
        <TouchableOpacity 
          style={styles.showPasswordButton}
          onPress={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))
          }
        >
          <MaterialCommunityIcons
            name={showPasswords[key] ? 'eye-off' : 'eye'}
            size={24}
            color={isDarkMode ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {key === 'newPassword' && (
        <>
          <View style={{
            ...styles.strengthMeter,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          }}>
            <View 
              style={{
                ...styles.strengthBar,
                ...getStrengthColor(passwordStrength),
                width: `${passwordStrength * 100}%`,
              }}
            />
          </View>
          <Text style={{
            ...styles.strengthText,
            color: isDarkMode ? '#d1d5db' : '#374151',
          }}>
            Password Strength: <Text style={{ fontWeight: '500' }}>{getStrengthText(passwordStrength)}</Text>
          </Text>
          <Text style={getThemedStyles.passwordHint}>
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
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalDesc}>
              Please enter the verification code sent to {userEmail}
            </Text>
            <TextInput
              value={otpInput}
              onChangeText={setOtpInput}
              style={styles.modalInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              onSubmitEditing={() => {
                setOtpModalVisible(false);
                verifyOTPAndUpdate(otpInput);
              }}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  setOtpModalVisible(false);
                  setOtpInput('');
                  setLoading(false);
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setOtpModalVisible(false);
                  verifyOTPAndUpdate(otpInput);
                }}
                style={styles.modalVerifyBtn}
              >
                <Text style={styles.modalVerifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={getThemedStyles.container}>
      <View style={{
        ...styles.header,
        borderBottomColor: isDarkMode ? '#1f2937' : '#f3f4f6',
      }}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{
              ...styles.headerBackBtn,
              backgroundColor: isDarkMode ? undefined : undefined,
            }}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? '#E5E7EB' : '#374151'} />
          </TouchableOpacity>
          <Text style={{
            ...styles.headerTitle,
            color: isDarkMode ? '#fff' : '#111827',
          }}>
            Change Password
          </Text>
        </View>
        {loading && <ActivityIndicator color="#15803d" />}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={getThemedStyles.infoBox}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="shield-lock" size={20} color="#1D4ED8" />
              <Text style={{
                ...styles.infoTitle,
                color: isDarkMode ? '#93c5fd' : '#1d4ed8',
              }}>Password Security</Text>
            </View>
            <Text style={{
              ...styles.infoText,
              color: isDarkMode ? '#93c5fd' : '#1d4ed8',
            }}>
              • Choose a strong, unique password{'\n'}
              • Never share your password with anyone{'\n'}
              • Use a combination of letters, numbers, and symbols
            </Text>
          </View>

          {renderPasswordInput(
            'Current Password',
            'currentPassword',
            'Enter current password',
            errors.currentPassword
          )}

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
            style={styles.btnContainer}
          >
            <LinearGradient
              colors={['#15803d', '#166534']}
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={{
                color: '#fff',
                textAlign: 'center',
                fontWeight: '600',
              }}>
                {loading ? 'Updating...' : 'Update Password'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderOTPModal()}
    </SafeAreaView>
  );
};

export default ChangePassword;

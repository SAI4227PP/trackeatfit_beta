import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { useNavigation, useRouter } from 'expo-router';
import CustomAlert from '../../components/CustomAlertSign'; // new custom alert for signin/signup
import images from '../../constants/images';
import { useGlobalContext } from '../../context/GlobalProvider';
import analyticsService from '../../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

console.log('API_URL:', API_URL); // Log the API URL to verify it's correct

const styles = {
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollView: { flexGrow: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    padding: 24,
  },
  logo: { width: 96, height: 96 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  label: { color: '#374151', fontWeight: '500', marginBottom: 4, marginLeft: 4 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    // Add a fixed height for consistency
    height: 48,
  },
  inputFocused: { borderColor: '#000' },
  errorText: { color: '#ef4444' },
  passwordContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    // Change paddingVertical to match input
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    height: 48, // Match input height
  },
  passwordFocused: { borderColor: '#000' },
  passwordInput: { 
    flex: 1, 
    fontWeight: '600',
    height: 48, // Match input height
    paddingVertical: 12, // Match input padding
  },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  rememberMe: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#9ca3af',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#000' },
  rememberText: { color: '#4b5563' },
  forgotText: { color: '#3b82f6' },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  loginButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#d1d5db' },
  dividerText: { marginHorizontal: 8, color: '#6b7280' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  registerText: { color: '#6b7280' },
  registerLink: { color: '#3b82f6' },
};

const SignIn = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const globalContext = useGlobalContext() || {};
  const {
    setUser = () => {},
    setIsLoggedIn = () => {},
  } = globalContext;
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setSubmitting] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const [updated, setUpdated] = useState(false);
  const [cachedDeviceInfo, setCachedDeviceInfo] = useState(null);

  // Validation messages state
  const [validationMessage, setValidationMessage] = useState('');

  const router = useRouter();
  const navigation = useNavigation();

  const handleforgetpassword = () => {
    navigation.navigate('ResetPassword');
  }

  const handleCreateAccount = () => {
    navigation.navigate('sign-up');
  }

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@gmail\.com$/;
    return re.test(String(email).toLowerCase());
  }

  // Memoize device info to prevent unnecessary API calls
  const getDeviceInfo = useCallback(async () => {
    if (cachedDeviceInfo) {
      console.log('Using cached device info:', cachedDeviceInfo);
      return cachedDeviceInfo;
    }

    let ipAddress = 'unknown';
    const deviceInfo = {
      deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'mobile' : 'web',
      platform: Platform.OS,
      browser: Platform.select({
        web: navigator?.userAgent?.includes('Chrome') ? 'Chrome' : 
             navigator?.userAgent?.includes('Firefox') ? 'Firefox' : 
             navigator?.userAgent?.includes('Safari') ? 'Safari' : 'unknown',
        default: 'React Native'
      }),
      os: Platform.select({
        ios: `iOS ${Platform.Version}`,
        android: `Android ${Platform.Version}`,
        web: navigator?.platform || 'unknown'
      })
    };

    console.log('Initial device info:', deviceInfo);

    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      deviceInfo.ip = data.ip;
      console.log('IP address fetched:', data.ip);
    } catch (error) {
      console.error('Error fetching IP:', error);
      deviceInfo.ip = 'unknown';
    }

    console.log('Final device info:', deviceInfo);
    setCachedDeviceInfo(deviceInfo);
    return deviceInfo;
  }, [cachedDeviceInfo]);

  // Handle form submission
  const submit = async () => {
    // Reset validation message
    setValidationMessage('');

    if (!form.email && !form.password) {
      setValidationMessage('Please enter your email and password.');
      return;
    }
    if (!form.email) {
      setValidationMessage('Please enter your email.');
      return;
    }
    if (!form.password) {
      setValidationMessage('Please enter your password.');
      return;
    }

    if (!validateEmail(form.email)) {
      setEmailError('Invalid email');
      return;
    } else {
      setEmailError('');
    }

    if (form.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    } else {
      setPasswordError('');
    }

    setSubmitting(true);

    try {
      const deviceInfo = await getDeviceInfo();
      console.log('Sending sign-in request with device info:', { email: form.email, deviceInfo });

      const signInResponse = await fetch(`${API_URL}/users/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          deviceInfo
        }),
      });

      const signInData = await signInResponse.json();
      console.log('Sign-in response:', signInData);

      if (signInData.error) {
        // Handle specific error cases
        if (signInData.error.includes('Password incorrect')) {
          setPasswordError('Password incorrect. Please try again.');
        } else if (signInData.error.includes('Email not found')) {
          setEmailError('Email not found. Please check your email address.');
        } else {
          setAlertMessage(signInData.error);
          setIsAlertVisible(true);
        }
        analyticsService.logEvent('login', { method: 'email', status: 'error', error: signInData.error, email: form.email });
        return;
      }

      if (signInData.token) {
        console.log('Token received, fetching user data');
        // Save token to AsyncStorage with the correct key
        await AsyncStorage.setItem('authToken', signInData.token);
        console.log('Token saved to AsyncStorage:', signInData.token); // Log the token

        // Fetch current user data
        const userResponse = await fetch(`${API_URL}/users/get-current-user`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${signInData.token}`,
          },
        });

        const userData = await userResponse.json();
        console.log('User data received:', userData);
        // Update the user and force re-render
        setUser(userData.user);
        setIsLoggedIn(true);
        setUpdated(!updated); // Toggle the updated state

        // Save token and user data in AsyncStorage
        await AsyncStorage.setItem('authToken', signInData.token);
        await AsyncStorage.setItem('user', JSON.stringify(userData.user));
        
        // Check if the user's email is verified
        if (userData.emailVerification && userData.emailVerification === true) {
          setAlertMessage('Sign-in successful. Your email is already verified.');
          setIsAlertVisible(true);
          console.log('Email is already verified');
        } else {
          try {
            await fetch(`${API_URL}/send-verification-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: form.email }),
            });
            setAlertMessage('Verification email sent. Please verify your email.');
          } catch (error) {
            setAlertMessage(`Error sending verification email: ${error.message}`);
            setIsAlertVisible(true);
          }
        }

        analyticsService.logEvent('login', { method: 'email', status: 'success', email: form.email });
        console.log('Success', 'User signed in successfully');
      }
      router.replace('/home');
    } catch (error) {
      console.error('Sign-in error:', error);
      if (error.message.includes('Email not found')) {
        setEmailError('Email not found. Please check your email address or sign up.');
      } else if (error.message.includes('Password incorrect')) {
        setPasswordError('Password incorrect. Please check your password and try again.');
      } else if (error.message.includes('Too many login attempts')) {
        setRateLimitError('Too many login attempts. Please try again later.');
      } else if (
        error.message === 'Network request failed' ||
        error.message.includes('Network request failed')
      ) {
        setAlertMessage('Network error: Please check your internet connection and try again.');
        setIsAlertVisible(true);
      } else {
        setAlertMessage(error.message);
        setIsAlertVisible(true);
      }
      analyticsService.logEvent('login', { method: 'email', status: 'error', error: error.message, email: form.email });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <Image source={images?.logo} style={styles.logo} resizeMode="contain" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Please enter your details to login.</Text>

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="example@gmail.com"
                placeholderTextColor="#aaa"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                ]}
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.passwordContainer,
                passwordFocused && styles.passwordFocused,
              ]}>
                <TextInput
                  placeholder="********"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  style={[
                    styles.passwordInput,
                    { color: '#000' }  // Add explicit text color
                  ]}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Remember Me & Forgot */}
            <View style={styles.rememberRow}>
              <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.rememberMe}>
                <View style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={submit}
              style={styles.loginButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Register */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("sign-up")}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={isAlertVisible}
        onClose={() => setIsAlertVisible(false)}
        message={alertMessage}
        showAnimation={true}
      />
    </SafeAreaView>
  );
};
export default React.memo(SignIn);

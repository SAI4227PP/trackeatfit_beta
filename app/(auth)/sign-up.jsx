import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAlertSign from '../../components/CustomAlertSign';
import images from '../../constants/images';
import { useGlobalContext } from '../../context/GlobalProvider';
import analyticsService from '../../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

const SignUp = () => {
  const [isAlertVisible, setIsAlertVisible] = useState(false); // Add this line
  const [alertMessage, setAlertMessage] = useState(''); // State for alert message

  
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const globalContext = useGlobalContext();
  const {
    setUser = () => {},
    setIsLoggedIn = () => {},
  } = globalContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState(''); // State for email error message
  const [passwordError, setPasswordError] = useState(''); // State for password error message
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isCheckedNews, setIsCheckedNews] = useState(false); // State for news checkbox
  const [isCheckedData, setIsCheckedData] = useState(false); // State for data checkbox
  const [cachedDeviceInfo, setCachedDeviceInfo] = useState(null);
  const router = useRouter();
  const navigation = useNavigation();

  // Add focus states for each input
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Memoize device info to prevent unnecessary API calls
  const getDeviceInfo = useCallback(async () => {
    if (cachedDeviceInfo) {
      console.log('Using cached device info:', cachedDeviceInfo);
      return cachedDeviceInfo;
    }

    let ipAddress = 'unknown';
    // Use Device and Platform imports (same as sign-in)
    const deviceInfo = {
      deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'mobile' : 'web',
      platform: Platform.OS,
      browser: Platform.select
        ? Platform.select({
            web: typeof navigator !== 'undefined' && navigator?.userAgent?.includes('Chrome') ? 'Chrome' : 
                 typeof navigator !== 'undefined' && navigator?.userAgent?.includes('Firefox') ? 'Firefox' : 
                 typeof navigator !== 'undefined' && navigator?.userAgent?.includes('Safari') ? 'Safari' : 'unknown',
            default: 'React Native'
          })
        : 'React Native',
      os: Platform.select
        ? Platform.select({
            ios: `iOS ${Platform.Version}`,
            android: `Android ${Platform.Version}`,
            web: typeof navigator !== 'undefined' ? navigator?.platform || 'unknown' : 'unknown'
          })
        : 'unknown'
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

  useEffect(() => {
    const loadCheckboxState = async () => {
      try {
        const newsValue = await AsyncStorage.getItem('isCheckedNews');
        const dataValue = await AsyncStorage.getItem('isCheckedData');
        if (newsValue !== null) {
          setIsCheckedNews(JSON.parse(newsValue));
        }
        if (dataValue !== null) {
          setIsCheckedData(JSON.parse(dataValue));
        }
      } catch (error) {
        console.error('Failed to load checkbox state', error);
      }
    };

    loadCheckboxState();
  }, []);

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@gmail\.com$/;
    return re.test(String(email).toLowerCase());
  }

  const handleBack = () => {
    navigation.navigate('sign-in'); // Navigate to Search screen
  }

  const toggleCheckboxNews = async () => {
    try {
      const newValue = !isCheckedNews;
      setIsCheckedNews(newValue);
      await AsyncStorage.setItem('isCheckedNews', JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save checkbox state', error);
    }
  }

  const toggleCheckboxData = async () => {
    try {
      const newValue = !isCheckedData;
      setIsCheckedData(newValue);
      await AsyncStorage.setItem('isCheckedData', JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save checkbox state', error);
    }
  }

  // Function to extract the part before @ in the email
const generateUniqueName = (gmail) => {
  const prefix = gmail.split('@')[0]; // Get the part before "@"
  return prefix;
};

  // Replace showAlert to use CustomAlertSign
  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
  };

  // Handle form submission
  const submit = async () => {
    console.log("Form data:", form);  // Log the form data before submission

    if (!form.username || !form.email || !form.password) {
      showAlert('Please fill in all the fields');
      return;
    }

    if (!validateEmail(form.email)) {
      setEmailError('Invalid email');
      console.log("Email validation failed");  // Log email validation failure
      return;
    } else {
      setEmailError('');
    }

    if (form.password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      console.log("Password validation failed");  // Log password validation failure
      return;
    } else {
      setPasswordError('');
    }

    setIsSubmitting(true);

    try {

      // Generate unique name from email (before the @ symbol)
      let uniqueName = generateUniqueName(form.email);
      console.log("Generated unique name:", uniqueName);

      // Get device info
      const deviceInfo = await getDeviceInfo();
      console.log("Device info for registration:", deviceInfo);

      // Create the user using the fetch API
      const result = await fetch(`${API_URL}/users/create-user`, {  // Your API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          username: form.username,
          uniqueName: uniqueName,
          deviceInfo
        })
      });

      const resultData = await result.json();
      console.log("API response:", resultData);  // Log the API response

      if (resultData.message === "User created successfully") {
        console.log("User created successfully:", resultData);
      
        // Clear the checkbox states
        await AsyncStorage.removeItem('isCheckedNews');
        await AsyncStorage.removeItem('isCheckedData');

        if (!setUser || !setIsLoggedIn) {
          showAlert('Global context is not available. Please ensure the provider is set up.');
          setIsSubmitting(false);
          return;
        }

        // If you want to log the user in immediately after signup:
        setUser(resultData.user); // resultData.user should be the user object from backend
        setIsLoggedIn(true);
        // Optionally, save token if returned: await AsyncStorage.setItem('authToken', resultData.token);

        // If you want user to sign in manually, do not call setUser/setIsLoggedIn here.
        showAlert('Account created successfully! Please sign in.');
        analyticsService.logEvent('signup', { method: 'email', status: 'success', email: form.email });
      
      } else if (resultData.error) {
        setEmailError('An error occurred: ' + resultData.error);
        analyticsService.logEvent('signup', { method: 'email', status: 'error', error: resultData.error, email: form.email });
      } else {
        throw new Error(resultData.message || 'User creation failed');
      }
    } catch (error) {
      showAlert(error.message || 'An error occurred during sign up');
      analyticsService.logEvent('signup', { method: 'email', status: 'error', error: error.message, email: form.email });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWelcomeEmailRequest = async (username, email) => {
    try {
      const payload = { username, email };
      console.log("Email Payload:", payload); // Log the payload

      const response = await fetch(`${API_URL}/send-welcome-email`, { // Your backend URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    
      if (!response.ok) {
        throw new Error('Failed to send welcome email');
      }
      const result = await response.json();
      console.log("Welcome email response:", result);  // Log the entire response to see its structure
      
      // Check if 'uri' is present in the response
      if (result.uri) {
        console.log("Email sent, URI:", result.uri);  // Log the URI if present
      } else {
        console.warn("No URI returned in the response");
      }
      console.log("Welcome email sent successfully!");
    } catch (error) {
      console.error("Error sending welcome email:", error);
      setAlertMessage('Failed to send welcome email');
    }
  };

  const handlePrivacyNotice = () => {
    navigation.navigate('screens/PrivacyNotice');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#fff',
            width: '100%',
            maxWidth: 400,
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            padding: 24
          }}>
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <Image source={images.logo} style={{ width: 96, height: 96 }} resizeMode="contain" />
            </View>
            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>Create Account</Text>
            <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>Please enter your details to register.</Text>

            {/* Username Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 4, marginLeft: 4 }}>Username</Text>
              <TextInput
                placeholder="e.g. example"
                placeholderTextColor="#aaa"
                value={form.username}
                onChangeText={(text) => setForm({ ...form, username: text })}
                style={{
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontWeight: '600',
                  fontSize: 16,
                  backgroundColor: '#fff',
                  borderColor: usernameFocused ? '#000' : '#d1d5db'
                }}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
              />
            </View>
            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 4, marginLeft: 4 }}>Email</Text>
              <TextInput
                placeholder="example@gmail.com"
                placeholderTextColor="#aaa"
                value={form.email}
                onChangeText={(text) => {
                  setForm({ ...form, email: text });
                  if (!validateEmail(text)) {
                    setEmailError('Invalid email');
                  } else {
                    setEmailError('');
                  }
                }}
                style={{
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontWeight: '600',
                  fontSize: 16,
                  backgroundColor: '#fff',
                  borderColor: emailFocused ? '#000' : '#d1d5db'
                }}
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              {emailError ? <Text style={{ color: '#ef4444' }}>{emailError}</Text> : null}
            </View>
            {/* Password Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 4, marginLeft: 4 }}>Password</Text>
              <View style={{
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                backgroundColor: '#fff',
                borderColor: passwordFocused ? '#000' : '#d1d5db'
              }}>
                <TextInput
                  placeholder="********"
                  placeholderTextColor="#aaa"
                  value={form.password}
                  onChangeText={(e) => setForm({ ...form, password: e })}
                  onBlur={() => {
                    setPasswordFocused(false);
                    if (form.password.length < 8) {
                      setPasswordError('Password must be at least 8 characters');
                    } else {
                      setPasswordError('');
                    }
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    fontWeight: '600',
                    fontSize: 16,
                    color: '#111827',
                    paddingVertical: 0
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={{ color: '#ef4444' }}>{passwordError}</Text> : null}
            </View>

            {/* News Checkbox */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity onPress={toggleCheckboxNews} style={{ marginRight: 8 }}>
                <Ionicons name={isCheckedNews ? "checkbox" : "checkbox-outline"} size={20} color="black" />
              </TouchableOpacity>
              <Text style={{ flex: 1, color: '#374151', fontSize: 14 }}>
                I consent for receiving exciting news {'\n'}and special promotions as indicated in{' '}
                <Text style={{ color: '#047857', textDecorationLine: 'underline' }} onPress={handlePrivacyNotice}>Privacy Notice</Text>
              </Text>
            </View>
            {/* Data Checkbox */}
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity onPress={toggleCheckboxData} style={{ marginRight: 8 }}>
                <Ionicons name={isCheckedData ? "checkbox" : "checkbox-outline"} size={20} color="black" />
              </TouchableOpacity>
              <Text style={{ flex: 1, color: '#374151', fontSize: 14 }}>
                I consent to the processing of special{'\n'}categories of data as described in the{'\n'}
                <Text style={{ color: '#047857', textDecorationLine: 'underline' }} onPress={handlePrivacyNotice}>Privacy Notice</Text>
              </Text>
            </View> */}

            {/* Terms */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#374151' }}>
                By clicking Create account, I accept the{' '}
                <Text style={{ color: '#047857' }}>Terms & Conditions</Text>, confirm that I read the{' '}
                <Text style={{ color: '#047857' }}>Privacy Notice</Text> and the{' '}
                <Text style={{ color: '#047857' }}>Cookie Policy</Text>, and that I am over the age of 18.
              </Text>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={submit}
              style={{
                backgroundColor: emailError || passwordError ? '#d1d5db' : '#000',
                borderRadius: 16,
                paddingVertical: 12,
                marginBottom: 24,
                alignItems: 'center',
                opacity: emailError || passwordError ? 0.5 : 1
              }}
              disabled={!!emailError || !!passwordError || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: emailError || passwordError ? '#6b7280' : '#fff'
                }}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
              <Text style={{ marginHorizontal: 8, color: '#6b7280', fontWeight: '600' }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
            </View>

            {/* Register Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
              <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("sign-in")}>
                <Text style={{ color: '#3b82f6' }}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Custom Alert */}
      <CustomAlertSign
        visible={isAlertVisible}
        onClose={() => {
          setIsAlertVisible(false);
          // If the alert is for successful account creation, redirect to sign-in
          if (alertMessage && alertMessage.includes('successfully')) {
            router.push('/sign-in');
          }
        }}
        message={alertMessage}
        showAnimation={true}
      />
    </SafeAreaView>
  );
};

export default SignUp;
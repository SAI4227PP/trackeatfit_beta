import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const getStyles = (isDarkMode) => ({
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: isDarkMode ? '#e5e7eb' : '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
    color: isDarkMode ? '#fff' : '#111827',
    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
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
    backgroundColor: isDarkMode ? '#1f2937' : '#eff6ff',
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: isDarkMode ? 'rgba(59,130,246,0.2)' : undefined,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: '500',
    marginLeft: 8,
    color: isDarkMode ? '#60A5FA' : '#1D4ED8',
  },
  infoText: {
    color: isDarkMode ? '#e5e7eb' : '#1d4ed8',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#1f2937' : '#f3f4f6',
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
    color: isDarkMode ? '#fff' : '#111827',
  },
  content: {
    padding: 16,
  },
  gradientBtn: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnContainer: {
    marginTop: 16,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  infoFooter: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    color: isDarkMode ? '#9ca3af' : '#6b7280',
  },
});

const ChangeEmail = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { user, updateUser } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!newEmail) {
      newErrors.newEmail = 'New email is required';
    } else if (!validateEmail(newEmail)) {
      newErrors.newEmail = 'Please enter a valid email address';
    }

    if (newEmail === currentEmail) {
      newErrors.newEmail = 'New email must be different from current email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newEmail, password, currentEmail]);

  const handleUpdateEmail = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add your actual API call here
      await updateUser({
        ...user,
        email: newEmail,
        emailVerified: false,
      });

      Alert.alert(
        'Email Updated',
        'Please check your new email address for verification instructions.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        'Update Failed',
        'Failed to update email. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, setValue, isPassword = false, error = '') => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        secureTextEntry={isPassword}
        keyboardType={!isPassword ? 'email-address' : 'default'}
        autoCapitalize="none"
        style={{
          ...styles.input,
          ...(error ? styles.inputError : {}),
          ...(focusedField === label ? styles.inputFocused : {}),
        }}
        onFocus={() => setFocusedField(label)}
        onBlur={() => setFocusedField(null)}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
        editable={!!setValue}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerBackBtn}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Email</Text>
        </View>
        {loading && <ActivityIndicator color="#15803d" />}
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={20} color={isDarkMode ? "#60A5FA" : "#1D4ED8"} />
            <Text style={styles.infoTitle}>Important</Text>
          </View>
          <Text style={styles.infoText}>
            • You'll need to verify your new email address{'\n'}
            • Your current email will remain active until verification{'\n'}
            • Some services may be temporarily limited until verification
          </Text>
        </View>

        {renderInput('Current Email', currentEmail, null, false)}
        {renderInput('New Email', newEmail, setNewEmail, false, errors.newEmail)}
        {renderInput('Password', password, setPassword, true, errors.password)}

        <TouchableOpacity
          onPress={handleUpdateEmail}
          disabled={loading}
          style={styles.btnContainer}
        >
          <LinearGradient
            colors={['#15803d', '#166534']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.btnText}>
              {loading ? 'Updating...' : 'Update Email'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.infoFooter}>
          After updating, you'll receive a verification email at your new address
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ChangeEmail;

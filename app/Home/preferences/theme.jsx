import { useNavigation } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';

const ThemePreferences = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigation = useNavigation();

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack()
  };

  // Styles
  const styles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
    header: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginTop: 32,
    },
    backBtn: {
      padding: 8,
    },
    headerText: {
      fontSize: 20,
      fontWeight: '600',
      marginLeft: 12,
      color: isDarkMode ? '#FFFFFF' : '#111827',
    },
    content: {
      padding: 20,
      marginTop: 8,
    },
    selectThemeText: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 16,
      paddingHorizontal: 4,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    card: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    optionLight: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: !isDarkMode ? '#EFF6FF' : '#374151',
      borderWidth: 1,
      borderColor: !isDarkMode ? '#BFDBFE' : '#374151',
    },
    optionDark: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#EFF6FF' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDarkMode ? '#BFDBFE' : '#F3F4F6',
    },
    optionTextLight: {
      fontSize: 16,
      fontWeight: '600',
      color: !isDarkMode ? '#2563EB' : '#374151',
    },
    optionTextDark: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#2563EB' : '#374151',
    },
    optionDesc: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 4,
    },
    optionTextContainer: {
      marginLeft: 20,
      flex: 1,
    },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Appearance</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.selectThemeText}>SELECT THEME</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.optionLight}
            onPress={() => toggleTheme(false)}
          >
            <Icon name="sunny" size={26} color={!isDarkMode ? "#3B82F6" : "#6B7280"} />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTextLight}>Light Mode</Text>
              <Text style={styles.optionDesc}>Default theme with light background</Text>
            </View>
            {!isDarkMode && <Icon name="checkmark-circle" size={24} color="#3B82F6" />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionDark}
            onPress={() => toggleTheme(true)}
          >
            <Icon name="moon" size={26} color={isDarkMode ? "#3B82F6" : "#6B7280"} />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTextDark}>Dark Mode</Text>
              <Text style={styles.optionDesc}>Easier on the eyes in low light</Text>
            </View>
            {isDarkMode && <Icon name="checkmark-circle" size={24} color="#3B82F6" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ThemePreferences;

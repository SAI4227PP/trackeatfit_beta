import { useNavigation } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

/**
 * ProfileSettings Component
 * Displays user profile settings and navigation options
 */
const ProfileSettings = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = (route) => {
    if (route) {
      navigation.navigate(route);
    }
  };

  const settingOptions = [
    {
      title: 'Profile',
      options: [
        { label: 'Saved Posts', icon: 'bookmark-outline', route: 'Community/SavedPosts' },
        { label: 'Liked Posts', icon: 'heart-outline', route: 'Community/LikedPosts' },
      ]
    },
  ];

  // Styles
  const styles = {
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1f2937' : '#e5e7eb',
      backgroundColor: 'transparent',
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
    },
    sectionContainer: {
      marginBottom: 24,
      marginHorizontal: 16,
    },
    sectionTitle: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      textTransform: 'uppercase',
      fontWeight: 'bold',
      fontSize: 12,
      letterSpacing: 1.2,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    },
    sectionBox: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
      shadowColor: isDarkMode ? '#222' : '#aaa',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    optionRow: (isLast, isDarkMode) => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: 'transparent',
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
    }),
    optionIconContainer: {
      borderRadius: 9999,
      padding: 8,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionText: (textColor) => ({
      fontSize: 16,
      fontWeight: '500',
      color: textColor,
    }),
    chevron: {
      marginLeft: 8,
    },
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={styles.safeArea}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Settings Options */}
      <ScrollView style={{ flex: 1 }}>
        {settingOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {section.title}
            </Text>
            <View style={styles.sectionBox}>
              {section.options.map((option, optionIndex) => {
                const isLast = optionIndex === section.options.length - 1;
                const iconBg = isDarkMode ? '#374151' : '#f3f4f6';
                const textColor = option.textColor
                  ? (isDarkMode ? option.textColor : option.textColor)
                  : (isDarkMode ? '#fff' : '#111827');
                return (
                  <TouchableOpacity
                    key={optionIndex}
                    style={styles.optionRow(isLast, isDarkMode)}
                    onPress={() => option.onPress ? option.onPress() : handleNavigation(option.route)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.optionIconContainer, { backgroundColor: iconBg }]}>
                        <Icon
                          name={option.icon}
                          size={22}
                          color={option.textColor ? '#ef4444' : (isDarkMode ? '#f3f4f6' : '#374151')}
                        />
                      </View>
                      <Text style={styles.optionText(textColor)}>
                        {option.label}
                      </Text>
                    </View>
                    {option.route && (
                      <Icon name="chevron-forward-outline" size={20} color={isDarkMode ? '#9ca3af' : '#a3a3a3'} style={styles.chevron} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSettings;
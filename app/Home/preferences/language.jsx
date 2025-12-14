import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';

const languages = [
  { 
    code: 'en', 
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'suggested',
    rtl: false
  },
  { 
    code: 'te', 
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    region: 'suggested', // Added to suggested for Indian users
    rtl: false
  },
  { 
    code: 'hi', 
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    region: 'suggested',
    rtl: false
  },
  { 
    code: 'es', 
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'all',
    rtl: false
  },
  { 
    code: 'fr', 
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'all',
    rtl: false
  },
  { 
    code: 'de', 
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'all',
    rtl: false
  },
  { 
    code: 'ar', 
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    region: 'all',
    rtl: true
  },
  { 
    code: 'zh', 
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    region: 'all',
    rtl: false
  },
  // Add more languages as needed
];

// Add language-specific font handling
const getLanguageFont = (langCode) => {
  switch (langCode) {
    case 'te':
      return 'NotoSansTelugu'; // Make sure to include Telugu font
    case 'hi':
      return 'NotoSansDevanagari';
    default:
      return 'System';
  }
};

const Language = () => {
  const { isDarkMode } = useTheme();
  const { currentLanguage, changeLanguage, t, isLoading: contextLoading } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentLanguage) {
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await changeLanguage(selectedLanguage);
      Alert.alert(
        t('language.updateSuccess'),
        t('language.updateMessage'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', t('language.error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const styles = {
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backBtn: {
      padding: 8,
      marginLeft: -8,
      borderRadius: 999,
      // active:bg-gray-700 not supported, ignore
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
      color: isDarkMode ? '#E5E7EB' : '#111827',
    },
    loadingIndicator: {
      // No extra style needed
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    infoBox: {
      backgroundColor: '#EFF6FF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoTitle: {
      color: '#1D4ED8',
      fontWeight: '500',
      marginLeft: 8,
    },
    infoText: {
      color: '#1D4ED8',
      fontSize: 14,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 16,
      color: isDarkMode ? '#E5E7EB' : '#6B7280',
    },
    sectionTitleAll: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 16,
      color: isDarkMode ? '#E5E7EB' : '#9CA3AF',
    },
    languageItem: (dark) => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: dark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginBottom: 12,
    }),
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    flagContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    languageName: (dark) => ({
      fontSize: 16,
      fontWeight: '500',
      color: dark ? '#E5E7EB' : '#111827',
    }),
    nativeText: (dark) => ({
      fontSize: 14,
      color: dark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    }),
    saveButtonWrapper: {
      marginBottom: 24,
    },
    saveButton: {
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 24,
    },
    saveButtonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontWeight: '600',
    },
    loadingView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  };

  const LanguageItem = ({ language }) => (
    <TouchableOpacity 
      onPress={() => handleLanguageSelect(language.code)}
      style={styles.languageItem(isDarkMode)}
    >
      <View style={styles.languageInfo}>
        <View style={styles.flagContainer}>
          <Text style={{ fontSize: 24 }}>{language.flag}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.languageName(isDarkMode)}>
            {language.name}
          </Text>
          <Text 
            style={{
              ...styles.nativeText(isDarkMode),
              fontFamily: getLanguageFont(language.code),
            }}
          >
            {language.nativeName}
          </Text>
        </View>
      </View>
      {selectedLanguage === language.code && (
        <MaterialCommunityIcons name="check-circle" size={24} color="#15803d" />
      )}
    </TouchableOpacity>
  );

  if (contextLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={isDarkMode ? "#22c55e" : "#15803d"} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
          >
            <Icon name="chevron-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {t('common.language')}
          </Text>
        </View>
        {loading && <ActivityIndicator color={isDarkMode ? "#22c55e" : "#15803d"} />}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="translate" size={20} color="#1D4ED8" />
            <Text style={styles.infoTitle}>{t('language.infoTitle')}</Text>
          </View>
          <Text style={styles.infoText}>
            {t('language.infoText')}
          </Text>
        </View>

        {/* Suggested Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('language.suggestedLanguages')}
          </Text>
          {languages
            .filter(lang => lang.region === 'suggested')
            .map(language => (
              <LanguageItem key={language.code} language={language} />
            ))}
        </View>

        {/* All Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleAll}>
            {t('language.allLanguages')}
          </Text>
          {languages
            .filter(lang => lang.region === 'all')
            .map(language => (
              <LanguageItem key={language.code} language={language} />
            ))}
        </View>

        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={styles.saveButtonWrapper}
          >
            <LinearGradient
              colors={['#15803d', '#166534']}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.saveButtonText}>
                {loading ? t('common.saving') : t('common.save')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Language;

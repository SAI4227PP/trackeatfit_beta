import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { translations } from '../translations';

const LanguageContext = createContext();

const defaultLanguage = 'en';

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      await AsyncStorage.setItem('userLanguage', languageCode);
      setCurrentLanguage(languageCode);
      // Reload app to apply language changes
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  const translate = (key) => {
    try {
      // For English language, directly return without any translation
      if (currentLanguage === 'en') {
        const keys = key.split('.');
        let result = translations.en;
        for (const k of keys) {
          result = result?.[k];
        }
        return result || key;
      }

      // Only translate for non-English languages
      const keys = key.split('.');
      let translation = translations[currentLanguage];
      let result = translation;
      for (const k of keys) {
        if (!result || typeof result[k] === 'undefined') {
          // Fallback to English if translation is missing
          return translate(key);
        }
        result = result[k];
      }
      return result;
    } catch (error) {
      return key;
    }
  };

  return (
    <LanguageContext.Provider 
      value={{
        currentLanguage,
        changeLanguage,
        isLoading,
        t: translate
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

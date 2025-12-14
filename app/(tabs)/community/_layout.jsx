import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from "expo-router";
import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

const TabIcon = ({ icon, color, name, focused, size }) => {
  const { isDarkMode } = useTheme();
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={{
          backgroundColor: 'transparent',
          borderRadius: 24,
          padding: 9,
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 58,
          marginTop: 25,
        }}
      >
        <Ionicons
          name={icon}
          size={focused ? 35 : 30}
          color={focused ? (isDarkMode ? '#CFE1B9' : '#2F4858') : (isDarkMode ? 'white' : '#2F4858')}
        />
      </View>
      <Text style={[
        styles.iconText,
        focused && styles.iconTextActive,
        isDarkMode && { color: 'white' },
        isDarkMode && focused && { color: '#CFE1B9' }
      ]}>
        {name}
      </Text>
    </View>
  );
};

const CommunityLayout = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
        <Tabs
          screenOptions={{
            tabBarShowLabel: false,
            tabBarBackground: () => (
              <LinearGradient
                colors={isDarkMode ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F8F9FA']}
                style={[styles.tabBar, { marginTop: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            ),
            tabBarStyle: {
              position: 'absolute',
              height: 70,
              bottom: keyboardVisible ? -100 : 15,
              left: width * 0.05,
              right: width * 0.05,
              borderRadius: 20,
              paddingTop: 12,
              backgroundColor: 'transparent',
              elevation: 8,
              shadowColor: isDarkMode ? '#000' : '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 3,
              opacity: keyboardVisible ? 0 : 1,
              display: keyboardVisible ? 'none' : 'flex',
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="all_news"
            options={{
              title: "All News",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={focused ? "newspaper" : "newspaper-outline"}
                  color={color}
                  focused={focused}
                  size={focused ? 35 : 30}
                  // name="All News"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="Search"
            options={{
              title: "Search",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={focused ? "search" : "search-outline"}
                  color={color}
                  focused={focused}
                  size={focused ? 35 : 30}
                  // name="Search"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="for_you"
            options={{
              title: "For You",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={focused ? "heart" : "heart-outline"}
                  color={color}
                  focused={focused}
                  size={focused ? 35 : 30}
                  // name="For You"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="Profile"
            options={{
              title: "Profile",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={focused ? "person" : "person-outline"}
                  color={color}
                  focused={focused}
                  size={focused ? 35 : 30}
                  // name="Profile"
                />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: '100%',
    width: '100%',
    borderRadius: 20,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconText: {
    fontSize: 12,
    color: '#2F4858',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  iconTextActive: {
    color: '#2F4858',
    fontFamily: 'Inter-Bold',
  },
});

export default CommunityLayout;

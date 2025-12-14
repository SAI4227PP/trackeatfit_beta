import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

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

const TabsLayout = () => {
    const router = useRouter();
    const { isDarkMode } = useTheme();

    const isTabHidden = (routeName) => ['community'].includes(routeName);

    return (
        <SafeAreaProvider style={{ backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
            <Tabs
                screenOptions={({ route }) => ({
                    tabBarShowLabel: false,
                    tabBarBackground: () => (
                        <LinearGradient
                            colors={isDarkMode ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F8F9FA']}
                            style={[styles.tabBar, { marginTop: -1 }]} // Add negative margin to remove gap
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    ),
                    tabBarStyle: {
                        position: 'absolute',
                        height: 75,
                        bottom: 25,
                        left: width * 0.05,
                        right: width * 0.05,
                        borderRadius: 20,
                        paddingTop: 12,
                        backgroundColor: 'transparent',
                        display: isTabHidden(route.name) ? 'none' : 'flex',
                        elevation: 8,
                        shadowColor: isDarkMode ? '#000' : '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: isDarkMode ? 0.3 : 0.1,
                        shadowRadius: 3,
                    },
                })}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                icon={focused ? "home" : "home-outline"} 
                                // name="Home"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="meals"
                    options={{
                        title: 'Meals',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                icon={focused ? "restaurant" : "restaurant-outline"} 
                                // name="Meals"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
                {/* <Tabs.Screen
                    name="ai-diet"
                    options={{
                        title: 'AI Diet',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                icon={focused ? "nutrition" : "nutrition-outline"} 
                                // name="AI Diet"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                /> */}
                <Tabs.Screen
                    name="recipe"
                    options={{
                        title: 'Recipe',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                icon={focused ? "book" : "book-outline"} 
                                // name="Recipe"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="community"
                    options={{
                        title: 'Community',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                icon={focused ? "people" : "people-outline"} 
                                // name="Community"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
            </Tabs>
        </SafeAreaProvider>
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

export default TabsLayout;

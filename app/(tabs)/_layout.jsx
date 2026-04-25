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
                        height: 85,
                        bottom: 20,
                        left: width * 0.05,
                        right: width * 0.05,
                        borderRadius: 25,
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingHorizontal: 8,
                        backgroundColor: 'transparent',
                        display: isTabHidden(route.name) ? 'none' : 'flex',
                        elevation: 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: isDarkMode ? 0.3 : 0.2,
                        shadowRadius: 25,
                        borderWidth: 1,
                        borderTopWidth: 1.5,
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
                        borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)',
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
    tabBarBackground: {
        flex: 1,
        borderRadius: 25,
        overflow: 'hidden',
    },
    tabBarGradient: {
        flex: 1,
        borderRadius: 25,
        position: 'relative',
    },
    glassOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
        borderRadius: 25,
    },
    bottomHighlight: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    tabIconContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    iconWrapper: {
        borderRadius: 20,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        marginBottom: 2,
    },
    iconText: {
        fontSize: 11,
        color: 'rgba(47, 72, 88, 0.7)',
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 13,
    },
    iconTextActive: {
        color: '#2F4858',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        letterSpacing: 0.3,
    },
});

export default TabsLayout;

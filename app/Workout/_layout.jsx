
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const TabIcon = ({ icon, name, focused, size }) => {
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

const WorkoutLayout = () => {
    const router = useRouter();
    const { isDarkMode } = useTheme();

    return (
        <SafeAreaProvider style={{ backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
            <Tabs
                screenOptions={({ route }) => ({
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
                        height: 75,
                        bottom: 25,
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
                    },
                })}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        headerShown: false,
                        tabBarIcon: ({ focused }) => (
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
                    name="exercises"
                    options={{
                        title: 'Exercises',
                        headerShown: false,
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                icon={focused ? "barbell" : "barbell-outline"} 
                                // name="Exercises"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="programs"
                    options={{
                        title: 'Programs',
                        headerShown: false,
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                icon={focused ? "calendar" : "calendar-outline"} 
                                // name="Programs"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="progress"
                    options={{
                        title: 'Progress',
                        headerShown: false,
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                icon={focused ? "trending-up" : "trending-up-outline"} 
                                // name="Progress"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                />
                {/* <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        headerShown: false,
                        tabBarIcon: ({ focused }) => (
                            <TabIcon 
                                icon={focused ? "person" : "person-outline"} 
                                name="Profile"
                                focused={focused} 
                                size={focused ? 35 : 30} 
                            />
                        ),
                    }}
                /> */}
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

export default WorkoutLayout;

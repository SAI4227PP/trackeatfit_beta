import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCaloriesContext } from '../../context/CaloriesContext';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const LevelProgress = () => {
  const navigation = useNavigation();
  const { user, updateUserLevel } = useGlobalContext(); // Add updateUserLevel from context
  const { goalCalories, foodCalories, exerciseCalories } = useCaloriesContext();
  const { isDarkMode } = useTheme();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const levels = [
    { level: 1, xp: 0, status: 'Nutrition Novice', color: '#9ca3af' },
    { level: 2, xp: 50, status: 'Health Explorer', color: '#60a5fa' },
    { level: 3, xp: 100, status: 'Wellness Seeker', color: '#34d399' },
    { level: 4, xp: 200, status: 'Fitness Enthusiast', color: '#a78bfa' },
    { level: 5, xp: 350, status: 'Health Champion', color: '#f59e0b' },
    { level: 6, xp: 550, status: 'Nutrition Pro', color: '#ec4899' },
    { level: 7, xp: 800, status: 'Wellness Warrior', color: '#6366f1' },
    { level: 8, xp: 1100, status: 'Health Expert', color: '#8b5cf6' },
    { level: 9, xp: 1450, status: 'Elite Achiever', color: '#ef4444' },
    { level: 10, xp: 1850, status: 'Wellness Master', color: '#f59e0b' }
  ];

  const calculateLevel = useCallback(() => {
    const workoutsFactor = exerciseCalories / 100;
    const streakFactor = (user?.streak || 0) * 5;
    const goalsFactor = (foodCalories / goalCalories) * 10;
    
    const streakMultiplier = user?.streak >= 7 ? 1.2 : 1;
    
    const totalXP = (workoutsFactor + streakFactor + goalsFactor) * streakMultiplier;
    
    const currentLevel = levels.reduce((acc, curr) => {
      if (totalXP >= curr.xp) return curr.level;
      return acc;
    }, 1);

    const currentLevelData = levels.find(l => l.level === currentLevel);
    const nextLevelData = levels.find(l => l.level === currentLevel + 1);
    const progress = nextLevelData 
      ? ((totalXP - currentLevelData.xp) / (nextLevelData.xp - currentLevelData.xp)) * 100 
      : 100;

    return {
      level: currentLevel,
      progress: progress.toFixed(0),
      totalXP: Math.floor(totalXP),
      nextLevel: nextLevelData,
      xpToNext: nextLevelData ? nextLevelData.xp - totalXP : 0
    };
  }, [exerciseCalories, user?.streak, foodCalories, goalCalories]);

  // Add effect to update level in GlobalProvider when it changes
  useEffect(() => {
    const updateLevel = async () => {
      if (!user) return;
      
      const newProgress = calculateLevel();
      
      // Check if level or XP has changed
      if (newProgress.level !== user.level || newProgress.totalXP !== user.xp) {
        console.log('Updating level/XP:', { 
          newLevel: newProgress.level, 
          newXP: newProgress.totalXP,
          oldLevel: user.level,
          oldXP: user.xp
        });
        
        const success = await updateUserLevel(
          newProgress.level, 
          Math.floor(newProgress.totalXP)
        );
        
        if (success) {
          console.log('Level/XP updated successfully:', {
            level: newProgress.level,
            xp: newProgress.totalXP
          });
        } else {
          console.error('Failed to update level/XP');
        }
      }
    };

    updateLevel();
  }, [calculateLevel, user?.level, user?.xp, updateUserLevel]);

  const userProgress = calculateLevel();

  // Add this helper function to get current status
  const getCurrentStatus = () => {
    const currentLevel = levels.find(l => l.level === userProgress.level);
    return currentLevel?.status || 'Beginner';
  };

  const InfoModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showInfoModal}
      onRequestClose={() => setShowInfoModal(false)}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
        onPress={() => setShowInfoModal(false)}
      >
        <View style={{ 
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          margin: 16,
          padding: 24,
          borderRadius: 16,
          width: '90%'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#111827' }}>Level System Info</Text>
            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#374151"} />
            </TouchableOpacity>
          </View>
          
          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: 12, fontWeight: '600' }}>How to Earn XP:</Text>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280', marginBottom: 8 }}>• Complete your daily calorie goals</Text>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280', marginBottom: 8 }}>• Log your exercises</Text>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280', marginBottom: 8 }}>• Maintain daily streaks</Text>
          </View>

          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: 12, fontWeight: '600' }}>Bonus XP:</Text>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280', marginBottom: 8 }}>• 7+ day streak: 20% XP bonus</Text>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280', marginBottom: 8 }}>• Daily streak: +5 XP per day</Text>
          </View>

          <Text style={{ color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: 12, fontWeight: '600' }}>Level Benefits:</Text>
          <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280' }}>
            Each level unlocks new features and rewards. Keep maintaining your healthy habits to reach higher levels!
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#ffffff' }}>
      <LinearGradient 
        colors={isDarkMode ? 
          ['#1f2937', '#111827', '#030712'] : 
          ['#f8fafc', '#f1f5f9', '#e2e8f0']
        } 
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ 
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#374151"} />
              </TouchableOpacity>
              <Text style={{ 
                fontSize: 20,
                fontWeight: 'bold',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>Level Progress</Text>
            </View>
            <TouchableOpacity 
              style={{ padding: 8 }}
              onPress={() => setShowInfoModal(true)}
            >
              <Ionicons name="information-circle-outline" size={24} color={isDarkMode ? "#fff" : "#374151"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Modal */}
        <InfoModal />

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Level Card */}
          <View style={{ padding: 16 }}>
            <LinearGradient
              colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
              style={{
                borderRadius: 16,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <View style={{ 
                  backgroundColor: '#fef3c7',
                  borderRadius: 9999,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <Ionicons name="trophy" size={40} color="#f59e0b" />
                </View>
                <Text style={{ 
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>Level {userProgress.level}</Text>
                <Text style={{ 
                  fontSize: 18,
                  color: isDarkMode ? '#f3f4f6' : '#4b5563',
                  marginTop: 4
                }}>{getCurrentStatus()}</Text>
                <Text style={{ 
                  color: isDarkMode ? '#e5e7eb' : '#6b7280',
                  marginTop: 8
                }}>
                  {userProgress.xpToNext} XP to Level {userProgress.level + 1}
                </Text>
                
                {/* Progress Bar */}
                <View style={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                  width: '100%',
                  height: 8,
                  borderRadius: 9999,
                  marginTop: 16
                }}>
                  <View 
                    style={{
                      height: 8,
                      backgroundColor: '#f59e0b',
                      borderRadius: 9999,
                      width: `${userProgress.progress}%`
                    }}
                  />
                </View>
                <Text style={{ 
                  color: isDarkMode ? '#e5e7eb' : '#4b5563',
                  marginTop: 8
                }}>
                  {userProgress.progress}% Complete
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stats Section */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827',
              marginBottom: 16
            }}>Your Stats</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ 
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                borderRadius: 12,
                padding: 16,
                flex: 1,
                marginRight: 8
              }}>
                <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280' }}>Total XP</Text>
                <Text style={{ 
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>{userProgress.totalXP}</Text>
              </View>
              <View style={{ 
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                borderRadius: 12,
                padding: 16,
                flex: 1,
                marginLeft: 8
              }}>
                <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280' }}>Daily Streak</Text>
                <Text style={{ 
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}>{user?.streak || 0} days</Text>
              </View>
            </View>
          </View>

          {/* Add Streak Card after Stats Section */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827',
              marginBottom: 16
            }}>Current Streak</Text>
            <View style={{ 
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 16
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    backgroundColor: '#fef2c0',
                    padding: 12,
                    borderRadius: 9999
                  }}>
                    <Ionicons name="flash" size={24} color="#D97706" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ 
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: isDarkMode ? '#ffffff' : '#111827'
                    }}>{user?.streak || 0} days</Text>
                    <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280' }}>Keep it up!</Text>
                  </View>
                </View>
                {user?.streak >= 7 && (
                  <View style={{ 
                    backgroundColor: '#fef2c0',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 9999
                  }}>
                    <Text style={{ color: '#b45309', fontWeight: 'semibold', fontSize: 12 }}>+20% XP Bonus</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Level Path */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ 
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#111827',
              marginBottom: 16
            }}>Level Path</Text>
            {levels.map((level, index) => (
              <Animated.View
                key={level.level}
                entering={FadeIn.delay(index * 100)}
                style={{ marginBottom: 16 }}
              >
                <View style={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: level.level === userProgress.level ? 2 : 0,
                  borderColor: level.level === userProgress.level ? '#f59e0b' : 'transparent'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${level.color}20`
                      }}>
                        <Text style={{ color: level.color, fontWeight: 'bold' }}>
                          {level.level}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ 
                          color: isDarkMode ? '#ffffff' : '#111827',
                          fontWeight: 'bold'
                        }}>Level {level.level}</Text>
                        <Text style={{ color: isDarkMode ? '#e5e7eb' : '#6b7280' }}>{level.status}</Text>
                      </View>
                    </View>
                    <Text style={{ color: isDarkMode ? '#d1d5db' : '#9ca3af' }}>{level.xp} XP</Text>
                  </View>
                  {level.level <= userProgress.level && (
                    <View style={{ 
                      position: 'absolute',
                      top: -4,
                      right: -4
                    }}>
                      <View style={{ 
                        backgroundColor: '#10b981',
                        borderRadius: 9999,
                        padding: 4
                      }}>
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LevelProgress;

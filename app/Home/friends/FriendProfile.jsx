import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import { useGlobalContext } from '../../../context/GlobalProvider';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const FriendProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { friendId } = route.params;
  const { user } = useGlobalContext();
  const { isDarkMode } = useTheme();

  const isOwnProfile = user?._id === friendId;

  const [isFollowing, setIsFollowing] = useState(true);
  const [workoutInvites, setWorkoutInvites] = useState([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null); // 'none', 'pending', 'sent', 'friends'
  const [followedBack, setFollowedBack] = useState(false);
  const [mutualFollow, setMutualFollow] = useState(false);
  const [compareStats, setCompareStats] = useState({
    user: null,
    friend: null,
    loading: false,
    error: null
  });
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const staticCompareData = {
    user: {
      totalWorkouts: 12,
      totalDistance: 45.2,
      totalCalories: 3200,
      averageSpeed: 5.2,
      totalTime: 840,
      bestPace: '5:30',
      workoutStreak: 5,
      achievementCount: 8,
      weeklyGoalProgress: 75,
      preferredWorkoutTime: 'Morning'
    },
    friend: {
      totalWorkouts: 15,
      totalDistance: 52.8,
      totalCalories: 3800,
      averageSpeed: 5.8,
      totalTime: 920,
      bestPace: '5:15',
      workoutStreak: 7,
      achievementCount: 12,
      weeklyGoalProgress: 85,
      preferredWorkoutTime: 'Evening'
    }
  };

  const sampleWeeklyStats = {
    totalWorkouts: 8,
    totalDuration: 480, // in minutes
    totalDistance: 42.5, // in km
    totalCalories: 2800,
    averagePace: '5:30', // min/km
    bestWorkout: 'Morning Run',
    activeMinutes: 320,
    challengesCompleted: 3
  };

  const samplePreferredWorkouts = [
    'Morning Run',
    'HIIT Training',
    'Yoga Flow',
    'Strength Training',
    'Mountain Biking',
    'Swimming'
  ];

  const sampleRecentActivities = [
    {
      id: 1,
      activityType: 'workout',
      description: 'Morning Run with Sarah',
      duration: 45,
      distance: '5.2km',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      shared: true,
      details: 'Felt great! Perfect weather 🌤️'
    },
    {
      id: 2,
      activityType: 'trophy',
      description: 'Earned 5K Personal Best',
      duration: 28,
      distance: '5km',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      shared: true,
      achievement: 'New Record! 🏆'
    },
    {
      id: 3,
      activityType: 'workout',
      description: 'HIIT Training Session',
      duration: 30,
      calories: '350',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      shared: false,
      workoutType: 'Strength'
    },
    {
      id: 4,
      activityType: 'workout',
      description: 'Evening Yoga Flow',
      duration: 60,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      shared: true,
      moodAfter: 'Relaxed 🧘‍♂️'
    },
    {
      id: 5,
      activityType: 'trophy',
      description: 'Completed Weekly Challenge',
      duration: 0,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      shared: true,
      reward: '100 XP Bonus'
    },
    {
      id: 6,
      activityType: 'workout',
      description: 'Group Cycling Session',
      duration: 75,
      distance: '25km',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      shared: true,
      participants: 4
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTextColor = (type = 'primary') => {
    switch (type) {
      case 'primary':
        return isDarkMode ? 'text-white' : 'text-gray-900';
      case 'secondary':
        return isDarkMode ? 'text-gray-300' : 'text-gray-600';
      case 'muted':
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
      default:
        return isDarkMode ? 'text-white' : 'text-gray-900';
    }
  };

  const getBackgroundColor = (type = 'primary') => {
    switch (type) {
      case 'primary':
        return isDarkMode ? 'bg-gray-900' : 'bg-white';
      case 'secondary':
        return isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
      case 'highlight':
        return isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
      default:
        return isDarkMode ? 'bg-gray-900' : 'bg-white';
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoadingProfile(true);
      try {
        await Promise.all([
          fetchProfileData(),
          checkFriendshipStatus()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (friendId) {
      loadAllData();
    }
  }, [friendId]);

  const fetchProfileData = async () => {
    console.log('Fetching profile for ID:', friendId);
    try {
      const response = await fetch(`${API_URL}/api/friends/profile/${friendId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      const data = await response.json();
      setProfileData({
        ...data,
        weeklyStats: data.weeklyStats || sampleWeeklyStats,
        preferredWorkouts: data.preferredWorkouts || samplePreferredWorkouts,
        recentActivities: data.recentActivities || sampleRecentActivities
      });
    } catch (err) {
      throw err;
    }
  };

  const checkFriendshipStatus = async () => {
    if (!user?._id) return;
    try {
      setIsFetchingStatus(true);
      const response = await fetch(`${API_URL}/api/friends/status/${friendId}?userId=${user._id}`);

      if (!response.ok) {
        setFriendshipStatus('none');
        return;
      }

      const data = await response.json();
      setFriendshipStatus(data.status);
      setIsFollowing(data.isFollowing);
      setFollowedBack(data.isFollowedBack);
      setMutualFollow(data.mutualFollow);
    } catch (err) {
      console.error('Error:', err);
      setFriendshipStatus('none');
    } finally {
      setIsFetchingStatus(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchCompareStats = async () => {
    try {
      setCompareStats(prev => ({ ...prev, loading: true, error: null }));
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompareStats({
        user: staticCompareData.user,
        friend: staticCompareData.friend,
        loading: false,
        error: null
      });
    } catch (err) {
      setCompareStats(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load comparison data'
      }));
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleFriendRequest = async () => {
    try {
      const requestData = {
        senderId: user?._id
      };
      
      console.log('===== Friend Request =====');
      console.log('Sending request with data:', requestData);
      console.log('To friend ID:', friendId);
      console.log('Current user:', user);

      const response = await fetch(`${API_URL}/api/friends/request/${friendId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      console.log('Server response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send friend request');
      }
      
      console.log('Friend request sent successfully');
      setFriendshipStatus('sent');
      Toast.show({
        type: 'success',
        text1: 'Friend Request Sent',
        text2: 'They will be notified of your request'
      });
    } catch (err) {
      console.error('===== Friend Request Error =====');
      console.error('Error details:', err);
      console.error('User ID:', user?._id);
      console.error('Friend ID:', friendId);
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: err.message || 'Please try again later'
      });
    }
  };

  const handleUnfollow = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends/${friendId}?userId=${user._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unfollow');
      }

      setFriendshipStatus('none');
      setIsFollowing(false);
      Toast.show({
        type: 'success',
        text2: 'Successfully unfollowed'
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error unfollowing:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to unfollow'
      });
    }
  };

  const handleFollowToggle = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends/${friendId}/follow?userId=${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      const data = await response.json();
      console.log('Follow toggle response:', data);

      setIsFollowing(!isFollowing);
      if (!isFollowing && followedBack) {
        setMutualFollow(true);
      } else {
        setMutualFollow(false);
      }

      Toast.show({
        type: 'success',
        text2: !isFollowing ? 'Now following' : 'Unfollowed successfully'
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to update follow status'
      });
    }
  };

  const sendWorkoutInvite = (workoutType) => {
    const newInvite = {
      id: Date.now(),
      type: workoutType,
      date: new Date().toISOString(),
      status: 'pending'
    };
    setWorkoutInvites([...workoutInvites, newInvite]);
    setShowWorkoutModal(false);
  };

  const shareProfile = () => {
    // Implement share functionality
  };

  const handleChatPress = () => {
    const friendData = {
      _id: profileData?._id,
      username: profileData?.profile?.username,
      avatar: profileData?.profile?.avatar,
      isOnline: profileData?.meta?.isOnline,
      lastActive: profileData?.meta?.lastActive
    };
    
    console.log('Navigating to chat with friend data:', friendData);
    
    navigation.navigate('Home/friends/Chat', { 
      friend: encodeURIComponent(JSON.stringify({ user: user, friend: profileData })),
      friendData: encodeURIComponent(JSON.stringify(friendData))
    });
  };

  const achievements = [
    { id: 1, title: '5K Runner', icon: 'trophy', date: '2024-01-10' },
    { id: 2, title: 'Gym Warrior', icon: 'fitness', date: '2024-01-05' },
  ];

  const workoutStats = {
    weekly: {
      runs: { friend: 3, user: 4 },
      calories: { friend: 1200, user: 1500 },
      duration: { friend: 180, user: 200 },
      distance: { friend: 15, user: 18 }
    }
  };

  const LoadingSkeleton = () => (
    <SafeAreaView className={`flex-1 ${getBackgroundColor('secondary')}`}>
      <View className="px-4 pt-4">
        <View className="flex-row justify-between items-center mb-8">
          <View className="w-10 h-10 rounded-2xl bg-gray-200" />
          <View className="w-10 h-10 rounded-2xl bg-gray-200" />
        </View>
        <SkeletonPlaceholder 
          backgroundColor={isDarkMode ? '#1F2937' : '#F3F4F6'}
          highlightColor={isDarkMode ? '#374151' : '#E5E7EB'}
        >
          <View className="items-center">
            <View className="w-32 h-32 rounded-full mb-4" />
            <View className="w-48 h-6 rounded-xl mb-2" />
            <View className="w-36 h-4 rounded-xl mb-4" />
            <View className="w-full flex-row justify-around mb-6">
              <View className="items-center">
                <View className="w-16 h-6 rounded-xl mb-1" />
                <View className="w-20 h-4 rounded-xl" />
              </View>
              <View className="items-center">
                <View className="w-16 h-6 rounded-xl mb-1" />
                <View className="w-20 h-4 rounded-xl" />
              </View>
              <View className="items-center">
                <View className="w-16 h-6 rounded-xl mb-1" />
                <View className="w-20 h-4 rounded-xl" />
              </View>
            </View>
          </View>
        </SkeletonPlaceholder>
      </View>
    </SafeAreaView>
  );

  const ErrorState = ({ message, onRetry }) => (
    <SafeAreaView className={`flex-1 ${getBackgroundColor('secondary')} justify-center items-center p-4`}>
      <MotiView 
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className={`${getBackgroundColor()} p-8 rounded-3xl shadow-2xl mx-4 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}
      >
        <View className="items-center">
          <View className="bg-red-100 p-4 rounded-2xl mb-4">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text className={`text-xl font-semibold text-center mb-2 ${getTextColor()}`}>
            Oops!
          </Text>
          <Text className={`text-base text-center mb-6 ${getTextColor('secondary')}`}>
            {message}
          </Text>
          <TouchableOpacity 
            className="bg-blue-500 px-8 py-4 rounded-2xl shadow-lg active:scale-95 transform transition-all"
            onPress={onRetry}
          >
            <Text className="text-white font-semibold text-lg">Try Again</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    </SafeAreaView>
  );

  const renderCard = (title, count, children, delay = 0) => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', delay }}
      className={`${getBackgroundColor()} p-6 rounded-3xl shadow-lg mb-4 border ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100'}`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center space-x-2">
          <Text className={`text-lg font-bold ${getTextColor()}`}>{title}</Text>
          {count !== undefined && (
            <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} px-2.5 py-0.5 rounded-full`}>
              <Text className={`text-sm ${getTextColor('secondary')}`}>{count}</Text>
            </View>
          )}
        </View>
      </View>
      {children}
    </MotiView>
  );

  const renderWorkoutStats = () => (
    renderCard('Weekly Stats', undefined, (
      profileData?.weeklyStats ? (
        <View className="space-y-3">
          {Object.entries(profileData.weeklyStats).map(([key, value]) => (
            <View key={key} className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} p-4 rounded-2xl`}>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className={`${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'} p-2.5 rounded-xl`}>
                    <Ionicons 
                      name={
                        key === 'totalWorkouts' ? 'fitness' :
                        key === 'totalDuration' ? 'time' :
                        key === 'totalDistance' ? 'map' : 'flame'
                      } 
                      size={20} 
                      color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
                    />
                  </View>
                  <Text className={`ml-3 font-medium ${getTextColor()}`}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </View>
                <Text className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-bold text-lg`}>
                  {key === 'totalDuration' ? `${Math.round(value / 60)}h` :
                   key === 'totalDistance' ? `${value}km` :
                   value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="items-center py-6">
          <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 rounded-full mb-4`}>
            <Ionicons name="fitness-outline" size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          </View>
          <Text className={`${getTextColor('muted')} text-center`}>No workout data available</Text>
        </View>
      )
    ), 100)
  );

  const renderPreferredWorkouts = () => (
    renderCard('Preferred Workouts', profileData?.preferredWorkouts?.length || 0, (
      <View className="flex-row flex-wrap gap-2">
        {profileData?.preferredWorkouts?.map((workout, index) => (
          <View 
            key={index} 
            className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} 
              rounded-xl px-4 py-2.5 flex-row items-center`}
          >
            <Ionicons 
              name={
                workout.toLowerCase().includes('run') ? 'walk' :
                workout.toLowerCase().includes('gym') ? 'fitness' :
                workout.toLowerCase().includes('yoga') ? 'body' : 'barbell'
              }
              size={18}
              color={isDarkMode ? '#60A5FA' : '#2563EB'}
            />
            <Text className={`${isDarkMode ? 'text-blue-200' : 'text-blue-600'} font-medium ml-2`}>
              {workout}
            </Text>
          </View>
        ))}
      </View>
    ), 200)
  );

  const renderAchievements = () => (
    renderCard('Achievements', achievements.length, (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
        {achievements.map(achievement => (
          <View 
            key={achievement.id} 
            className={`mx-2 p-4 ${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-50'} rounded-2xl min-w-[120px]`}
          >
            <View className={`${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'} p-4 rounded-xl mb-3 self-start`}>
              <Ionicons name={achievement.icon} size={24} color={isDarkMode ? '#FCD34D' : '#F59E0B'} />
            </View>
            <Text className={`font-medium ${getTextColor()} mb-1`}>{achievement.title}</Text>
            <Text className={`text-xs ${getTextColor('muted')}`}>{achievement.date}</Text>
          </View>
        ))}
      </ScrollView>
    ), 300)
  );

  const renderRecentActivities = () => (
    renderCard('Recent Activities', profileData?.recentActivities?.length || 0, (
      <View className="space-y-4">
        {profileData?.recentActivities?.map((activity, index) => (
          <TouchableOpacity 
            key={index} 
            className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} p-4 rounded-2xl`}
            onPress={() => {/* Handle activity press */}}
          >
            <View className="flex-row items-start">
              <View className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} p-3 rounded-xl`}>
                <Ionicons 
                  name={activity.activityType === 'workout' ? 'fitness' : 'trophy'} 
                  size={20} 
                  color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
                />
              </View>
              <View className="flex-1 ml-4">
                <View className="flex-row justify-between items-start">
                  <Text className={`font-semibold ${getTextColor()}`}>{activity.description}</Text>
                  {activity.shared && (
                    <View className={`${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'} px-3 py-1 rounded-xl ml-2`}>
                      <Text className={`${isDarkMode ? 'text-green-200' : 'text-green-600'} text-xs font-medium`}>
                        Shared
                      </Text>
                    </View>
                  )}
                </View>
                
                <View className="flex-row items-center mt-2 flex-wrap gap-2">
                  {activity.duration > 0 && (
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <Text className={`${getTextColor('muted')} text-sm ml-1`}>
                        {activity.duration}min
                      </Text>
                    </View>
                  )}
                  
                  {activity.distance && (
                    <View className="flex-row items-center ml-3">
                      <Ionicons name="map-outline" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <Text className={`${getTextColor('muted')} text-sm ml-1`}>
                        {activity.distance}
                      </Text>
                    </View>
                  )}

                  {activity.calories && (
                    <View className="flex-row items-center ml-3">
                      <Ionicons name="flame-outline" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <Text className={`${getTextColor('muted')} text-sm ml-1`}>
                        {activity.calories} cal
                      </Text>
                    </View>
                  )}
                </View>

                {(activity.details || activity.achievement || activity.reward || activity.moodAfter) && (
                  <Text className={`${getTextColor('secondary')} text-sm mt-2`}>
                    {activity.details || activity.achievement || activity.reward || activity.moodAfter}
                  </Text>
                )}

                <Text className={`${getTextColor('muted')} text-xs mt-2`}>
                  {new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {(!profileData?.recentActivities || profileData.recentActivities.length === 0) && (
          <View className="items-center py-6">
            <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 rounded-full mb-4`}>
              <Ionicons name="document-text-outline" size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
            <Text className={`${getTextColor('muted')} text-center`}>No recent activities</Text>
          </View>
        )}
      </View>
    ), 400)
  );

  const renderCompareModal = () => (
    <Modal
      visible={showCompareModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCompareModal(false)}
    >
      <View className="flex-1 bg-black/50">
        <View className={`${getBackgroundColor()} rounded-t-3xl absolute bottom-0 w-full h-4/5 p-6`}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-bold ${getTextColor()}`}>
              Workout Comparison
            </Text>
            <TouchableOpacity 
              onPress={() => setShowCompareModal(false)}
              className={`p-2 rounded-full ${getBackgroundColor('highlight')}`}
            >
              <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#374151'} />
            </TouchableOpacity>
          </View>

          {compareStats.loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className={`mt-4 ${getTextColor('secondary')}`}>
                Loading comparison...
              </Text>
            </View>
          ) : compareStats.error ? (
            <View className="flex-1 justify-center items-center">
              <Text className={`text-center mb-4 ${getTextColor('secondary')}`}>
                {compareStats.error}
              </Text>
              <TouchableOpacity
                onPress={fetchCompareStats}
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className={`${getBackgroundColor('secondary')} rounded-2xl p-5 mb-4`}>
                <Text className={`text-lg font-bold mb-4 ${getTextColor()}`}>
                  Weekly Overview
                </Text>
                <View className="space-y-4">
                  {Object.entries(compareStats.user || {}).map(([key, value]) => (
                    <View key={key} className={`${getBackgroundColor()} p-4 rounded-xl`}>
                      <Text className={`capitalize mb-2 font-medium ${getTextColor()}`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          <Text className={getTextColor('secondary')}>
                            You: {value}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          <Text className={getTextColor('secondary')}>
                            {profileData?.username}: {compareStats.friend?.[key]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderMenu = () => (
    <Modal
      visible={showMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50"
        onPress={() => setShowMenu(false)}
      >
        <View className={`${getBackgroundColor('secondary')} rounded-xl m-4 absolute right-0 top-16 w-48 shadow-xl`}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity 
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('EditProfile');
                }}
              >
                <Ionicons name="pencil" size={20} color="#374151" />
                <Text className={`${getTextColor('secondary')} ml-3`}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-row items-center p-4"
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Settings');
                }}
              >
                <Ionicons name="settings-outline" size={20} color="#374151" />
                <Text className={`${getTextColor('secondary')} ml-3`}>Settings</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={shareProfile}
              >
                <Ionicons name="share-outline" size={20} color="#374151" />
                <Text className={`${getTextColor('secondary')} ml-3`}>Share Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={() => {
                  setShowMenu(false);
                  setShowCompareModal(true);
                  fetchCompareStats();
                }}
              >
                <Ionicons name="stats-chart-outline" size={20} color="#374151" />
                <Text className={`${getTextColor('secondary')} ml-3`}>Compare Stats</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={() => {
                  setShowMenu(false);
                  handleChatPress();
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#374151" />
                <Text className={`${getTextColor('secondary')} ml-3`}>Send Message</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center p-4">
                <Ionicons name="flag-outline" size={20} color="#EF4444" />
                <Text className="ml-3 text-red-500">Report User</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderBioSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 300 }}
      className={`${getBackgroundColor()} p-6 rounded-3xl shadow-lg mb-6 border ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100'}`}
    >
      <View className="flex-row items-start mb-4">
        <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} p-2 rounded-xl mr-3`}>
          <Ionicons 
            name="document-text-outline" 
            size={20} 
            color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
          />
        </View>
        <View className="flex-1">
          <Text className={`text-lg font-bold mb-1 ${getTextColor()}`}>
            About
          </Text>
          <Text className={`text-base leading-6 ${getTextColor('secondary')}`}>
            {profileData?.profile?.bio || `${profileData?.profile?.username} is a ${profileData?.personal?.gender || 'private'} user with ${profileData?.health?.activityLevel || 'moderate'} activity level.`}
          </Text>
        </View>
      </View>

      <View className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-4`}>
        <View className="flex-row flex-wrap gap-4">
          <View className="flex-row items-center">
            <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-xl`}>
              <Ionicons 
                name="location-outline" 
                size={18} 
                color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
              />
            </View>
            <View className="ml-2">
              <Text className={`text-xs ${getTextColor('muted')}`}>Location</Text>
              <Text className={`font-medium ${getTextColor()}`}>
                {profileData?.location || 'Private'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-xl`}>
              <Ionicons 
                name="calendar-outline" 
                size={18} 
                color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
              />
            </View>
            <View className="ml-2">
              <Text className={`text-xs ${getTextColor('muted')}`}>Joined</Text>
              <Text className={`font-medium ${getTextColor()}`}>
                {formatDate(profileData?.createdAt)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-xl`}>
              <Ionicons 
                name="fitness-outline" 
                size={18} 
                color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
              />
            </View>
            <View className="ml-2">
              <Text className={`text-xs ${getTextColor('muted')}`}>Activity Level</Text>
              <Text className={`font-medium ${getTextColor()}`}>
                {profileData?.activityLevel || 'Moderate'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </MotiView>
  );

  if (isLoadingProfile) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => navigation.goBack()} />;

  const renderActionButtons = () => (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 200 }}
      className="flex-row justify-around items-center px-6 -mt-12 mb-6"
    >
      {!isOwnProfile ? (
        <>
          <TouchableOpacity 
            onPress={friendshipStatus === 'none' ? handleFriendRequest : handleFollowToggle}
            disabled={['pending', 'sent'].includes(friendshipStatus) || isFetchingStatus}
            className={`flex-1 mr-3 py-3.5 rounded-2xl ${
              friendshipStatus === 'friends' 
                ? isFollowing ? 'bg-blue-500' : 'bg-gray-500'
                : friendshipStatus === 'none' 
                ? 'bg-blue-500' 
                : 'bg-gray-200'
            } shadow-lg`}
          >
            <View className="flex-row justify-center items-center">
              {isFetchingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text className={`text-center font-semibold ${
                    ['pending', 'sent'].includes(friendshipStatus) ? 'text-gray-600' : 'text-white'
                  }`}>
                    {friendshipStatus === 'none' ? 'Follow' : 
                     friendshipStatus === 'pending' ? 'Pending' :
                     friendshipStatus === 'sent' ? 'Requested' : 
                     isFollowing ? 'Following' : 'Follow Back'}
                  </Text>
                  {mutualFollow && (
                    <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                      <Text className="text-white text-xs">Mutual</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleChatPress}
            disabled={isFetchingStatus}
            className={`flex-1 ml-3 py-3.5 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl shadow-lg`}
          >
            <Text className={`text-center font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Message
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditProfile')}
          className="flex-1 py-3.5 bg-blue-500 rounded-2xl shadow-lg"
        >
          <Text className="text-center font-semibold text-white">Edit Profile</Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );

  return (
    <SafeAreaView className={`flex-1 ${getBackgroundColor('secondary')}`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className={`pt-4 pb-24 ${getBackgroundColor()}`}>
          <View className="px-4">
            <MotiView 
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex-row justify-between items-center mb-8"
            >
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className={`p-3 rounded-2xl ${getBackgroundColor('highlight')}`}
              >
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#374151'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowMenu(true)}
                className={`p-3 rounded-2xl ${getBackgroundColor('highlight')}`}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? '#fff' : '#374151'} />
              </TouchableOpacity>
            </MotiView>
            
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="items-center"
            >
              <View className="relative mb-4">
                <Image 
                  source={{ uri: profileData?.profile.avatar }} 
                  className="w-32 h-32 rounded-full border-4 border-white/30"
                />
                {profileData?.isOnline && (
                  <View className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white" />
                )}
              </View>

              <View className="items-center mb-6">
                <Text className={`text-2xl font-bold mb-1 ${getTextColor()}`}>
                  {profileData?.profile?.username}
                </Text>
                <Text className={`text-base mb-3 ${getTextColor('muted')}`}>
                  @{profileData?.profile?.uniqueName}
                </Text>
                <View className="flex-row gap-2">
                  <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl px-4 py-1.5`}>
                    <Text className={`${isDarkMode ? 'text-gray-200' : 'text-blue-600'} text-sm font-medium`}>
                      Level {profileData?.progress?.level}
                    </Text>
                  </View>
                  <View className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl px-4 py-1.5`}>
                    <Text className={`${isDarkMode ? 'text-blue-200' : 'text-blue-600'} text-sm font-medium`}>
                      {profileData?.progress?.xp} XP
                    </Text>
                  </View>
                  {profileData?.progress?.streak > 0 && (
                    <View className={`${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'} rounded-xl px-4 py-1.5`}>
                      <Text className={`${isDarkMode ? 'text-amber-200' : 'text-amber-600'} text-sm font-medium`}>
                        {profileData?.progress?.streak} Day Streak 🔥
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="flex-row justify-around w-full px-4">                
                <TouchableOpacity 
                  className="items-center"
                  onPress={() => navigation.navigate('Home/friends/FollowersPage', { 
                    userId: profileData._id, 
                    type: 'followers',
                    viewSource: 'friends'
                  })}
                >
                  <Text className={`text-xl font-bold ${getTextColor()}`}>
                    {profileData?.followers || 0}
                  </Text>
                  <Text className={getTextColor('muted')}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="items-center"
                  onPress={() => navigation.navigate('Home/friends/FollowersPage', { 
                    userId: profileData._id, 
                    type: 'following',
                    viewSource: 'friends'
                  })}
                >
                  <Text className={`text-xl font-bold ${getTextColor()}`}>
                    {profileData?.following || 0}
                  </Text>
                  <Text className={getTextColor('muted')}>Following</Text>
                </TouchableOpacity>
                <View className="items-center">
                  <Text className={`text-xl font-bold ${getTextColor()}`}>
                    {profileData?.Workouts || 0}
                  </Text>
                  <Text className={getTextColor('muted')}>Workouts</Text>
                </View>
              </View>
            </MotiView>
          </View>
        </View>

        {renderActionButtons()}

        {/* Rest of the content */}
        <View className="px-6">
          {renderBioSection()}
          {renderWorkoutStats()}
          {renderPreferredWorkouts()}
          {renderAchievements()}
          {renderRecentActivities()}
        </View>

        <View className="h-6" />
      </ScrollView>

      {renderCompareModal()}
      {renderMenu()}
      <Toast />
    </SafeAreaView>
  );
};

export default FriendProfile;

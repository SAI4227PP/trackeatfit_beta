import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

import { MotiView } from 'moti';

const formatLastActive = (lastActive) => {
  if (!lastActive) return '';
  
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffInMinutes = Math.floor((now - lastActiveDate) / 1000 / 60);
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return lastActiveDate.toLocaleDateString();
};

const FriendSkeleton = ({ isDarkMode }) => {
  return (
    <View className="mb-3">
      <LinearGradient
        colors={['#1f2937', '#111827']}
        className="rounded-xl p-4 shadow-sm"
      >
        <View className="flex-row items-center">
          <MotiView
            from={{ opacity: 0.4 }}
            animate={{ opacity: 0.8 }}
            transition={{ loop: true, duration: 1000 }}
            className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          />
          <View className="flex-1 ml-3">
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 0.8 }}
              transition={{ loop: true, duration: 1000 }}
              className={`w-24 h-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-2`}
            />
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 0.8 }}
              transition={{ loop: true, duration: 1000 }}
              className={`w-16 h-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            />
          </View>
          <View className="flex-row items-center">
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 0.8 }}
              transition={{ loop: true, duration: 1000 }}
              className={`w-16 h-6 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} mr-2`}
            />
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 0.8 }}
              transition={{ loop: true, duration: 1000 }}
              className={`w-6 h-6 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const Friends = () => {
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showWorkoutBuddies, setShowWorkoutBuddies] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [allFriends, setAllFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      if (!user?._id) {
        console.error('No user ID available');
        return;
      }

      // Fetch all data in parallel
      const [friendsRes, requestsRes, sentRes, suggestionsRes] = await Promise.all([
        fetch(`${API_URL}/api/friends/all?userId=${user._id}`),
        fetch(`${API_URL}/api/friends/requests?userId=${user._id}`),
        fetch(`${API_URL}/api/friends/sent-requests?userId=${user._id}`),
        fetch(`${API_URL}/api/friends/suggestions?userId=${user._id}`)
      ]);

      const [friends, requests, sent, suggestions] = await Promise.all([
        friendsRes.json(),
        requestsRes.json(),
        sentRes.json(),
        suggestionsRes.json()
      ]);

      setAllFriends(Array.isArray(friends) ? friends : []);
      setFriendRequests(Array.isArray(requests) ? requests : []);
      setSentRequests(Array.isArray(sent) ? sent : []);
      setSuggestions(Array.isArray(suggestions) ? suggestions : []);
    } catch (error) {
      console.error('Error fetching all data:', error);
      Toast.show({
        type: 'error',
        text2: 'Unable to load friend data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, [user?._id]);

  useEffect(() => {
    fetchAllData();
  }, [user?._id]);

  const fetchFriendRequests = async () => {
    setRefreshing(true);
    try {
      if (!user?._id) {
        console.error('No user ID available');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/requests?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Friend requests data:', data);

      setFriendRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      Toast.show({
        type: 'error',
        text2: 'Unable to load friend requests'
      });
      setFriendRequests([]);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSentRequests = async () => {
    setRefreshing(true);
    try {
      if (!user?._id) {
        console.error('No user ID available');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/sent-requests?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sent requests data:', data);

      setSentRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      Toast.show({
        type: 'error',
        text2: 'Unable to load sent requests'
      });
      setSentRequests([]);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAllFriends = async () => {
    setRefreshing(true);
    try {
      if (!user?._id) {
        console.error('No user ID available');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/all?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('All friends data:', data);
      setAllFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      Toast.show({
        type: 'error',
        text2: 'Unable to load friends'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSuggestions = async () => {
    setRefreshing(true);
    try {
      if (!user?._id) {
        console.error('No user ID available');
        return;
      }

      const response = await fetch(`${API_URL}/api/friends/suggestions?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Suggestions data:', data);
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Toast.show({
        type: 'error',
        text2: 'Unable to load suggestions'
      });
      setSuggestions([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMenuPress = (friend, event) => {
    event.stopPropagation(); // Prevent triggering the parent TouchableOpacity
    setSelectedFriend(friend);
    setShowActions(true);
  };
  const handleFriendPress = (friend) => {
    const otherUser = friend.user?._id === user._id ? friend.friend : friend.user;
    const friendData = {
      _id: otherUser._id,
      username: otherUser.profile?.username,
      avatar: otherUser.profile?.avatar,
      isOnline: false, // Since this isn't in the API response, defaulting to false
      lastActive: friend.lastInteraction
    };
    
    console.log('Navigating to chat with friend data:', friendData);
    
    navigation.navigate('Home/friends/Chat', { 
      friend: encodeURIComponent(JSON.stringify(friend)),
      friendData: encodeURIComponent(JSON.stringify(friendData))
    });
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'accepted',
          userId: user._id 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to accept request');
      }

      // Update local state
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      fetchAllFriends(); // Refresh friends list
      Toast.show({
        type: 'success',
        text2: 'Friend request accepted'
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to accept request'
      });
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'declined',
          userId: user._id 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to decline request');
      }

      // Update local state
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      Toast.show({
        type: 'success',
        text2: 'Friend request declined'
      });
    } catch (error) {
      console.error('Error declining friend request:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to decline request'
      });
    }
  };

  const handleUnfriend = async (friend) => {
    try {
      const otherUser = friend.user?._id === user._id ? friend.friend : friend.user;
      const response = await fetch(`${API_URL}/api/friends/${otherUser._id}?userId=${user._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unfriend');
      }

      setAllFriends(prev => prev.filter(f => f._id !== friend._id));
      setShowActions(false);
      Toast.show({
        type: 'success',
        text2: 'Friend removed successfully'
      });
    } catch (error) {
      console.error('Error unfriending:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to remove friend'
      });
    }
  };

  const handleAddSuggestion = async (friendId) => {
    try {
      const requestData = {
        senderId: user?._id
      };

      const response = await fetch(`${API_URL}/api/friends/request/${friendId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send friend request');
      }

      // Remove the suggested friend from the list
      setSuggestions(prev => prev.filter(s => s._id !== friendId));
      
      Toast.show({
        type: 'success',
        text2: 'Friend request sent'
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to send request'
      });
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/cancel-request/${requestId}?userId=${user._id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel request');
      }

      // Update local state by removing the cancelled request
      setSentRequests(prev => prev.filter(req => req._id !== requestId));
      Toast.show({
        type: 'success',
        text2: 'Request cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to cancel request'
      });
    }
  };

  const renderQuickActions = (friend) => (
    <Modal
      visible={showActions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowActions(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50"
        onPress={() => setShowActions(false)}
      >
        <View className={`rounded-t-2xl absolute bottom-0 w-full p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row items-center p-3">
            <Ionicons name="fitness" size={24} color="#3B82F6" />
            <Text className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Invite to Workout</Text>
          </View>
          <TouchableOpacity 
            className="flex-row items-center p-3"
            onPress={() => {
              setShowActions(false);
              navigation.navigate('Chat', { friend: selectedFriend });
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#3B82F6" />
            <Text className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-row items-center p-3"
            onPress={() => handleUnfriend(selectedFriend)}
          >
            <Ionicons name="person-remove" size={24} color="#EF4444" />
            <Text className="ml-3 text-red-500">Unfriend</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderWorkoutBuddiesModal = () => (
    <Modal
      visible={showWorkoutBuddies}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowWorkoutBuddies(false)}
    >
      <View className="flex-1 bg-black/50">
        <View className={`rounded-t-2xl absolute bottom-0 w-full h-3/4 p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Workout Buddies</Text>
            <TouchableOpacity onPress={() => setShowWorkoutBuddies(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {allFriends.filter(f => f.workoutBuddy).map(buddy => (
              <View key={buddy.id} className={`rounded-xl p-4 mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <View className="flex-row items-center">
                  <Image source={{ uri: buddy.avatar }} className="w-12 h-12 rounded-full" />
                  <View className="ml-3 flex-1">
                    <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{buddy.name}</Text>
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last workout: {buddy.lastWorkout}</Text>
                  </View>
                  <TouchableOpacity className="bg-blue-500 rounded-full px-4 py-2">
                    <Text className="text-white">Plan Workout</Text>
                  </TouchableOpacity>
                </View>
                <View className="mt-3">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Preferred workouts:</Text>
                  <View className="flex-row mt-1">
                    {buddy.preferredWorkouts.map(workout => (
                      <View key={workout} className="bg-blue-100 rounded-full px-3 py-1 mr-2">
                        <Text className="text-blue-600 text-xs">{workout}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderActivitiesModal = () => (
    <Modal
      visible={showActivities}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowActivities(false)}
    >
      <View className="flex-1 bg-black/50">
        <View className={`rounded-t-2xl absolute bottom-0 w-full h-3/4 p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shared Activities</Text>
            <TouchableOpacity onPress={() => setShowActivities(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {allFriends
              .filter(friend => friend.recentActivities && friend.recentActivities.length > 0)
              .flatMap(friend => 
                friend.recentActivities.map(activity => ({
                  ...activity,
                  friend
                }))
              )
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((activity, index) => (
                <View key={index} className={`rounded-xl p-4 mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <View className="flex-row items-center">
                    <Image source={{ uri: activity.friend.avatar }} className="w-10 h-10 rounded-full" />
                    <View className="ml-3 flex-1">
                      <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.friend.name}</Text>
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={activity.type === 'run' ? 'walk' : 'fitness'} 
                          size={16} 
                          color="#3B82F6" 
                        />
                        <Text className={`text-sm ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.duration} • {new Date(activity.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const getActivitiesCount = () => {
    return allFriends.reduce((sum, friend) => 
      sum + ((friend.recentActivities && friend.recentActivities.length) || 0), 
      0
    );
  };

  const renderStats = () => (
    <View className="flex-row justify-between mb-6">
      <View className={`items-center rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Text className="text-2xl font-bold text-blue-500">{allFriends.length}</Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Friends</Text>
      </View>
      <TouchableOpacity 
        className={`items-center rounded-xl p-3 flex-1 mx-2 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        onPress={() => setShowWorkoutBuddies(true)}
      >
        <Text className="text-2xl font-bold text-green-500">
          {allFriends.filter(f => f.workoutBuddy).length}
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Workout Buddies</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        className={`items-center rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        onPress={() => setShowActivities(true)}
      >
        <Text className="text-2xl font-bold text-purple-500">
          {getActivitiesCount()}
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Activities</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        className="flex-1"
      >
        {/* Header */}
        <View className={`px-4 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
            </TouchableOpacity>
            <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Friends</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home/friends/FriendSearch')}>
              <Ionicons name="person-add-outline" size={24} color={isDarkMode ? '#e5e7eb' : '#374151'} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View className={`flex-row items-center rounded-full px-4 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Ionicons name="search" size={20} color={isDarkMode ? '#9ca3af' : '#9CA3AF'} />
            <TextInput
              placeholder="Search friends..."
              className={`flex-1 ml-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#9CA3AF'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tabs with Badges */}
        <View className={`flex-row px-1 py-2 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {['friends', 'requests', 'requested'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`mr-2 px-3 py-2 rounded-full flex-row items-center ${
                activeTab === tab 
                  ? 'bg-blue-500' 
                  : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`font-medium capitalize text-sm ${
                  activeTab === tab || isDarkMode ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab}
              </Text>
              <View className={`ml-1 px-2 py-0.5 rounded-full ${
                activeTab === tab 
                  ? 'bg-blue-400' 
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <Text className={`text-xs ${
                  activeTab === tab || isDarkMode ? 'text-white' : 'text-gray-600'
                }`}>
                  {tab === 'friends' ? allFriends.length : 
                   tab === 'requests' ? friendRequests.length : 
                   sentRequests.length}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="p-4">
            {isLoading ? (
              // Skeleton loading state
              <>
                <View className="flex-row justify-between mb-6">
                  {[1, 2, 3].map((_, index) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0.4 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ loop: true, duration: 1000 }}
                      className={`items-center rounded-xl p-3 flex-1 ${
                        index === 0 ? 'mr-2' : index === 1 ? 'mx-2' : 'ml-2'
                      } bg-gray-800`}
                    >
                      <View className="w-8 h-6 bg-gray-700 rounded mb-1" />
                      <View className="w-16 h-3 bg-gray-700 rounded" />
                    </MotiView>
                  ))}
                </View>
                {[1, 2, 3, 4].map((_, index) => (
                  <FriendSkeleton key={index} isDarkMode={isDarkMode} />
                ))}
              </>
            ) : (
              // Existing content
              activeTab === 'friends' ? (
                <View>
                  {/* Friend Stats */}
                  {renderStats()}

                  {/* Friend List */}
                  <Text className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Your fitness friends ({allFriends.length})
                  </Text>
                  {allFriends                      .filter(friend => {
                      const otherUser = friend.user?._id === user._id ? friend.friend : friend.user;
                      return otherUser?.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase() || '');
                    })                    .map((friend) => {
                      // Update friend rendering
                      const otherUser = friend.user?._id === user._id ? friend.friend : friend.user;
                      return (
                        <TouchableOpacity
                          key={friend._id}
                          className="mb-3"
                          onPress={() => handleFriendPress(friend)}
                        >
                          <LinearGradient
                            colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
                            className="rounded-xl p-4 shadow-sm border border-gray-100"
                          >
                            <View className="flex-row items-center">
                              <View className="relative">
                                <TouchableOpacity onPress={() => navigation.navigate('Home/friends/FriendProfile', { 
                                  friendId: otherUser?._id
                                })}>
                                  <Image
                                    source={{ uri: otherUser?.profile?.avatar }}
                                    className="w-12 h-12 rounded-full"
                                  />
                                  {/* Online status indicator can be added back if you add isOnline in the API */}
                                </TouchableOpacity>
                              </View>
                              <View className="flex-1 ml-3">
                                <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {otherUser?.profile?.username}
                                </Text>
                                <View className="flex-row items-center">
                                  <View className={`w-2 h-2 rounded-full mr-2 bg-gray-300`} />
                                  <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {'@' + otherUser?.profile?.uniqueName}
                                  </Text>
                                </View>
                              </View>
                              <View className="flex-row items-center">
                                <View className="bg-amber-100 rounded-full px-2 py-1 mr-2">
                                  <Text className="text-amber-600 text-xs">
                                    Level {otherUser?.progress?.level}
                                  </Text>
                                </View>
                                <TouchableOpacity onPress={(e) => handleMenuPress(friend, e)}>
                                  <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}

                  {/* Suggestions Section */}
                  <View className="mt-6">
                    <Text className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Suggested Friends</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {suggestions.map(suggestion => (
                        <View key={suggestion._id} className="mr-4 items-center">
                          <TouchableOpacity 
                            onPress={() => navigation.navigate('Home/friends/FriendProfile', { 
                              friendId: suggestion._id 
                            })}
                          >
                            <Image
                              source={{ uri: suggestion.profile.avatar }}
                              className="w-16 h-16 rounded-full"
                            />
                          </TouchableOpacity>
                          <Text className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{suggestion.profile.username}</Text>
                          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{suggestion.profile.uniqueName}</Text>
                          <TouchableOpacity 
                            className="bg-blue-500 rounded-full px-4 py-1 mt-2"
                            onPress={() => handleAddSuggestion(suggestion._id)}
                          >
                            <Text className="text-white text-sm">Add</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ) : activeTab === 'requests' ? (
                <View>
                  <Text className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Friend Requests ({friendRequests.length})</Text>
                  {friendRequests.map((request) => (
                    <View
                      key={request._id}
                      className={`rounded-xl p-4 mb-3 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    >
                      <View className="flex-row items-center">
                        <TouchableOpacity 
                          onPress={() => navigation.navigate('Home/friends/FriendProfile', { 
                            friendId: request.user?._id 
                          })}
                        >
                          <Image
                            source={{ uri: request.user?.profile?.avatar || 'https://via.placeholder.com/100' }}
                            className="w-12 h-12 rounded-full"
                          />
                        </TouchableOpacity>
                        <View className="flex-1 ml-3">
                          <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{request.user?.profile?.username || 'User'}</Text>
                          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{request.user?.profile?.uniqueName || 'user'}</Text>
                        </View>
                        <View className="flex-row">
                          <TouchableOpacity 
                            className="bg-blue-500 rounded-full px-4 py-2 mr-2"
                            onPress={() => handleAcceptRequest(request._id)}
                          >
                            <Text className="text-white font-medium">Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className={`rounded-full px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                            onPress={() => handleDeclineRequest(request._id)}
                          >
                            <Text className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                  {friendRequests.length === 0 && (
                    <View className="items-center py-8">
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No friend requests</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  <Text className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sent Requests ({sentRequests.length})</Text>
                  {sentRequests.map((request) => (
                    <View
                      key={request._id}
                      className={`rounded-xl p-4 mb-3 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    >
                      <View className="flex-row items-center">
                        <TouchableOpacity 
                          onPress={() => navigation.navigate('Home/friends/FriendProfile', { 
                            friendId: request.friend?._id 
                          })}
                        >
                          <Image
                            source={{ uri: request.friend?.profile?.avatar || 'https://via.placeholder.com/100' }}
                            className="w-12 h-12 rounded-full"
                          />
                        </TouchableOpacity>
                        <View className="flex-1 ml-3">
                          <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{request.friend?.profile?.username || 'User'}</Text>
                          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{request.friend?.profile?.uniqueName || 'user'}</Text>
                        </View>
                        <TouchableOpacity 
                          className={`rounded-full px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                          onPress={() => handleCancelRequest(request._id)}
                        >
                          <Text className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  {sentRequests.length === 0 && (
                    <View className="items-center py-8">
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No pending requests</Text>
                    </View>
                  )}
                </View>
              )
            )}
          </View>
        </ScrollView>
      </LinearGradient>
      {renderQuickActions(selectedFriend)}
      {renderWorkoutBuddiesModal()}
      {renderActivitiesModal()}
    </SafeAreaView>
  );
};

export default Friends;

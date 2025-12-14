import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

/**
 * FollowersPage Component
 * 
 * This component displays followers/following for both friends and community users
 * based on the viewSource parameter.
 * 
 * How to navigate to this page:
 * - From friends section: 
 *   navigation.navigate('Home/friends/FollowersPage', { userId: someId, type: 'followers', viewSource: 'friends' })
 * - From community section: 
 *   navigation.navigate('Home/friends/FollowersPage', { userId: someId, type: 'following', viewSource: 'community' })
 */
const FollowersPage = () => {
  const navigation = useNavigation();  
  const route = useRoute();
  const { isDarkMode } = useTheme();
  const { userId, type, viewSource } = route.params; // type can be 'followers' or 'following', viewSource determines if it's 'friends' or 'community'
  
  const [activeTab, setActiveTab] = useState(type);
  const [viewMode] = useState(viewSource || 'friends')
  
  // Friends data
  const [friendFollowers, setFriendFollowers] = useState([]);
  const [friendFollowing, setFriendFollowing] = useState([]);
  const [friendMutual, setFriendMutual] = useState([]);
  
  // Community data
  const [communityFollowers, setCommunityFollowers] = useState([]);
  const [communityFollowing, setCommunityFollowing] = useState([]);
  const [communityMutual, setCommunityMutual] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (viewMode === 'friends') {
      fetchFriendsData();
    } else {
      fetchCommunityData();
    }
  }, [userId, viewMode]);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/friends/follow-data/${userId}`);
      const data = await response.json();
      setFriendFollowers(data.followers);
      setFriendFollowing(data.following);
      setFriendMutual(data.mutual);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friends data:', error);
      setLoading(false);
    }
  };
  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      // Using the new combined API endpoint for followers, following, and mutual data
      const response = await fetch(`${API_URL}/api/following/follow-data/${userId}`);

      if (response.ok) {
        const data = await response.json();
        
        // Set community data directly from the API response
        setCommunityFollowers(data.followers || []);
        setCommunityFollowing(data.following || []);
        setCommunityMutual(data.mutual || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching community data:', error);
      setLoading(false);
    }
  };  const renderUser = useCallback(({ item }) => {
    return (
    <TouchableOpacity 
      className={`flex-row items-center p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
      onPress={() => {
        // Navigate to the appropriate profile page based on view mode
        if (viewMode === 'friends') {
          navigation.push('Home/friends/FriendProfile', { friendId: item._id });
        } else {
          // For community navigation, use navigate instead of push and ensure the correct path
          navigation.navigate('posts/UserProfile/[uniqueName]', { 
            uniqueName: item.profile?.uniqueName || item.uniqueName || 'user'
          });
        }
      }}
    >
      <Image 
        source={{ 
          uri: item.profile?.avatar || item.avatar || item.profilepic || 'https://example.com/default-avatar.png'
        }} 
        className="w-12 h-12 rounded-full"
      />
      <View className="flex-1 ml-4">
        <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {item.profile?.username || item.username || item.profilename || 'User'}
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          @{item.profile?.uniqueName || item.uniqueName || 'user'}
        </Text>
      </View>
      {(activeTab === 'mutual' || item.isMutual === true || item.mutualFollow === true) && (
        <View className="bg-blue-100 px-2 py-1 rounded-full">
          <Text className="text-xs text-blue-600">Mutual</Text>
        </View>
      )}
    </TouchableOpacity>
    );
  }, [navigation, viewMode, isDarkMode, activeTab]);

  const TabButton = ({ title, count, isActive }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(title.toLowerCase())}
      className={`flex-1 py-3 ${isActive ? 'border-b-2 border-blue-500' : ''}`}
    >
      <Text className={`text-center font-semibold ${
        isActive ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {`${title} (${count})`}
      </Text>
    </TouchableOpacity>
  );
  // TabButton component defined above

  // Get the current data based on active view mode
  const currentFollowers = viewMode === 'friends' ? friendFollowers : communityFollowers;
  const currentFollowing = viewMode === 'friends' ? friendFollowing : communityFollowing;
  const currentMutual = viewMode === 'friends' ? friendMutual : communityMutual;
  
  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <View className={`flex-row items-center p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? '#fff' : '#374151'} 
          />
        </TouchableOpacity>        
        <Text className={`text-xl font-bold ml-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {viewMode === 'community' ? 'Community ' : 'Friends '}
          {activeTab === 'followers' ? 'Followers' : 
           activeTab === 'following' ? 'Following' : 'Mutual'}
        </Text>
        </View>

      {/* Tab Selection */}
      <View className={`flex-row border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <TabButton 
          title="Mutual" 
          count={currentMutual?.length || 0} 
          isActive={activeTab === 'mutual'} 
        />
        <TabButton 
          title="Followers" 
          count={currentFollowers?.length || 0} 
          isActive={activeTab === 'followers'} 
        />
        <TabButton 
          title="Following" 
          count={currentFollowing?.length || 0} 
          isActive={activeTab === 'following'} 
        />
      </View>

      <FlatList
        data={activeTab === 'followers' ? currentFollowers : 
              activeTab === 'following' ? currentFollowing : currentMutual}
        renderItem={renderUser}
        keyExtractor={item => item._id || item.id || Math.random().toString()}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            {loading ? (
              <View className="items-center">
                <ActivityIndicator size="large" color={isDarkMode ? "#4B5563" : "#9CA3AF"} />
                <Text className={`mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading...
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <Ionicons 
                  name={activeTab === 'mutual' ? 'people' : 'person'} 
                  size={32} 
                  color={isDarkMode ? '#4B5563' : '#9CA3AF'} 
                  style={{ marginBottom: 12 }}
                />
                <Text className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activeTab === 'mutual' ? 'No mutual connections yet' :
                   activeTab === 'followers' ? 'No followers yet' :
                   'Not following anyone yet'}
                </Text>
                <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {viewMode === 'community' ? 'Try connecting with more users in the community!' : 
                   'Add more friends to see them here.'}
                </Text>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default FollowersPage;

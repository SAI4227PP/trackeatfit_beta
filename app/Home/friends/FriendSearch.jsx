import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableWithoutFeedback, Keyboard, Platform, TouchableOpacity, Image, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '../../../context/ThemeContext'

const API_URL = "https://trackeatfit.onrender.com";

const FriendSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/UserSearch/search?query=${searchQuery}&page=${page}`
      );
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) searchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, page]);

  const suggestedFriends = [
    {
      id: 1,
      name: 'David Smith',
      username: '@davidsmith',
      mutualFriends: '5 mutual friends',
      image: 'https://randomuser.me/api/portraits/men/4.jpg'
    },
    {
      id: 2,
      name: 'Rachel Green',
      username: '@rachelgreen',
      mutualFriends: '3 mutual friends',
      image: 'https://randomuser.me/api/portraits/women/4.jpg'
    },
    {
      id: 3,
      name: 'Tom Wilson',
      username: '@tomwilson',
      mutualFriends: '8 mutual friends',
      image: 'https://randomuser.me/api/portraits/men/5.jpg'
    },
    {
      id: 4,
      name: 'Amy Cooper',
      username: '@amycooper',
      mutualFriends: '2 mutual friends',
      image: 'https://randomuser.me/api/portraits/women/5.jpg'
    }
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={{ paddingBottom: Platform.OS === 'ios' ? 0 : 70 }}>
          <View className="px-4 pt-2">
            <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-2xl font-semibold mb-3 ml-1`}>Find Friends</Text>
            <View className={`flex-row items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg px-4 py-2.5`}>
              <Ionicons name="search" size={20} color={isDarkMode ? '#9CA3AF' : '#71767B'} />
              <TextInput
                className={`flex-1 ml-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
                placeholder="Search for friends"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#71767B'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                enablesReturnKeyAutomatically
              />
            </View>

            {/* Search Results */}
            {isLoading ? (
              <View className="mt-4 items-center">
                <ActivityIndicator size="large" color="#0284c7" />
              </View>
            ) : searchQuery ? (
              <View className="mt-4">
                <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-lg font-semibold mb-4`}>Search Results</Text>
                {searchResults.length > 0 ? (
                  searchResults.map((user, index) => (
                    <View key={user._id || index}>
                      <TouchableOpacity 
                        className="flex-row items-center justify-between pr-2"
                        onPress={() => {
                          const friendData = {
                            pathname: 'Home/friends/FriendProfile',
                            params: {
                              friendId: user._id
                            }
                          };
                          console.log('Navigating to FriendProfile with ID:', user._id);
                          router.push(friendData);
                        }}
                      >
                        <View className="flex-row flex-1">
                          <View className="justify-start pt-1">
                            <Image
                              source={{ uri: user.profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                              className="w-10 h-10 rounded-full"
                            />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className={`${isDarkMode ? 'text-white' : 'text-black'} font-semibold`}>
                              {user.profile?.username}
                            </Text>
                            <Text className="text-gray-500">@{user.profile?.uniqueName}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          className={`border border-primary ${isDarkMode ? 'bg-white' : 'bg-black'} px-5 py-1.5 rounded-full ml-4`}
                          onPress={(e) => {
                            e.stopPropagation();
                            // Add friend logic here
                          }}
                        >
                          <Text className={`${isDarkMode ? 'text-black' : 'text-white'} font-semibold text-sm`}>Add</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {index < searchResults.length - 1 && (
                        <View className="ml-[53px] mr-2 my-2.5">
                          <View className={`h-[0.5px] ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'}`} />
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-500 text-center mt-4">No users found</Text>
                )}
              </View>
            ) : (
              <View className="mt-6">
                <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-lg font-semibold mb-4`}>Suggested Friends</Text>
                {suggestedFriends.map((friend, index) => (
                  <View key={friend.id}>
                    <TouchableOpacity 
                      className="flex-row items-center justify-between pr-2"
                      onPress={() => router.push({
                        pathname: 'Home/friends/FriendProfile',
                        params: {
                          friendId: friend._id
                        }
                      })}
                    >
                      <View className="flex-row flex-1">
                        <View className="justify-start pt-1">
                          <Image
                            source={{ uri: friend.image }}
                            className="w-10 h-10 rounded-full"
                          />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className={`${isDarkMode ? 'text-white' : 'text-black'} font-semibold`}>{friend.name}</Text>
                          <Text className="text-gray-500">{friend.username}</Text>
                          <Text className="text-gray-500 text-sm">{friend.mutualFriends}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        className={`border border-primary ${isDarkMode ? 'bg-white' : 'bg-black'} px-5 py-1.5 rounded-full ml-4`}
                        onPress={(e) => {
                          e.stopPropagation();
                          console.log('Add Friend', friend.id);
                        }}
                      >
                        <Text className={`${isDarkMode ? 'text-black' : 'text-white'} font-semibold text-sm`}>Add</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {index < suggestedFriends.length - 1 && (
                      <View className="ml-[53px] mr-2 my-2.5">
                        <View className={`h-[0.5px] ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'}`} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default FriendSearch;

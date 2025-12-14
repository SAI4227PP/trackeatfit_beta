import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import io from 'socket.io-client';
import { useTheme } from '../../../context/ThemeContext';
import { registerFCMToken } from '../../../services/notificationService';

const API_URL = "https://trackeatfit.onrender.com";

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const params = useLocalSearchParams();
  const { user, getAuthToken } = useGlobalContext(); // Add getAuthToken here
  const { isDarkMode } = useTheme();
  
  // Safe parsing of friend data
  let friendData = null;
  let friend = null;
  
  try {
    friendData = JSON.parse(decodeURIComponent(params.friendData));
    friend = JSON.parse(decodeURIComponent(params.friend));
  } catch (error) {
    console.error('Error parsing friend data:', error);
    friendData = params.friendData;
    friend = params.friend;
  }
  
  console.log('Chat component received raw data:', params);
  console.log('Chat component parsed friend data:', friendData);
  
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const scrollViewRef = useRef();
  const socketRef = useRef();
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef();  useEffect(() => {
    const initializeChat = async () => {
      // Initialize socket connection
      socketRef.current = io(`${API_URL}`);

      // Register FCM token using centralized service
      try {
        await registerFCMToken();
      } catch (error) {
        console.error('Error registering notification token:', error);
      }
    };

    initializeChat();

    // Listen for typing events
    socketRef.current.on('typing_start', ({ userId }) => {
      if (userId !== user._id) {
        setOtherUserTyping(true);
      }
    });

    socketRef.current.on('typing_end', ({ userId }) => {
      if (userId !== user._id) {
        setOtherUserTyping(false);
      }
    });

    // Listen for message status updates
    socketRef.current.on('message_status', ({ chatId, messageId, status }) => {
      if (chatId === chat?._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, status } : msg
        ));
      }
    });

    socketRef.current.on('messages_read', ({ chatId, userId }) => {
      if (chatId === chat?._id && userId !== user._id) {
        setMessages(prev => prev.map(msg => 
          msg.sender === user._id ? { ...msg, status: 'read' } : msg
        ));
      }
    });

    // Clean up socket connection
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      socketRef.current.off('typing_start');
      socketRef.current.off('typing_end');
      socketRef.current.off('message_status');
      socketRef.current.off('messages_read');
    };
  }, []);

  useEffect(() => {
    const startChat = async () => {
      try {
        const token = await getAuthToken(); // Use getAuthToken instead of user.getAuthToken
        if (!token) throw new Error('No auth token available');

        const response = await fetch(`${API_URL}/api/chats/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ otherUserId: friendData?._id })
        });

        if (!response.ok) throw new Error('Failed to start chat');

        const chatData = await response.json();
        setChat(chatData);
        setMessages(chatData.messages || []);

        // Join socket room
        socketRef.current.emit('join_chat', chatData._id);

        // Listen for new messages
        socketRef.current.on('new_message', (data) => {
          if (data.chatId === chatData._id) {
            setMessages(prev => [...prev, data.message]);
          }
        });

        // Mark messages as read
        if (chatData._id) {
          await fetch(`${API_URL}/api/chats/${chatData._id}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Error starting chat:', error);
      } finally {
        setLoading(false);
      }
    };

    if (friendData?._id && user) {
      startChat();
    }

    return () => {
      if (chat?._id) {
        socketRef.current.emit('leave_chat', chat._id);
      }
    };
  }, [friendData?._id, user]);

  const sendMessage = async () => {
    if (!message.trim() || !chat?._id) return;

    try {
      const token = await getAuthToken(); // Use getAuthToken here too
      if (!token) throw new Error('No auth token available');

      const response = await fetch(`${API_URL}/api/chats/${chat._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: message.trim() })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing_start', { chatId: chat._id, userId: user._id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing_end', { chatId: chat._id, userId: user._id });
    }, 1000);
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex-row items-center justify-between shadow-sm`}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity 
            onPress={() => {
              console.log('Leaving chat with friend:', friendData?.username);
              navigation.goBack();
            }} 
            className="p-2 -ml-2 rounded-full"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#E5E7EB" : "#374151"} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Home/friends/FriendProfile', { 
              friendId: friendData?._id 
            })}
            className="flex-row items-center ml-2 flex-1"
          >
            <View className="relative">
              <Image
                source={{ uri: friendData?.avatar || 'https://example.com/default-avatar.png' }}
                className="w-10 h-10 rounded-full"
              />
              <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                friendData?.isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </View>
            <View className="ml-3 flex-1">
              <Text className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} text-base`}>
                {friendData?.username || 'User'}
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {friendData?.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity className="p-2 rounded-full">
            <Ionicons name="videocam" size={24} color={isDarkMode ? "#E5E7EB" : "#374151"} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded-full ml-1">
            <Ionicons name="call" size={22} color={isDarkMode ? "#E5E7EB" : "#374151"} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded-full ml-1">
            <Ionicons name="ellipsis-vertical" size={22} color={isDarkMode ? "#E5E7EB" : "#374151"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => {
          const isOwnMessage = msg.sender === user._id;
          return (
            <View
              key={index}
              className={`my-1 flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <View
                className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                  isOwnMessage 
                    ? 'bg-blue-500' 
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                <Text className={isOwnMessage ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'}>
                  {msg.content}
                </Text>
                <View className="flex-row items-center justify-end mt-1">
                  <Text
                    className={`text-xs ${
                      isOwnMessage 
                        ? 'text-blue-100' 
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </Text>
                  {isOwnMessage && (
                    <View className="ml-2">
                      {msg.status === 'sent' && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                      {msg.status === 'delivered' && (
                        <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                      )}
                      {msg.status === 'read' && (
                        <Ionicons name="checkmark-done" size={16} color="#A7F3D0" />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        {otherUserTyping && (
          <View className="my-1 flex-row justify-start">
            <View className={`rounded-2xl px-4 py-2 max-w-[80%] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <View className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
        <View className={`flex-row items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2`}>
          <TextInput
            className={isDarkMode ? 'flex-1 text-gray-100' : 'flex-1 text-gray-900'}
            placeholder="Type a message..."
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              handleTyping();
            }}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!message.trim()}
            className={`ml-2 ${!message.trim() ? 'opacity-50' : ''}`}
          >
            <Ionicons name="send" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Chat;

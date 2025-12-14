import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Animated as AnimatedRN, Clipboard, Dimensions, Image, Modal, RefreshControl, ScrollView, Share, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import ViewShot from 'react-native-view-shot';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';
import analyticsService from '../../../utils/firebaseAnalytics';
import { CommunitySSEClient } from '../../../utils/sseClient';

const API_URL = "https://trackeatfit.onrender.com";


// Add Skeleton component
const PostSkeleton = () => {
  const { isDarkMode } = useTheme();
  const fadeAnim = new Animated.Value(0.3);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb', // border-gray-700 or border-gray-200
      backgroundColor: isDarkMode ? '#111827' : '#fff', // bg-gray-900 or bg-white
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Animated.View 
          style={{
            width: 40,
            height: 40,
            borderWidth: 1,
            borderColor: '#22C55E', // border-cugreen
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            marginRight: 12,
            opacity: fadeAnim
          }}
        >
          <ExpoImage
            source={{ uri: 'https://example.com/default-avatar.png' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Animated.View>

        <View style={{ flex: 1 }}>
          <Animated.View 
            style={{
              width: '60%',
              height: 16,
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              borderRadius: 8,
              marginBottom: 8,
              opacity: fadeAnim
            }}
          />
          <Animated.View 
            style={{
              width: '40%',
              height: 12,
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              borderRadius: 8,
              marginBottom: 12,
              opacity: fadeAnim
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Animated.View 
              style={{
                width: 80,
                height: 12,
                backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                borderRadius: 8,
                marginRight: 8,
                opacity: fadeAnim
              }}
            />
            <Animated.View 
              style={{
                width: 80,
                height: 12,
                backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                borderRadius: 8,
                opacity: fadeAnim
              }}
            />
          </View>
        </View>
      </View>
      <Animated.View 
        style={{
          marginTop: 12,
          width: '100%',
          height: 160,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          borderRadius: 12,
          opacity: fadeAnim
        }}
      />
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Animated.View 
          style={{
            width: 64,
            height: 12,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 8,
            marginRight: 8,
            opacity: fadeAnim
          }}
        />
        <Animated.View 
          style={{
            width: 64,
            height: 12,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 8,
            opacity: fadeAnim
          }}
        />
      </View>
    </View>
  );
}

const ProfileHeaderSkeleton = () => {
  const { isDarkMode } = useTheme();
  const fadeAnim = new Animated.Value(0.3);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      backgroundColor: isDarkMode ? '#111827' : '#fff',
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Animated.View style={{
            width: 160,
            height: 32,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 16,
            marginBottom: 8,
            opacity: fadeAnim
          }} />
          <Animated.View style={{
            width: 96,
            height: 24,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 12,
            marginBottom: 12,
            opacity: fadeAnim
          }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Animated.View style={{
              width: 80,
              height: 24,
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              borderRadius: 12,
              marginRight: 8,
              opacity: fadeAnim
            }} />
            <Animated.View style={{
              width: 80,
              height: 24,
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              borderRadius: 12,
              opacity: fadeAnim
            }} />
          </View>
        </View>
        <Animated.View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          opacity: fadeAnim
        }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Animated.View style={{
          flex: 1,
          height: 40,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          borderRadius: 20,
          opacity: fadeAnim
        }} />
        <Animated.View style={{
          flex: 1,
          height: 40,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          borderRadius: 20,
          opacity: fadeAnim
        }} />
      </View>
      <View style={{
        flexDirection: 'row',
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
        paddingTop: 16
      }}>
        <Animated.View style={{
          flex: 1,
          height: 40,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          borderRadius: 12,
          marginRight: 8,
          opacity: fadeAnim
        }} />
        <Animated.View style={{
          flex: 1,
          height: 40,
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          borderRadius: 12,
          opacity: fadeAnim
        }} />
      </View>
    </View>
  );
};

const ProfileHeader = memo(({ user, activeTab, setActiveTab, navigation, followerData }) => {
  const { isDarkMode } = useTheme();
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const qrSvgRef = useRef();
  const viewShotRef = useRef();
  
  // Safely access follower counts with default values
  const followingCount = followerData?.following ?? 0;
  const followersCount = followerData?.followers ?? 0;

  // QR Code Content - profile info in JSON format with uniqueName for navigation
  const qrCodeData = `https://trackeatfit.xyz/posts/UserProfile/${user?.uniqueName || user?.username || 'guest'}`;

  // Function to share QR code with UI context
  const shareQRCode = async () => {
    try {
      // Check if viewshot reference is available
      if (viewShotRef.current) {
        // Capture the whole styled QR code container as an image
        const uri = await viewShotRef.current.capture();
        
        // Check if sharing is available on the device
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Your Profile QR Code',
          });
        } else {
          Alert.alert('Sharing not available');
        }
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  // Save QR code to device with UI context
  const saveQRCode = async () => {
    try {
      if (viewShotRef.current) {
        // Get permission to access the media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Need permission to save QR code');
          return;
        }
        
        // Capture the whole styled QR code container
        const uri = await viewShotRef.current.capture();
        
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('TrackEatFit', asset, false);
        
        Alert.alert('Success', 'QR Code saved to gallery');
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

  return (
    <View style={{
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      backgroundColor: isDarkMode ? '#111827' : '#fff',
    }}>
      {/* User Info Section */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDarkMode ? '#fff' : '#000',
            marginBottom: 4,
          }}>
            {user?.username || 'Guest'}
          </Text>
          <Text style={{
            fontSize: 16,
            color: isDarkMode ? '#9CA3AF' : '#4B5563',
            marginBottom: 8,
          }}>
            @{user?.uniqueName || 'guest'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
              onPress={() =>
                navigation.navigate('Home/friends/FollowersPage', {
                  userId: user?.$id || user?._id,
                  type: 'following',
                  viewSource: 'community',
                })
              }
            >
              <Text style={{
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000',
              }}>
                {followerData?.following ?? 0}
              </Text>
              <Text style={{
                marginLeft: 4,
                color: isDarkMode ? '#9CA3AF' : '#4B5563',
              }}>
                Following
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() =>
                navigation.navigate('Home/friends/FollowersPage', {
                  userId: user?.$id || user?._id,
                  type: 'followers',
                  viewSource: 'community',
                })
              }
            >
              <Text style={{
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000',
              }}>
                {followerData?.followers ?? 0}
              </Text>
              <Text style={{
                marginLeft: 4,
                color: isDarkMode ? '#9CA3AF' : '#4B5563',
              }}>
                Followers
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{
            marginBottom: 12,
            color: isDarkMode ? '#9CA3AF' : '#374151',
          }}>
            {user?.bio || 'Add bio'}
          </Text>
          {/* Profile Link Row (below bio, if present) */}
          {user?.link ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  let url = user.link;
                  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                  Linking.openURL(url);
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Icon
                  name="link"
                  size={18}
                  color={isDarkMode ? '#60A5FA' : '#2563EB'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    textDecorationLine: 'underline',
                    fontSize: 16,
                    color: isDarkMode ? '#60A5FA' : '#2563EB',
                    maxWidth: 220,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user.link}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Profile Picture */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 2,
            borderColor: '#22C55E',
            overflow: 'hidden',
            backgroundColor: '#F3F4F6',
          }}
        >
          <Image
            source={{ uri: user?.avatar || 'https://example.com/default-avatar.png' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', columnGap: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 16,
            borderWidth: 1,
            backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
            borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.navigate('Community/EditProfile')}
        >
          <Text
            style={{
              fontWeight: '600',
              textAlign: 'center',
              color: isDarkMode ? '#fff' : '#000',
            }}
          >
            Edit Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 16,
            borderWidth: 1,
            backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
            borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => setQrModalVisible(true)}
        >
          <Text
            style={{
              fontWeight: '600',
              textAlign: 'center',
              color: isDarkMode ? '#fff' : '#000',
            }}
          >
            Share Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal - Instagram style */}
      <Modal
        transparent={true}
        visible={qrModalVisible}
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#111827' : '#fff'
        }}>
          {/* Header */}
          <SafeAreaView edges={['top']}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#d1d5db'
            }}>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={28} color={isDarkMode ? "white" : "black"} />
              </TouchableOpacity>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDarkMode ? '#fff' : '#000'
              }}>QR Code</Text>
              <TouchableOpacity onPress={shareQRCode}>
                <Ionicons name="share-outline" size={26} color={isDarkMode ? "white" : "black"} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* QR Code Content */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24
          }}>
            <View style={{
              width: '100%',
              maxWidth: 400
            }}>
              {/* User Info */}
              {/* <View className="flex-row items-center justify-center mb-6">
                <View className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-cugreen">
                  <Image
                    source={{ uri: user?.avatar || 'https://example.com/default-avatar.png' }}
                    className="w-full h-full"
                  />
                </View>
                <View>
                  <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {user?.username || 'Guest'}
                  </Text>
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    @{user?.uniqueName || 'guest'}
                  </Text>
                </View>
              </View> */}

              {/* QR Code with styled container - Wrapped in ViewShot */}
              <ViewShot
                ref={viewShotRef}
                options={{
                  quality: 1,
                  format: 'png',
                  result: 'tmpfile'
                }}
              >
                <View style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  padding: 24,
                  backgroundColor: isDarkMode ? '#fff' : '#f3f4f6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2
                }}>
                  <View style={{ alignItems: 'center' }}>
                    {/* App name at top */}
                    <Text style={{
                      fontWeight: 'bold',
                      fontSize: 18,
                      color: '#000',
                      marginBottom: 12
                    }}>TrackEatFit</Text>
                    
                    {/* User info in shared image */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 24
                    }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        overflow: 'hidden',
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: '#22C55E'
                      }}>
                        <Image
                          source={{ uri: user?.avatar || 'https://example.com/default-avatar.png' }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                      <Text style={{
                        color: '#000',
                        fontWeight: '500'
                      }}>
                        @{user?.uniqueName || 'guest'}
                      </Text>
                    </View>
                    
                    {/* QR Code */}
                    <QRCode
                      value={qrCodeData}
                      size={250}
                      color="black"
                      backgroundColor="white"
                      logo={{ uri: user?.avatar || 'https://example.com/default-avatar.png' }}
                      logoSize={60}
                      logoBackgroundColor="white"
                      logoMargin={5}
                      logoBorderRadius={30}
                      getRef={(c) => (qrSvgRef.current = c)}
                    />
                    
                    {/* Scan instruction text */}
                    <Text style={{
                      textAlign: 'center',
                      marginTop: 24,
                      fontWeight: '500',
                      color: '#000'
                    }}>
                      Scan to view my profile
                    </Text>
                  </View>
                </View>
              </ViewShot>

              {/* Instructions */}
              <Text style={{
                textAlign: 'center',
                marginTop: 32,
                marginBottom: 8,
                fontSize: 16,
                color: isDarkMode ? '#d1d5db' : '#374151'
              }}>
                People can scan this code to visit your profile
              </Text>

              <Text style={{
                textAlign: 'center',
                marginBottom: 32,
                fontSize: 14,
                color: isDarkMode ? '#9CA3AF' : '#6B7280'
              }}>
                Your QR code is unique to your account
              </Text>

              {/* Action Buttons - Instagram style */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginTop: 16,
                  backgroundColor: isDarkMode ? '#1F2937' : '#e5e7eb'
                }}
                onPress={saveQRCode}
              >
                <Ionicons name="download-outline" size={22} color={isDarkMode ? "white" : "black"} style={{ marginRight: 8 }} />
                <Text style={{
                  fontWeight: '600',
                  color: isDarkMode ? '#fff' : '#000'
                }}>
                  Save QR Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 24,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb', // border-gray-700 or border-gray-200
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingBottom: 12,
            borderBottomWidth: activeTab === 'threads' ? 2 : 0,
            borderBottomColor: activeTab === 'threads' ? (isDarkMode ? '#fff' : '#000') : 'transparent',
          }}
          onPress={() => setActiveTab('threads')}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === 'threads'
                ? (isDarkMode ? '#fff' : '#000')
                : (isDarkMode ? '#9CA3AF' : '#6B7280'),
            }}
          >
            Threads
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingBottom: 12,
            borderBottomWidth: activeTab === 'replies' ? 2 : 0,
            borderBottomColor: activeTab === 'replies' ? (isDarkMode ? '#fff' : '#000') : 'transparent',
          }}
          onPress={() => setActiveTab('replies')}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === 'replies'
                ? (isDarkMode ? '#fff' : '#000')
                : (isDarkMode ? '#9CA3AF' : '#6B7280'),
            }}
          >
            Replies
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const Profile = () => {
  // Initialize followerData with default values
  const [followerData, setFollowerData] = useState({
    followers: 0,
    following: 0,
    lastFetched: null,
    isLoading: true
  });
  
  // Add existing states
  const { user } = useGlobalContext();
  const [localUserId, setLocalUserId] = useState(null);
  const userId = localUserId || user?.$id || user?._id;

  useEffect(() => {
    if (user?.$id || user?._id) {
      setLocalUserId(user.$id || user._id);
    }
  }, [user]);

  const navigation = useNavigation();
  
  const [activeTab, setActiveTab] = useState('threads'); // State to track active tab
  const [isLiked, setIsLiked] = useState(false);  // State to track if the post is liked
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollY = useRef(new AnimatedRN.Value(0)).current;
  const limit = 10;
  const [loadedPostIds, setLoadedPostIds] = useState(new Set()); // Add this state
  const eventSourceRef = useRef(null);
  const eventSourceRepliesRef = useRef(null); // Add a new ref for replies SSE
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const { isDarkMode } = useTheme();
  const [refetchCount, setRefetchCount] = useState(0);

  const [repliesData, setRepliesData] = useState([]);
const [repliesLoading, setRepliesLoading] = useState(false);
const [repliesRefreshing, setRepliesRefreshing] = useState(false);
const [repliesPage, setRepliesPage] = useState(1);
const [repliesHasMore, setRepliesHasMore] = useState(true);

// Update fetchReplies to support pagination and hasMore
const fetchReplies = useCallback(async (pageNum = 1, append = false) => {
  if (!userId) return;
  if (!append) setRepliesLoading(true);
  try {
    const response = await fetch(
      `${API_URL}/comments/comments-by-user/${userId}?currentuserId=${user?.$id || user?._id}&page=${pageNum}&limit=10`
    );
    if (response.ok) {
      const data = await response.json();
      // Only include items where comments array is not empty
      const filteredPosts = (data.posts || []).filter(item => item.comments && item.comments.length > 0);
      setRepliesHasMore(data.hasMore === true);
      setRepliesPage(pageNum + 1);
      if (append) {
        setRepliesData(prev => [...prev, ...filteredPosts]);
      } else {
        setRepliesData(filteredPosts);
      }
    } else {
      if (!append) setRepliesData([]);
    }
  } catch (e) {
    if (!append) setRepliesData([]);
  } finally {
    if (!append) setRepliesLoading(false);
  }
}, [userId, user]);

useEffect(() => {
  if (activeTab === 'replies') {
    setRepliesLoading(true); // <-- Add this line to show loader immediately
    setRepliesPage(1);
    setRepliesHasMore(true);
    fetchReplies(1, false);
  }
}, [activeTab, fetchReplies]);

const handleRepliesRefresh = useCallback(async () => {
  setRepliesRefreshing(true);
  setRepliesPage(1);
  setRepliesHasMore(true);
  await fetchReplies(1, false);
  setRepliesRefreshing(false);
}, [fetchReplies]);

const handleRepliesLoadMore = useCallback(() => {
  if (!repliesLoading && repliesHasMore) {
    fetchReplies(repliesPage, true);
  }
}, [repliesLoading, repliesHasMore, repliesPage, fetchReplies]);

const ReplyItem = memo(({ post, comments, onSaveUpdate }) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const [commentMenuId, setCommentMenuId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Add this function to handle comment deletion
  const handleDeleteComment = async (commentId) => {
    analyticsService.logEvent('delete_comment', {
      commentId,
      userId: user?.$id || user?._id,
    });
    setDeleting(true);
    try {
      // Replace fetchWithTimeout with fetch
      const response = await fetch(
        `${API_URL}/comments/delete/${commentId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.$id || user?._id,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Remove the deleted comment from the UI
        setCommentMenuId(null);
        // Optionally, you can update repliesData in parent via props/callback or rely on SSE to update
        Alert.alert('Success', data.message || 'Comment deleted successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to delete comment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete comment');
    } finally {
      setDeleting(false);
    }
  };

  // Comment Like Button (same as PostDetails)
  const CommentLikeButton = React.useCallback(({ commentId, initialLikesCount = 0, initialIsLiked }) => {
    const [isCommentLiked, setIsCommentLiked] = useState(initialIsLiked);
    const [commentLikesCount, setCommentLikesCount] = useState(Number(initialLikesCount) || 0);
    const userId = user?.$id || user?._id;

    const handleLikePress = useCallback(async () => {
      analyticsService.logEvent(isCommentLiked ? 'unlike_comment' : 'like_comment', {
        commentId,
        userId,
      });
      const previousLikeState = isCommentLiked;
      const previousCount = commentLikesCount;

      // Optimistic update
      setIsCommentLiked(!previousLikeState);
      setCommentLikesCount(prev => previousLikeState ? prev - 1 : prev + 1);

      try {
        const endpoint = previousLikeState
          ? `${API_URL}/comment-likes/remove-like`
          : `${API_URL}/comment-likes/like`;

        const method = previousLikeState ? 'DELETE' : 'POST';
        const payload = {
          userId,
          commentId,
          ...(method === 'POST' && {
            profilename: user?.username,
            uniqueName: user?.uniqueName,
            profilepic: user?.avatar
          })
        };

        // Replace fetchWithTimeout with fetch
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          // Revert on failure
          setIsCommentLiked(previousLikeState);
          setCommentLikesCount(previousCount);
          throw new Error('Failed to update like status');
        }
      } catch (error) {
        console.error('Error in handleLikePress:', error);
      }
    }, [isCommentLiked, commentLikesCount, userId, commentId, user]);

    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center' }}
        onPress={handleLikePress}
        accessibilityLabel={isCommentLiked ? "Unlike comment" : "Like comment"}
      >
        <Ionicons
          name={isCommentLiked ? "heart" : "heart-outline"}
          size={24}
          color={isCommentLiked ? "#FF0000" : isDarkMode ? "#FFFFFF" : "#000000"}
          style={{ marginRight: 2 }}
        />
        <Text style={{ marginLeft: 4, color: isDarkMode ? 'white' : 'black' }}>{commentLikesCount}</Text>
      </TouchableOpacity>
    );
  }, [user]);

    // Add this handler to update repliesData for main post like/unlike
    const handlePostLikeUpdate = (postId, newLikesCount, newIsLiked) => {
      setRepliesData(prev =>
        prev.map(item =>
          item.post && item.post._id === postId
            ? { ...item, post: { ...item.post, likesCount: newLikesCount, isLiked: newIsLiked } }
            : item
        )
      );
    };

    return (
      <View style={{ marginBottom: 32, paddingHorizontal: 16 }}>
        {/* Post Preview - use Thread component for post */}
        {post && (
          <Thread
            content={post.content}
            timestamp={post.timestamp}
            profilename={post.profilename}
            uniqueName={post.uniqueName}
            profilepic={post.profilepic}
            likesCount={post.likesCount}
            isLiked={post.isLiked}
            isSaved={post.isSaved}
            _id={post._id}
            commentsCount={post.commentsCount}
            images={post.images}
            // Pass the callback for like/unlike
            onLikeUpdate={handlePostLikeUpdate}
            // Pass the callback for save/unsave
            onSaveUpdate={onSaveUpdate}
          />
        )}

        {/* User's Comments Section - Polished Look */}
        {comments && comments.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                marginBottom: 8,
                marginLeft: 16,
                fontWeight: '600',
                fontSize: 14,
                color: isDarkMode ? '#22C55E' : '#16A34A'
              }}
            >
              Your Comments
            </Text>
            {comments.map((comment) => (
              <View
                key={comment._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  marginLeft: 16,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  backgroundColor: isDarkMode ? '#1F2937' : '#fff',
                  shadowColor: isDarkMode ? '#000' : '#aaa',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Image
                  source={{
                    uri:
                      comment.profilepic ||
                      'https://example.com/default-avatar.png',
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 12,
                    borderWidth: 2,
                    borderColor: '#22C55E',
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text
                      style={{
                        fontWeight: '600',
                        fontSize: 14,
                        color: isDarkMode ? '#fff' : '#000',
                      }}
                    >
                      {comment.profilename}
                    </Text>
                    <Text style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: isDarkMode ? '#9CA3AF' : '#6B7280',
                    }}>
                      @{comment.uniqueName}
                    </Text>
                    <Text style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: isDarkMode ? '#9CA3AF' : '#6B7280',
                    }}>
                      · {timeSince(new Date(comment.timestamp))} ago
                    </Text>
                    {/* Show menu icon beside time */}
                    {(user?._id === comment.userId || user?.$id === comment.userId) && (
                      <TouchableOpacity
                        style={{ marginLeft: 25, padding: 4 }}
                        onPress={() => setCommentMenuId(comment._id)}
                      >
                        <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? "white" : "black"} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View
                    style={{
                      borderRadius: 12,
                      padding: 10,
                      backgroundColor: isDarkMode ? '#374151' : '#f9f9f9',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDarkMode ? '#fff' : '#000',
                      }}
                    >
                      {comment.content}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                    <CommentLikeButton
                      commentId={comment._id}
                      initialLikesCount={comment.likesCount}
                      initialIsLiked={comment.isLiked}
                    />
                  </View>
                </View>
                {/* Comment menu modal */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={commentMenuId === comment._id}
                  onRequestClose={() => setCommentMenuId(null)}
                >
                  <TouchableWithoutFeedback onPress={() => setCommentMenuId(null)}>
                    <View style={{
                      flex: 1,
                      justifyContent: 'flex-end',
                      backgroundColor: 'rgba(0,0,0,0.1)'
                    }}>
                      <TouchableWithoutFeedback>
                        <View style={{
                          padding: 20,
                          borderTopLeftRadius: 24,
                          borderTopRightRadius: 24,
                          backgroundColor: isDarkMode ? '#111827' : '#fff'
                        }}>
                          <View style={{
                            flex: 1,
                            width: 80,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#0f172a',
                            padding: 1,
                            marginBottom: 16,
                            marginLeft: '36%',
                            marginTop: -8,
                            borderWidth: 1,
                            borderColor: '#0f172a',
                            borderRadius: 12
                          }} />
                          {/* Only owner can see delete/edit */}
                          {(user?._id === comment.userId || user?.$id === comment.userId) && (
                            <View style={{
                              borderWidth: 1,
                              borderColor: '#d1d5db',
                              borderRadius: 12,
                              marginTop: 8,
                              marginBottom: 12
                            }}>
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 8,
                                  borderBottomWidth: 1,
                                  borderBottomColor: '#d1d5db'
                                }}
                                disabled={deleting}
                                onPress={() => {
                                  setCommentMenuId(null);
                                  Alert.alert(
                                    'Delete Comment',
                                    'Are you sure you want to delete this comment?',
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: () => handleDeleteComment(comment._id),
                                      }
                                    ]
                                  );
                                }}
                              >
                                <Text style={{
                                  marginLeft: 12,
                                  flex: 1,
                                  fontWeight: '500',
                                  fontSize: 16,
                                  marginTop: 2,
                                  marginBottom: 2,
                                  color: 'red'
                                }}>
                                  {deleting ? 'Deleting...' : 'Delete'}
                                </Text>
                                <Ionicons name="trash-outline" size={24} color="red" style={{ marginRight: 10 }} />
                              </TouchableOpacity>
                              {/* <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 8
                                }}
                                onPress={() => {
                                  setCommentMenuId(null);
                                  Alert.alert('Edit', 'Edit comment feature coming soon.');
                                }}
                              >
                                <Text style={{
                                  marginLeft: 12,
                                  flex: 1,
                                  fontWeight: '500',
                                  fontSize: 16,
                                  marginTop: 2,
                                  marginBottom: 2,
                                  color: isDarkMode ? '#fff' : '#000'
                                }}>Edit</Text>
                                <Ionicons name="create-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                              </TouchableOpacity> */}
                            </View>
                          )}
                          {/* Save/Copy Link for all users */}
                          {/* <View style={{
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            borderRadius: 12,
                            marginBottom: 8
                          }}>
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: '#d1d5db'
                              }}
                              onPress={() => {
                                setCommentMenuId(null);
                                Alert.alert('Save', 'Save/Unsave comment feature coming soon.');
                              }}
                            >
                              <Text style={{
                                marginLeft: 12,
                                flex: 1,
                                fontWeight: '500',
                                fontSize: 16,
                                marginTop: 2,
                                marginBottom: 2,
                                color: isDarkMode ? '#fff' : '#000'
                              }}>
                                Save
                              </Text>
                              <Ionicons
                                name="bookmark-outline"
                                size={24}
                                color={isDarkMode ? "white" : "black"}
                                style={{ marginRight: 10 }}
                              />
                            </TouchableOpacity>
                          </View> */}
                          <View style={{ marginTop: 16 }}>
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                borderWidth: 1,
                                borderColor: '#d1d5db',
                                borderRadius: 12,
                                marginBottom: 8
                              }}
                              onPress={() => {
                                setCommentMenuId(null);
                                Alert.alert('Copy Link', 'Copy comment link feature coming soon.');
                              }}
                            >
                              <Text style={{
                                marginLeft: 12,
                                flex: 1,
                                fontWeight: '500',
                                fontSize: 16,
                                marginTop: 2,
                                marginBottom: 2,
                                color: isDarkMode ? '#fff' : '#000'
                              }}>Copy Link</Text>
                              <Ionicons name="link-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  });

const handleRepliesSaveUpdate = (postId, newIsSaved) => {
  setRepliesData(prev =>
    prev.map(item =>
      item.post && item.post._id === postId
        ? { ...item, post: { ...item.post, isSaved: newIsSaved } }
        : item
    )
  );
};

const renderReplies = () => {
  if (repliesLoading && repliesPage === 1) {
    return (
      <ScrollView>
        <PostSkeleton />
        <PostSkeleton />
      </ScrollView>
    );
  }
  if (!repliesData || repliesData.length === 0) {
  return (
    <View style={{ flex: 1, marginTop: 20 }}>
      <Text
        style={{
          fontSize: 14, // text-sm
          textAlign: "center",
          marginTop: 12, // mt-3
          color: isDarkMode ? "#9CA3AF" : "#4B5563", // gray-400 / gray-600
        }}
      >
        You haven't posted any replies yet...
      </Text>
    </View>
  );
}

  return (
    <AnimatedRN.FlatList
      data={repliesData}
      renderItem={({ item }) => (
        <ReplyItem post={item.post} comments={item.comments} onSaveUpdate={handleRepliesSaveUpdate} />
      )
      }
      keyExtractor={item => String(item.post?._id || Math.random())}
      refreshControl={
        <RefreshControl
          refreshing={repliesRefreshing}
          onRefresh={handleRepliesRefresh}
          progressViewOffset={10}
        />
      }
      ListFooterComponent={() => {
        // Show skeletons if loading and no replies yet (first page)
        if (repliesLoading && repliesData.length === 0) {
          return (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          );
        }
        // Show skeletons if loading more (pagination)
        if (repliesLoading && repliesPage > 1) {
          return (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          );
        }
        if (!repliesHasMore && repliesData.length > 0) {
  return (
    <View style={{ paddingVertical: 16 }}>
      <Text
        style={{
          textAlign: "center",
          color: isDarkMode ? "#9CA3AF" : "#6B7280", // gray-400 / gray-500
        }}
      >
        No more replies to load
      </Text>
    </View>
  );
}

if (repliesData.length > 0 && repliesHasMore) {
  return (
    <View style={{ paddingVertical: 8, alignItems: "center" }}>
      <ActivityIndicator size="small" color="#666" />
      <Text
        style={{
          textAlign: "center",
          fontSize: 14, // text-sm
          marginTop: 4, // mt-1
          color: isDarkMode ? "#6B7280" : "#9CA3AF", // gray-500 / gray-400
        }}
      >
        Loading more replies...
      </Text>
    </View>
  );
}
        return null;
      }}
      ListEmptyComponent={() =>
  !repliesLoading && (
    <View style={{ flex: 1, marginTop: 20 }}>
      <Text
        style={{
          fontSize: 14, // text-sm
          textAlign: "center",
          marginTop: 12, // mt-3
          color: isDarkMode ? "#9CA3AF" : "#4B5563", // gray-400 / gray-600
        }}
      >
        You haven't posted any replies yet...
      </Text>
    </View>
  )
}

      contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      showsVerticalScrollIndicator={false}
    />
  );
};

const handlePosts = () => {
    navigation.navigate('Posts');
};

const handlebio = ()=>{
  navigation.navigate('Community/EditProfile');
}

const timeSince = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
      return "Invalid time"; // Handle invalid date
  }

  const seconds = Math.floor((new Date() - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hours`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}months`;
  const years = Math.floor(months / 12);
  return `${years}years`;
};

const fetchPosts = useCallback(async (pageNum = 1, isLoadingMore = false) => {
  try {
    if (!isLoadingMore) {
      setLoading(true);
      setLoadedPostIds(new Set());
    } else {
      setIsLoadingMore(true);
    }

    // Replace fetchWithTimeout with fetch
    const response = await fetch(
      `${API_URL}/posts/user/${userId}?page=${pageNum}&limit=${limit}&currentUserId=${user?.$id || user?._id}&timestamp=${Date.now()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user posts');
    }

    const data = await response.json();
    
    setTotalPages(data.totalPages);
    setTotalPosts(data.totalPosts || 0);
    setHasMore(data.hasMore);

    // Filter out duplicates and ensure new posts are included
    const newPosts = data.posts.filter(post => !loadedPostIds.has(post._id));
    const newPostIds = new Set([...loadedPostIds, ...newPosts.map(post => post._id)]);
    setLoadedPostIds(newPostIds);

    if (pageNum === 1) {
      setPosts(data.posts);
    } else if (isLoadingMore) {
      setPosts(prev => [...prev, ...newPosts]);
    }

    setPage(data.currentPage + 1);

  } catch (error) {
    console.error('Failed to fetch posts:', error);
  } finally {
    setLoading(false);
    setIsLoadingMore(false);
    setInitialLoading(false);
  }
}, [userId, loadedPostIds, user]);

useEffect(() => {
  if (userId) {
    setInitialLoading(true);
    fetchPosts(1, false).finally(() => {
      setInitialLoading(false);
    });
  }
}, [userId, refetchCount]); // add refetchCount

// Add follower count fetching function
const fetchFollowCounts = useCallback(async (force = false) => {
  const CACHE_DURATION = 5 * 60 * 1000;
  
  if (!force && followerData.lastFetched && 
      (Date.now() - followerData.lastFetched) < CACHE_DURATION) {
    return; // Use cached data if within cache duration
  }

  try {
    const userId = user?.$id || user?._id;
    if (!userId) return;

    setFollowerData(prev => ({ ...prev, isLoading: true }));

    // Replace fetchWithTimeout with fetch
    const response = await fetch(`${API_URL}/api/following/counts/${userId}`);
    if (response.ok) {
      const data = await response.json();
      setFollowerData({
        followers: data.followers || 0,
        following: data.following || 0,
        lastFetched: Date.now(),
        isLoading: false
      });
    }
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    setFollowerData(prev => ({ 
      ...prev, 
      isLoading: false,
      error: 'Failed to load follower counts'
    }));
  }
}, [user]);

// Ensure follower counts are fetched when component mounts
useEffect(() => {
  if (user?.$id || user?._id) {
    fetchFollowCounts(true);
  }
}, [user]);

useEffect(() => {
  // --- Refined SSE connection for posts using CommunitySSEClient ---
  let isMounted = true;
  const userId = user?.$id || user?._id;
  if (!userId) return;

  // Always use the singleton instance for this user and page
  if (eventSourceRef.current && typeof eventSourceRef.current.close === 'function') {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }

  let reconnectTimeout = null;

  const handleError = (err) => {
    console.error('[Profile] WebSocket Error:', err);
    if (isMounted) {
      reconnectTimeout = setTimeout(() => {
        if (isMounted && eventSourceRef.current) {
          eventSourceRef.current.connect();
        }
      }, 5000);
    }
  };

  const handleOpen = () => {
    console.log('[Profile] WebSocket connection opened');
  };

  const handlePostsEvent = (data) => {
    console.log('[Profile] Received posts event:', data);
    // Always update posts, even if not in focus

    // Normalize userId for comparison
    const eventUserId =
      typeof data?.post?.userId === 'object'
        ? data.post.userId._id || data.post.userId.$id
        : data?.post?.userId;

    switch (data.type) {
      case 'create':
        if (eventUserId === userId) {
          setPosts(prevPosts => {
            const isDuplicate = prevPosts.some(post => post._id === data.post._id);
            if (isDuplicate) return prevPosts;
            // Ensure likesCount, commentsCount, isLiked, isSaved are present
            const normalizedPost = {
              ...data.post,
              likesCount: typeof data.post.likesCount === 'number' ? data.post.likesCount : 0,
              commentsCount: typeof data.post.commentsCount === 'number' ? data.post.commentsCount : 0,
              isLiked: typeof data.post.isLiked === 'boolean' ? data.post.isLiked : false,
              isSaved: typeof data.post.isSaved === 'boolean' ? data.post.isSaved : false,
            };
            return [normalizedPost, ...prevPosts];
          });
        }
        break;
      case 'update':
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === data.post._id
              ? { ...post, ...data.post }
              : post
          )
        );
        break;
      case 'delete':
        setPosts(prevPosts =>
          prevPosts.filter(post => post._id !== data.postId)
        );
        break;
      case 'saveUpdate':
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === (data.postId || data.post?._id)
              ? { ...post, ...(data.post || {}), isSaved: data.isSaved }
              : post
          )
        );
        break;
      case 'likeUpdate':
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === (data.postId || data.post?._id)
              ? {
                  ...post,
                  ...(data.post || {}),
                  likesCount: data.likesCount,
                  isLiked: data.isLiked
                }
              : post
          )
        );
        break;
      default:
        break;
    }
  };

  const handleSavedEvent = (data) => {
    console.log('[Profile] Received savedPosts event:', data);
    if (!isMounted) return;
    setPosts(prevPosts => {
      
      if (data && data.post && data.type === 'save') {
        const idx = prevPosts.findIndex(post => post._id === data.post._id);
        if (idx !== -1) {
          return prevPosts.map((post, i) =>
            i === idx ? { ...post, ...data.post, isSaved: true } : post
          );
        } else {
          return [{ ...data.post, isSaved: true }, ...prevPosts];
        }
      }
      if (data && data.postId) {
        return prevPosts.map(post =>
          post._id === data.postId
            ? { ...post, isSaved: data.type === 'save' }
            : post
        );
      }
      return prevPosts;
    });
  };

  const handleLikeEvent = (data) => {
    console.log('[Profile] Received like event:', data);
    // Always update posts, even if not in focus
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === (data.postId || data.post?._id)
          ? {
              ...post,
              ...(data.post || {}),
              isLiked: data.isLiked,
              likesCount: data.likesCount
            }
          : post
      )
    );
  };

  // Use a unique key for Profile instance to avoid collision with AllNews
  const client = CommunitySSEClient.getInstance({
    userId: userId + '-profile',
    onError: handleError,
    onOpen: handleOpen,
    onPosts: handlePostsEvent,
    onSaved: handleSavedEvent,
    onLike: handleLikeEvent,
    debugLabel: 'Profile'
  });
  eventSourceRef.current = client;
  client.connect();
  console.log('[Profile] CommunitySSEClient connect() called');

  return () => {
    isMounted = false;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSourceRef.current && typeof eventSourceRef.current.close === 'function') {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };
}, [userId]);

// --- SSE for replies tab ---
useEffect(() => {
  if (!userId) return;

  if (eventSourceRepliesRef.current && typeof eventSourceRepliesRef.current.close === 'function') {
    eventSourceRepliesRef.current.close();
    eventSourceRepliesRef.current = null;
  }

  let reconnectTimeout = null;

  const handleError = (err) => {
    console.error('[Profile] Replies WebSocket Error:', err);
    reconnectTimeout = setTimeout(() => {
      if (eventSourceRepliesRef.current) {
        eventSourceRepliesRef.current.connect();
      }
    }, 5000);
  };

  // Handles comment events (create, update, delete, like/unlike)
  const handleCommentEvent = (data, eventType) => {
    try {
      // --- PATCH: Handle commentLike/commentUnlike SSE events for current user ---
      if (
        (eventType === 'commentLike' || eventType === 'commentUnlike') &&
        data.commentId
      ) {
        setRepliesData(prevReplies =>
          prevReplies.map(item => ({
            ...item,
            comments: item.comments.map(c => {
              if (c._id === data.commentId) {
                // Always update likesCount
                let updatedLikesCount = c.likesCount;
                if (typeof data.likesCount === 'number') {
                  updatedLikesCount = data.likesCount;
                } else if (eventType === 'commentLike') {
                  updatedLikesCount = (c.likesCount || 0) + 1;
                } else if (eventType === 'commentUnlike') {
                  updatedLikesCount = Math.max((c.likesCount || 1) - 1, 0);
                }
                // Only update isLiked for the current user
                let updatedIsLiked = c.isLiked;
                const currentUserId = user?.$id || user?._id;
                if (data.userId === currentUserId) {
                  updatedIsLiked = eventType === 'commentLike';
                }
                return {
                  ...c,
                  isLiked: updatedIsLiked,
                  likesCount: updatedLikesCount
                };
              }
              return c;
            })
          }))
        );
        return;
      }
      // --- PATCH END ---

      // Only update if the comment belongs to the current user
      if (data.type === 'likeUpdate' && data.postId && data.post) {
        // Update main post like state in repliesData
        setRepliesData(prevReplies =>
          prevReplies.map(item =>
            item.post && item.post._id === data.postId
              ? {
                  ...item,
                  post: {
                    ...item.post,
                    likesCount: data.likesCount,
                    isLiked: data.isLiked
                  }
                }
              : item
          )
        );
        return;
      }

      // Handle delete event even if data.comment is not present
      if (data.type === 'delete' && data.commentId && data.userId === userId) {
        setRepliesData(prevReplies =>
          prevReplies
            .map(item => ({ ...item, comments: item.comments.filter(c => c._id !== data.commentId) }))
            .filter(item => item.comments.length > 0)
        );
        return;
      }

      if (!data.comment || (data.comment.userId !== userId && data.userId !== userId)) return;

      setRepliesData(prevReplies => {
        let updated = [...prevReplies];
        switch (data.type) {
          case 'create':
            {
              const postIdx = updated.findIndex(item => item.post?._id === data.comment.postId);
              if (postIdx !== -1) {
                if (!updated[postIdx].comments.some(c => c._id === data.comment._id)) {
                  updated[postIdx] = {
                    ...updated[postIdx],
                    comments: [data.comment, ...updated[postIdx].comments]
                  };
                }
              }
            }
            break;
          case 'update':
            updated = updated.map(item => ({
              ...item,
              comments: item.comments.map(c =>
                c._id === data.comment._id ? { ...c, ...data.comment } : c
              )
            }));
            break;
          // delete is handled above
          default:
            break;
        }
        return updated.filter(item => item.comments && item.comments.length > 0);
      });
    } catch (err) {
      console.error('Replies SSE error:', err);
    }
  };

  // Handles like events for posts (from onLike)
  // This updates repliesData even if the replies tab is not active,
  // so the like state is always in sync when switching tabs.
  const handleLikeEvent = (data) => {
    setRepliesData(prevReplies =>
      prevReplies.map(item =>
        item.post && item.post._id === (data.postId || data.post?._id)
          ? {
              ...item,
              post: {
                ...item.post,
                ...(data.post || {}),
                likesCount: data.likesCount,
                isLiked: data.isLiked
              }
            }
          : item
      )
    );
  };

  // Use a unique key for replies instance to avoid collision
  const client = CommunitySSEClient.getInstance({
    userId: userId + '-replies',
    onError: handleError,
    onComment: handleCommentEvent,
    onLike: handleLikeEvent,
    debugLabel: 'ProfileReplies'
  });
  eventSourceRepliesRef.current = client;
  client.connect();

  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSourceRepliesRef.current && typeof eventSourceRepliesRef.current.close === 'function') {
      eventSourceRepliesRef.current.close();
      eventSourceRepliesRef.current = null;
    }
  };
}, [userId]);

const ImageViewerModal = ({ visible, imageUrl, onClose, images, initialIndex = 0 }) => {
    const { isDarkMode } = useTheme();
    const scale = useRef(new AnimatedRN.Value(1)).current;
    const translateX = useRef(new AnimatedRN.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const { width: windowWidth } = Dimensions.get('window');
    
    useEffect(() => {
        translateX.setValue(0);
        setCurrentIndex(initialIndex);
    }, [visible, initialIndex]);

    const onPinchEvent = AnimatedRN.event([{
        nativeEvent: { scale: scale }
    }], { useNativeDriver: true });

    const onPanEvent = AnimatedRN.event([{
        nativeEvent: { translationX: translateX }
    }], { useNativeDriver: true });

    const onPanHandlerStateChange = ({ nativeEvent }) => {
        if (nativeEvent.oldState === State.ACTIVE) {
            const { translationX } = nativeEvent;
            if (Math.abs(translationX) > windowWidth * 0.3) {
                const newIndex = translationX > 0 ? currentIndex - 1 : currentIndex + 1;
                if (newIndex >= 0 && newIndex < images.length) {
                    setCurrentIndex(newIndex);
                }
            }
            AnimatedRN.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 1
            }).start();
        }
    };

    const animatedStyle = {
        transform: [
            { scale: scale },
            { translateX: translateX }
        ]
    };

    return (
      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        animationType="fade"
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{
            flex: 1,
            backgroundColor: isDarkMode ? '#111827' : '#fff',
          }}>
            <View style={{
              position: 'absolute',
              top: 48,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              zIndex: 10,
            }}>
              <Text style={{
                color: isDarkMode ? '#fff' : '#000',
              }}>
                {`${currentIndex + 1}/${images.length}`}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons
                  name="close"
                  size={30}
                  color={isDarkMode ? "white" : "black"}
                />
              </TouchableOpacity>
            </View>

            <PanGestureHandler
              onGestureEvent={onPanEvent}
              onHandlerStateChange={onPanHandlerStateChange}
            >
              <AnimatedRN.View style={{ flex: 1, justifyContent: 'center' }}>
                <PinchGestureHandler
                  onGestureEvent={onPinchEvent}
                >
                  <AnimatedRN.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
                    <Image
                      source={images[currentIndex]}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                    />
                  </AnimatedRN.View>
                </PinchGestureHandler>
              </AnimatedRN.View>
            </PanGestureHandler>

            <View style={{
              position: 'absolute',
              bottom: 40,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginHorizontal: 4,
                    backgroundColor:
                      index === currentIndex
                        ? (isDarkMode ? '#fff' : '#000')
                        : '#6B7280', // gray-500
                  }}
                />
              ))}
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    );
};

const Thread = memo((props) => {
  const { isDarkMode } = useTheme();
  const [isModalVisible, setModalVisible] = useState(false);
  // Optimistic UI state for like
  const [isLiked, setIsLiked] = useState(typeof props.isLiked === 'boolean' ? props.isLiked : false);
  const [likesCount, setLikesCount] = useState(typeof props.likesCount === 'number' ? props.likesCount : 0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [isSaved, setIsSaved] = useState(typeof props.isSaved === 'boolean' ? props.isSaved : false);
  const { width: screenWidth } = Dimensions.get('window');
  const [selectedImage, setSelectedImage] = useState(null);
  const { user } = useGlobalContext();
  const userId = user?.$id || user?._id;
  const navigation = useNavigation();

  // Ensure isSaved state updates when prop changes (SSE or parent update)
  useEffect(() => {
    setIsSaved(props.isSaved);
  }, [props.isSaved]);

  // Sync isLiked and likesCount with props (for SSE updates)
  useEffect(() => {
    setIsLiked(typeof props.isLiked === 'boolean' ? props.isLiked : false);
  }, [props.isLiked]);

  useEffect(() => {
    setLikesCount(typeof props.likesCount === 'number' ? props.likesCount : 0);
  }, [props.likesCount]);

  // Optimistic Like Handler
  const handleLike = async () => {
    analyticsService.logEvent(isLiked ? 'unlike_post' : 'like_post', {
      postId: props._id,
      userId,
      profilename: user?.username,
      uniqueName: user?.uniqueName,
    });
    try {
      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

      const endpoint = newIsLiked
        ? `${API_URL}/posts-likes/like`
        : `${API_URL}/posts-likes/unlike`;

      const method = newIsLiked ? 'POST' : 'DELETE';
      const body = {
        userId,
        postId: props._id,
        ...(method === 'POST' && {
           profilename: user?.username,
           profilepic: user?.avatar,
           uniqueName: user?.uniqueName
        })
      };

      // Replace fetchWithTimeout with fetch
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Revert optimistic update if failed
        setIsLiked(!newIsLiked);
        setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update like status');
      } else {
        // Call the callback to update parent state (for replies tab)
        if (props.onLikeUpdate) {
          props.onLikeUpdate(props._id, newIsLiked ? likesCount + 1 : likesCount - 1, newIsLiked);
        }
      }
    } catch (error) {
      // Revert optimistic update if error
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };

  const handleCommentPress = () => {
    navigation.navigate('posts/[id]', { id: props._id });
    console.log('Navigating to post comments:', props._id);
  };

  const isContentLong = props.content && (props.content.length > 180 || (props.content.match(/\n/g) || []).length >= 4);

  const handleDelete = async () => {
    analyticsService.logEvent('delete_post', {
      postId: props._id,
      userId,
    });
    try {
      // Replace fetchWithTimeout with fetch
      const response = await fetch(`${API_URL}/posts/delete/${props._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setModalVisible(false);
        Alert.alert('Success', data.message || 'Post deleted successfully');
      } else {
        Alert.alert('Error', data.error || data.details || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleEdit = () => {
    analyticsService.logEvent('edit_post', {
      postId: props._id,
      userId,
    });
    navigation.navigate('PostEdit', { 
      postId: props._id, 
      content: props.content,
      userId, 
      images: JSON.stringify(props.images)
    });
  };

  const handleSave = async () => {
    // Optimistically update UI immediately
    setIsSaved(prev => {
      const newIsSaved = !prev;
      if (props.onSaveUpdate) {
        props.onSaveUpdate(props._id, newIsSaved);
      }
      return newIsSaved;
    });
    analyticsService.logEvent(isSaved ? 'unsave_post' : 'save_post', {
      postId: props._id,
      userId,
    });
    try {
      const endpoint = isSaved ? 
        `${API_URL}/api/saved-posts/unsave` : 
        `${API_URL}/api/saved-posts/save`;
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(endpoint, {
       
       
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          postId: props._id
        }),
      });
      if (response.ok) {
        setModalVisible(false);
      } else {
        // Revert UI if failed
        setIsSaved(prev => {
          const reverted = !prev;
          if (props.onSaveUpdate) {
            props.onSaveUpdate(props._id, reverted);
          }
          return reverted;
        });
        const errorData = await response.json();
        console.error('Save action failed:', errorData.message);
        Alert.alert('Error', errorData.message || 'Failed to save post');
      }
    } catch (error) {
      // Revert UI if error
      setIsSaved(prev => {
        const reverted = !prev;
        if (props.onSaveUpdate) {
          props.onSaveUpdate(props._id, reverted);
        }
        return reverted;
      });
      console.error('Error handling save/unsave:', error);
      Alert.alert('Error', 'Failed to save post. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    analyticsService.logEvent('copy_post_link', {
      postId: props._id,
      userId,
    });
    const url = `https://trackeatfit.xyz/posts/${props._id}`;
    Clipboard.setString(url);
    setModalVisible(false);
    // Optionally, show a toast or alert if desired
    // Alert.alert('Link Copied', 'The post link has been copied to your clipboard.');
  };

  // Add share handler for modal
  const createShareableLink = (postId) => {
    return `https://trackeatfit.xyz/posts/${postId}`;
  };

  const handleShare = async () => {
    analyticsService.logEvent('share_post', {
      postId: props._id,
      userId,
    });
    try {
      const link = createShareableLink(props._id);
      const result = await Share.share({
        message: link,
        url: link,
        title: 'Check out this post'
      });
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const renderImages = () => {
    if (!props.images || props.images.length === 0) return null;

    const containerWidth = screenWidth - 32;
    const imageWidth = containerWidth * 0.74;

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 0 }}
          contentContainerStyle={{
            gap: 16,
            paddingLeft: 0,
          }}
        >
          {props.images.slice(0, 6).map((imageUrl, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImage({ url: imageUrl, index })}
              style={{
                maxWidth: imageWidth,
                borderRadius: 15,
                overflow: 'hidden',
                marginLeft: index === 0 ? 0 : 0,
              }}
            >
              <View>
                <View style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e5e7eb', // bg-gray-200
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ActivityIndicator size="small" color="#0000ff" />
                </View>
                <ExpoImage
                  source={imageUrl}
                  style={{
                    width: imageWidth,
                    height: undefined,
                    aspectRatio: 16/9,
                  }}
                  contentFit="cover"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ImageViewerModal
          visible={!!selectedImage}
          imageUrl={selectedImage?.url}
          images={props.images}
          initialIndex={selectedImage?.index || 0}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  };

  return (
    <View style={{
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb', // border-gray-700 or border-gray-200
      backgroundColor: isDarkMode ? '#111827' : '#fff', // bg-gray-900 or bg-white
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderWidth: 1,
            borderColor: '#22C55E', // border-cugreen
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            marginRight: 12,
          }}
          onPress={() => navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName: props.uniqueName })}
        >
          <ExpoImage
            source={props.profilepic || 'https://example.com/default-avatar.png'}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000'
              }}>{props.profilename}</Text>
              <Text style={{ color: '#6b7280', marginLeft: 4 }}>
                {props.uniqueName ? `@${props.uniqueName}` : `@${props.profilename.toLowerCase()}`}
              </Text>
              <Text style={{ color: '#6b7280', marginLeft: 4 }}>
                · {timeSince(new Date(props.timestamp))} ago
              </Text>
            </View>

            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }}/>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleCommentPress}>
            <Text style={{
              fontSize: 16,
              marginTop: 4,
              fontWeight: 'normal',
              color: isDarkMode ? '#fff' : '#000'
            }}>
              {
                isContentLong && !showFullContent
                  ? `${props.content.slice(0, 180).replace(/\n/g, ' ')}... `
                  : props.content
              }
              {
                isContentLong &&
                <Text style={{ color: '#22C55E', fontWeight: '600' }}>show more</Text>
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={{ marginLeft: 32 }}>
        {renderImages()}
      </View>

      <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 8 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginRight: 12 }} onPress={handleLike}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "red" : isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
          <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }} onPress={handleCommentPress}>
          <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
          <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{typeof props.commentsCount === 'number' ? props.commentsCount : 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleSave}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isDarkMode ? "white" : "black"}
            style={{ marginRight: 5 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons
            name="share-social-outline"
            size={22}
            color={isDarkMode ? "white" : "black"}
            style={{ marginRight: 5 }}
          />
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >                
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <TouchableWithoutFeedback>
              <View style={{
                padding: 20,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                backgroundColor: isDarkMode ? '#111827' : '#fff'
              }}>
                <View style={{
                  flex: 1,
                  width: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f172a',
                  padding: 1,
                  marginBottom: 16,
                  marginLeft: '36%',
                  marginTop: -8,
                  borderWidth: 1,
                  borderColor: '#0f172a',
                  borderRadius: 12
                }} />
                
                <View style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  marginBottom: 8
                }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: '#d1d5db'
                    }}
                    onPress={handleSave}
                  >
                    <Text style={{
                      marginLeft: 12,
                      flex: 1,
                      fontWeight: '500',
                      fontSize: 16,
                      marginTop: 2,
                      marginBottom: 2,
                      color: isDarkMode ? '#fff' : '#000'
                    }}>
                      {isSaved ? 'Unsave' : 'Save'}
                    </Text>
                    <Ionicons 
                      name={isSaved ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={isDarkMode ? "white" : "black"} 
                      style={{ marginRight: 10 }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Add Delete and Edit options for post owner */}
                {(userId === props.postOwnerId) && (
                  <View style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 12,
                    marginBottom: 8
                  }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#d1d5db'
                      }}
                      onPress={() => {
                        setModalVisible(false);
                        Alert.alert(
                          'Delete Post',
                          'Are you sure you want to delete this post?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: handleDelete,
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={{
                        marginLeft: 12,
                        flex: 1,
                        fontWeight: '500',
                        fontSize: 16,
                        marginTop: 2,
                        marginBottom: 2,
                        color: 'red'
                      }}>Delete</Text>
                      <Ionicons name="trash-outline" size={24} color="red" style={{ marginRight: 10 }} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8
                      }}
                      onPress={() => {
                        setModalVisible(false);
                        handleEdit();
                      }}
                    >
                      <Text style={{
                        marginLeft: 12,
                        flex: 1,
                        fontWeight: '500',
                        fontSize: 16,
                        marginTop: 2,
                        marginBottom: 2,
                        color: isDarkMode ? '#fff' : '#000'
                      }}>Edit</Text>
                      <Ionicons name="create-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Share and Copy Link Option */}
                <View style={{ marginTop: 16 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 12,
                      marginBottom: 8
                    }}
                    onPress={handleShare}
                  >
                    <Text style={{
                      marginLeft: 12,
                      flex: 1,
                      fontWeight: '500',
                      fontSize: 16,
                      marginTop: 2,
                      marginBottom: 2,
                      color: isDarkMode ? '#fff' : '#000'
                    }}>Share</Text>
                    <Ionicons name="share-social-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 12,
                      marginBottom: 8
                    }}
                    onPress={handleCopyLink}
                  >
                    <Text style={{
                      marginLeft: 12,
                      flex: 1,
                      fontWeight: '500',
                      fontSize: 16,
                      marginTop: 2,
                      marginBottom: 2,
                      color: isDarkMode ? '#fff' : '#000'
                    }}>Copy Link</Text>
                    <Ionicons name="link-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
});

// Use a robust keyExtractor for threads, just like allnews
const threadsKeyExtractor = useCallback((item, idx) => (
  item && item._id ? String(item._id) : `thread-${idx}`
), []);

// Add a robust keyExtractor for replies
const repliesKeyExtractor = useCallback((item, idx) => {
  // Prefer post._id, fallback to post.id, then idx
  if (item && item.post && item.post._id) return String(item.post._id);
  if (item && item.post && item.post.id) return String(item.post.id);
  return `reply-${idx}`;
}, []);

const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    if (userId) {
      // Fetch all data in parallel
      await Promise.all([
        fetchPosts(1, false),
               fetchFollowCounts(true),
        activeTab === 'replies' ? fetchReplies() : Promise.resolve()
      ]);
    }
  } catch (error) {
    console.error('Error refreshing:', error);
  } finally {
    setRefreshing(false);
    setPage(1);
    setLoadedPostIds(new Set());
  }
}, [userId, fetchPosts, fetchFollowCounts, fetchReplies, activeTab]);

const loadMorePosts = useCallback(() => {
  if (!isLoadingMore && hasMore && posts.length > 0) {
    fetchPosts(page, true);
  }
}, [page, isLoadingMore, hasMore, posts.length, fetchPosts]);

const renderItem = useCallback(({ item }) => (
  <Thread
    {...item}
    _id={item._id}
    postOwnerId={item.userId}
    onLikeUpdate={(postId, newLikesCount, newIsLiked) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, likesCount: newLikesCount, isLiked: newIsLiked }
            : post
        )
      );
    }}
  />
), []);

const ProfileCardsView = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
    {/* Card 1: add Profile photo */}
    <TouchableOpacity style={{
      backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      padding: 16,
      width: 210,
      height: 210,
      marginTop: 12,
      marginRight: 12,
    }}>
      <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 64,
          height: 64,
          borderWidth: 2,
          borderColor: '#fff',
          backgroundColor: '#fff',
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Icon name="camera" size={28} color="red" />
        </View>
        <Text style={{
          fontWeight: '600',
          fontSize: 16,
          textAlign: 'center',
          color: isDarkMode ? '#fff' : '#000',
          marginBottom: 4,
        }}>Add Profile Photo</Text>
        <View style={{ flexDirection: 'column', marginTop: 4, alignItems: 'center' }}>
          <Text style={{
            fontWeight: '600',
            fontSize: 14,
            marginLeft: 8,
            color: isDarkMode ? '#fff' : '#000',
            textAlign: 'center',
          }}>Make it easier for people to</Text>
          <Text style={{
            fontWeight: '600',
            fontSize: 14,
            marginLeft: 8,
            marginTop: 2,
            color: isDarkMode ? '#fff' : '#000',
            textAlign: 'center',
          }}>find you</Text>
          <View style={{
            borderWidth: 1,
            borderColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 12,
            backgroundColor: '#fff',
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginTop: 8,
            height: 40,
            width: 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontWeight: '600',
              textAlign: 'center',
              color: isDarkMode ? '#111827' : '#000',
            }}>
              Add
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>

    {/* Card 2: Create Post */}
    <TouchableOpacity onPress={handlePosts} style={{
      backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      padding: 16,
      width: 210,
      height: 210,
      marginTop: 12,
      marginRight: 12,
    }}>
      <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 64,
          height: 64,
          borderWidth: 2,
          borderColor: '#fff',
          backgroundColor: '#fff',
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Icon name="create" size={28} color="red" />
        </View>
        <Text style={{
          fontWeight: '600',
          fontSize: 16,
          textAlign: 'center',
          color: isDarkMode ? '#fff' : '#000',
          marginBottom: 4,
        }}>Create Post</Text>
        <View style={{ flexDirection: 'column', marginTop: 4, alignItems: 'center' }}>
          <Text style={{
            fontWeight: '600',
            fontSize: 14,
            marginLeft: 8,
            color: isDarkMode ? '#fff' : '#000',
            textAlign: 'center',
          }}>Say what's on your mind or</Text>
          <Text style={{
            fontWeight: '600',
            fontSize: 14,
            marginLeft: 8,
            marginTop: 2,
            color: isDarkMode ? '#fff' : '#000',
            textAlign: 'center',
          }}>share a recent highlight</Text>
          <View style={{
            borderWidth: 1,
            borderColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 12,
            backgroundColor: '#fff',
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginTop: 8,
            height: 40,
            width: 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontWeight: '600',
              textAlign: 'center',
              color: isDarkMode ? '#111827' : '#000',
            }}>
              Create
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>

    {/* Card 3: Bio */}
    <TouchableOpacity style={{
      backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      padding: 16,
      width: 210,
      height: 210,
      marginTop: 12,
    }} onPress={handlebio}>
      <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 64,
          height: 64,
          borderWidth: 2,
          borderColor: '#fff',
          backgroundColor: '#fff',
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Icon name="pencil" size={28} color="red" />
        </View>
        <Text style={{
          fontWeight: '600',
          fontSize: 16,
          textAlign: 'center',
          color: isDarkMode ? '#fff' : '#000',
          marginBottom: 4,
        }}>Add Bio</Text>
        <View style={{ flexDirection: 'column', marginTop: 4, alignItems: 'center' }}>
          <Text style={{
            fontWeight: '600',
            fontSize: 14,
            marginLeft: 8,
            color: isDarkMode ? '#fff' : '#000',
            textAlign: 'center',
          }}>Introduce yourself and tell</Text>
          <Text style={{
            fontWeight: '600',
            fontSize: 14,
            marginLeft: 8,
            marginTop: 2,
            color: isDarkMode ? '#fff' : '#000',
            textAlign: 'center',
          }}>people what you're into</Text>
          <View style={{
            borderWidth: 1,
            borderColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: 12,
            backgroundColor: '#fff',
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginTop: 8,
            height: 40,
            width: 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontWeight: '600',
              textAlign: 'center',
              color: isDarkMode ? '#111827' : '#000',
            }}>
              Add
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  </ScrollView>
);

const renderThreads = () => {
  if (initialLoading) {
    return (
      <ScrollView>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </ScrollView>
    );
  }

  if (!posts || posts.length === 0) {
    return <ProfileCardsView />;
  }

  return (
    <AnimatedRN.FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={threadsKeyExtractor}
      onEndReached={loadMorePosts}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          progressViewOffset={10}
          colors={[isDarkMode ? '#ffffff' : '#000000']}
          tintColor={isDarkMode ? '#ffffff' : '#000000'}
        />
      }
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={() =>
          !initialLoading && <ProfileCardsView />
        }
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      getItemLayout={(data, index) => ({
        length: 150,
        offset: 150 * index,
        index,
      })}
      showsVerticalScrollIndicator={false}
    />
  );
};

const ListHeaderComponent = useCallback(() => (
  initialLoading ? (
    <ProfileHeaderSkeleton />
  ) : (
    <ProfileHeader 
      user={user} 
      activeTab={activeTab} 
 
      setActiveTab={setActiveTab} 
      navigation={navigation}
      followerData={followerData}
    />
  )
), [user, activeTab, navigation, followerData, initialLoading]);

const renderContent = () => {
  if (activeTab === 'replies') {
    return (
     
      <View style={{ flex: 1 }}>
        {/* Remove the static empty message and use the replies FlatList */}
        {renderReplies()}
      </View>
    );
  }
  return renderThreads();
};

const ListFooterComponent = useCallback(() => {
  if (isLoadingMore) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  if (!hasMore && posts.length > 0) {
    return (
      <View style={{ paddingVertical: 16 }}>
        <Text style={{ textAlign: 'center', color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
          No more posts to load
        </Text>
        {/* <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {totalPosts} total posts
        </Text> */}
      </View>
    );
  }

  // if (posts.length > 0 && hasMore) {
  //   return (
  //     <View className="py-2">
  //       <ActivityIndicator size="small" color="#666" />
  //       <Text className={`text-center text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
  //         Loading more posts...
  //       </Text>
  //     </View>
  //   );
  // }

  return null;
}, [isLoadingMore, hasMore, posts.length, totalPosts]);


return (  
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#fff',
    }}
    edges={['left', 'right', 'bottom']}
  >
    {/* Top Bar */}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
        backgroundColor: isDarkMode ? '#111827' : '#fff',
      }}
    >
      {/* Left side - Profile title */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginLeft: 8,
          color: isDarkMode ? '#fff' : '#000',
        }}
      >
        Profile
      </Text>
      
      {/* Right side - Menu icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Menu Icon */}
        <TouchableOpacity onPress={() => navigation.navigate('Community/profilesettings')}>
          <Icon name="ellipsis-vertical" size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
      </View>
    </View>

    {/* Main Content */}
    {activeTab === 'threads' ? (
      <AnimatedRN.FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={threadsKeyExtractor}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            progressViewOffset={10}
            colors={[isDarkMode ? '#ffffff' : '#000000']}
            tintColor={isDarkMode ? '#ffffff' : '#000000'}
          />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={() =>
          !initialLoading && <ProfileCardsView />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 150,
          offset: 150 * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
      />
    ) : (
      <AnimatedRN.FlatList
        data={repliesData}
        renderItem={({ item }) => (
          <ReplyItem post={item.post} comments={item.comments} onSaveUpdate={handleRepliesSaveUpdate} />
        )}
        keyExtractor={repliesKeyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={repliesRefreshing}
            onRefresh={handleRepliesRefresh}
            progressViewOffset={10}
            colors={[isDarkMode ? '#ffffff' : '#000000']}
            tintColor={isDarkMode ? '#ffffff' : '#000000'}
          />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={() => {
          // Show skeletons if loading and no replies yet (first page)
          if (repliesLoading && repliesData.length === 0) {
            return (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            );
          }
          // Show skeletons if loading more (pagination)
          if (repliesLoading && repliesPage > 1) {
            return (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            );
          }
          if (!repliesHasMore && repliesData.length > 0) {
            return (
              <View style={{ paddingVertical: 16 }}>
                <Text style={{ textAlign: 'center', color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  No more replies to load
                </Text>
              </View>
            );
          }
          if (repliesData.length > 0 && repliesHasMore) {
            return (
              <>
                <PostSkeleton />
                {/* <PostSkeleton /> */}
              </>
            );
          }
          return null;
        }}
        ListEmptyComponent={() =>
          !repliesLoading && (
            <View style={{ flex: 1, marginTop: 20 }}>
              <Text style={{ fontSize: 14, textAlign: 'center', marginTop: 12, color: isDarkMode ? '#9CA3AF' : '#4B5563' }}>
                You haven't posted any replies yet...
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        showsVerticalScrollIndicator={false}
      />
    )}
  </SafeAreaView>
  );
};



export default memo(Profile, (prevProps, nextProps) => {
  return false; // Default to always re-render for now
});

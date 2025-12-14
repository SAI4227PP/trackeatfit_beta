import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Image as ExpoImage } from 'expo-image'
import * as MediaLibrary from 'expo-media-library'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Clipboard, Dimensions, FlatList, Image, Linking, Modal, RefreshControl, ScrollView, Share, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { CommunitySSEClient } from '../../../utils/sseClient'
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import ViewShot from 'react-native-view-shot'
import { useGlobalContext } from '../../../context/GlobalProvider'
import { useTheme } from '../../../context/ThemeContext'
import analyticsService from '../../../utils/firebaseAnalytics'

const API_URL = "https://trackeatfit.onrender.com";

const PostSkeleton = () => {
  const { isDarkMode } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;

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
  }, [fadeAnim]);

  return (
    <View
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
        backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Animated.View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#E5E7EB',
            opacity: fadeAnim,
          }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Animated.View
            style={{
              width: '66%',
              height: 16,
              backgroundColor: '#E5E7EB',
              borderRadius: 6,
              marginBottom: 8,
              opacity: fadeAnim,
            }}
          />
          <Animated.View
            style={{
              width: '33%',
              height: 12,
              backgroundColor: '#E5E7EB',
              borderRadius: 6,
              opacity: fadeAnim,
            }}
          />
        </View>
      </View>
      <Animated.View
        style={{
          marginTop: 12,
          width: '100%',
          height: 160,
          backgroundColor: '#E5E7EB',
          borderRadius: 12,
          opacity: fadeAnim,
        }}
      />
    </View>
  );
};

const timeSince = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
      return "Invalid time";
  }
  const seconds = Math.floor((new Date() - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
};

const formatJoinDate = (dateString) => {
  if (!dateString) return "Unknown date";
  
  const date = new Date(dateString);
  if (isNaN(date)) return "Unknown date";
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month} ${year}`;
};

const ImageViewerModal = ({ visible, imageUrl, onClose, images, initialIndex = 0 }) => {
  const { isDarkMode } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { width: windowWidth } = Dimensions.get('window');
  
  useEffect(() => {
    translateX.setValue(0);
    setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const onPinchEvent = Animated.event([{
    nativeEvent: { scale: scale }
  }], { useNativeDriver: true });

  const onPanEvent = Animated.event([{
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
      Animated.spring(translateX, {
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
        <View
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 48,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              zIndex: 10,
            }}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              {`${currentIndex + 1}/${images.length}`}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={30}
                color={isDarkMode ? 'white' : 'black'}
              />
            </TouchableOpacity>
          </View>

          <PanGestureHandler
            onGestureEvent={onPanEvent}
            onHandlerStateChange={onPanHandlerStateChange}
          >
            <Animated.View style={{ flex: 1, justifyContent: 'center' }}>
              <PinchGestureHandler onGestureEvent={onPinchEvent}>
                <Animated.View
                  style={[
                    { width: '100%', height: '100%' },
                    animatedStyle,
                  ]}
                >
                  <ExpoImage
                    source={{ uri: images[currentIndex] }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>

          <View
            style={{
              position: 'absolute',
              bottom: 40,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
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
                      ? isDarkMode
                        ? '#fff'
                        : '#000'
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
  const { content, timestamp, profilename, uniqueName, profilepic, likesCount: initialLikesCount, isLiked: initialIsLiked, isSaved: initialIsSaved, _id, commentsCount, images } = props;
  const { isDarkMode } = useTheme();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const { width: screenWidth } = Dimensions.get('window');
  const { user } = useGlobalContext();
  const userId = user?.$id || user?._id;

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
      setModalVisible && setModalVisible(false);
      setPostMenuVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const handleSave = async () => {
    analyticsService.logEvent(isSaved ? 'unsave_post' : 'save_post', {
      postId: _id,
      userId,
      profilename,
      uniqueName,
    });
    try {
      const endpoint = isSaved ?
        `${API_URL}/saved-posts/unsave` :
        `${API_URL}/saved-posts/save`;

      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id,
          postId: _id
        }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        setPostMenuVisible(false);
      } else {
        const errorData = await response.json();
        console.error('Save action failed:', errorData.message);
        Alert.alert('Error', errorData.message || 'Failed to save post');
      }
    } catch (error) {
      console.error('Error handling save/unsave:', error);
      Alert.alert('Error', 'Failed to save post. Please try again.');
    }
  };

  const handleLike = async () => {
    analyticsService.logEvent(isLiked ? 'unlike_post' : 'like_post', {
      postId: _id,
      userId,
      profilename,
      uniqueName,
    });
    if (!userId) return;
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const endpoint = isLiked ?
        `${API_URL}/posts-likes/unlike` :
        `${API_URL}/posts-likes/like`;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          postId: _id,
          profilename: user?.username,
          uniqueName: user?.uniqueName,
          profilepic: user?.avatar || 'https://example.com/default-avatar.png'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleCommentPress = () => {
    navigation.navigate('PostDetails', { postId: _id });
  };
  const handleReport = () => {
    analyticsService.logEvent('report_post', {
      postId: _id,
      userId,
    });
    setPostMenuVisible(false);
    navigation.navigate('Community/report/ReportPost', {
      postId: _id,
      userName: profilename
    });
  };

  const handleDeletePost = () => {
    setPostMenuVisible(false);
    // Add delete functionality here
  };

  const handlePostMenu = () => {
    setPostMenuVisible(true);
  };

  const handleCopyLink = async () => {
    analyticsService.logEvent('copy_post_link', {
      postId: _id,
      userId,
    });
    const url = `https://trackeatfit.xyz/posts/${_id}`;
    Clipboard.setString(url);
    setPostMenuVisible(false);
  };

  const isContentLong = content && (content.length > 180 || (content.match(/\n/g) || []).length >= 4);

  const renderImages = () => {
    if (!images || images.length === 0) return null;

    const containerWidth = screenWidth - 32;
    const imageWidth = containerWidth * 0.74;

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: 0,
            flexDirection: 'row',
            gap: 16,
            paddingLeft: 0,
          }}
          contentContainerStyle={{
            gap: 16,
            paddingLeft: 0,
          }}
        >
          {images.slice(0, 6).map((imageUrl, index) => (
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
                  backgroundColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ActivityIndicator size="small" color="#0000ff" />
                </View>
                <ExpoImage
                  source={{ uri: imageUrl }}
                  style={{
                    width: imageWidth,
                    height: undefined,
                    aspectRatio: 16 / 9,
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
          images={images}
          initialIndex={selectedImage?.index || 0}
          onClose={() => setSelectedImage(null)}
        />
      </>
    );
  };

  const renderPostMenuModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={postMenuVisible}
      onRequestClose={() => setPostMenuVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setPostMenuVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <TouchableWithoutFeedback>
            <View style={{
              padding: 20,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: isDarkMode ? '#111827' : '#fff'
            }}>
              <View style={{
                width: 80,
                height: 6,
                alignSelf: 'center',
                backgroundColor: '#111',
                marginBottom: 16,
                marginTop: -8,
                borderRadius: 8,
                opacity: 0.15
              }} />
              <View style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 12,
                marginBottom: 8,
                overflow: 'hidden'
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#D1D5DB'
                  }}
                  onPress={handleSave}
                >
                  <Text style={{
                    marginLeft: 12,
                    flex: 1,
                    fontWeight: '500',
                    fontSize: 16,
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
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 12,
                  marginBottom: 8
                }}
                onPress={() => {
                  handleShare();
                  setPostMenuVisible(false);
                }}
              >
                <Text style={{
                  marginLeft: 12,
                  flex: 1,
                  fontWeight: '500',
                  fontSize: 16,
                  color: isDarkMode ? '#fff' : '#000'
                }}>Share</Text>
                <Ionicons name="share-social-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
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
                  color: isDarkMode ? '#fff' : '#000'
                }}>Copy Link</Text>
                <Ionicons name="link-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 12
                }}
                onPress={handleReport}
              >
                <Text style={{
                  marginLeft: 12,
                  flex: 1,
                  fontWeight: '500',
                  fontSize: 16,
                  color: isDarkMode ? '#fff' : '#000'
                }}>Report Post</Text>
                <Ionicons name="flag-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View style={{
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
      backgroundColor: isDarkMode ? '#111827' : '#fff'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#22C55E',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          marginRight: 12
        }}>
          <ExpoImage
            source={{ uri: profilepic || 'https://example.com/default-avatar.png' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000'
              }}>{profilename}</Text>
              <Text style={{ color: '#6B7280', marginLeft: 4 }}>
                {uniqueName ? `@${uniqueName}` : `@${profilename.toLowerCase()}`}
              </Text>
              <Text style={{ color: '#6B7280', marginLeft: 4 }}>
                · {timeSince(new Date(timestamp))} ago
              </Text>
            </View>
            <TouchableOpacity onPress={handlePostMenu}>
              <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => {
            navigation.navigate('posts/[id]', { id: _id });
          }}>
            <Text style={{
              fontSize: 16,
              marginTop: 4,
              fontWeight: '400',
              color: isDarkMode ? '#fff' : '#000'
            }}>
              {
                isContentLong && !showFullContent
                  ? `${content.slice(0, 180).replace(/\n/g, ' ')}... `
                  : content
              }
              {
                isContentLong &&
                <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>show more</Text>
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {images && images.length > 0 && (
        <View style={{ marginLeft: 32, marginTop: 8 }}>
          {renderImages()}
        </View>
      )}
      <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 8 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginRight: 12 }} onPress={handleLike}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "red" : isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }} onPress={handleCommentPress}>
          <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleSave}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
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
      {renderPostMenuModal()}
    </View>
  );
});

const ProfileHeaderSkeleton = () => {
  const { isDarkMode } = useTheme();
  const bgColor = isDarkMode ? '#374151' : '#E5E7EB'; // gray-700 / gray-200
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Profile Image Skeleton */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: bgColor,
            opacity: 0.7,
            marginRight: 16,
          }}
        />
        <View style={{ flex: 1 }}>
          {/* Username Skeleton */}
          <View
            style={{
              width: 128,
              height: 24,
              backgroundColor: bgColor,
              borderRadius: 6,
              marginBottom: 8,
              opacity: 0.7,
            }}
          />
          {/* Handle Skeleton */}
          <View
            style={{
              width: 96,
              height: 16,
              backgroundColor: bgColor,
              borderRadius: 6,
              opacity: 0.7,
            }}
          />
        </View>
      </View>

      {/* Bio Skeleton */}
      <View
        style={{
          width: '100%',
          height: 16,
          backgroundColor: bgColor,
          borderRadius: 6,
          marginTop: 16,
          marginBottom: 8,
          opacity: 0.7,
        }}
      />
      <View
        style={{
          width: '75%',
          height: 16,
          backgroundColor: bgColor,
          borderRadius: 6,
          marginBottom: 16,
          opacity: 0.7,
        }}
      />

      {/* Stats Section Skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
        {/* Posts Count Skeleton */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 24,
              backgroundColor: bgColor,
              borderRadius: 6,
              marginBottom: 4,
              opacity: 0.7,
            }}
          />
          <View
            style={{
              width: 48,
              height: 16,
              backgroundColor: bgColor,
              borderRadius: 6,
              opacity: 0.7,
            }}
          />
        </View>
        {/* Followers Count Skeleton */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 24,
              backgroundColor: bgColor,
              borderRadius: 6,
              marginBottom: 4,
              opacity: 0.7,
            }}
          />
          <View
            style={{
              width: 64,
              height: 16,
              backgroundColor: bgColor,
              borderRadius: 6,
              opacity: 0.7,
            }}
          />
        </View>
        {/* Following Count Skeleton */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 24,
              backgroundColor: bgColor,
              borderRadius: 6,
              marginBottom: 4,
              opacity: 0.7,
            }}
          />
          <View
            style={{
              width: 64,
              height: 16,
              backgroundColor: bgColor,
              borderRadius: 6,
              opacity: 0.7,
            }}
          />
        </View>
      </View>

      {/* Follow Button Skeleton */}
      <View
        style={{
          marginTop: 24,
          width: '100%',
          height: 40,
          backgroundColor: bgColor,
          borderRadius: 999,
          opacity: 0.7,
        }}
      />

      {/* Tab Bar Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 24,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <View
          style={{
            flex: 1,
            paddingBottom: 12,
            borderBottomWidth: 2,
            borderBottomColor: borderColor,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 64,
              height: 16,
              backgroundColor: bgColor,
              borderRadius: 6,
              opacity: 0.7,
            }}
          />
        </View>
        <View style={{ flex: 1, paddingBottom: 12, alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 16,
              backgroundColor: bgColor,
              borderRadius: 6,
              opacity: 0.7,
            }}
          />
        </View>
      </View>
    </View>
  );
};

const ProfileHeader = ({
  userData,
  isDarkMode,
  activeTab,
  setActiveTab,
  isFollowing,
  onToggleFollow,
  isLoading,
  isOwnProfile,
  navigation,
}) => (
  <View
    style={{
      padding: 16,
    }}
  >
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text
          style={{
            color: isDarkMode ? '#fff' : '#000',
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          {userData?.username}
        </Text>
        <Text style={{ color: '#6B7280' }}>@{userData?.uniqueName}</Text>
        {/* {userData?.isMutualFollow && !isOwnProfile && (
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sync-circle-outline" size={14} color={isDarkMode ? "#a0a0a0" : "#666666"} />
            <Text style={{ color: '#22C55E', marginLeft: 4 }}>Follows you</Text>
          </View>
        )} */}
        <Text
          style={{
            color: isDarkMode ? '#D1D5DB' : '#6B7280',
            marginTop: 8,
          }}
        >
          {userData?.bio || 'No bio yet'}
        </Text>
        {/* Profile Link Row (below bio, if present) */}
        {userData?.link ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => {
                let url = userData.link;
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
                {userData.link}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={isDarkMode ? '#a0a0a0' : '#666666'}
          />
          <Text style={{ color: '#6B7280', marginLeft: 4 }}>
            Joined {formatJoinDate(userData?.createdAt)}
          </Text>
        </View>
      </View>
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
          source={{
            uri: userData?.avatar || 'https://example.com/default-avatar.png',
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    </View>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            color: isDarkMode ? '#fff' : '#000',
            fontWeight: 'bold',
          }}
        >
          {typeof userData?.postsCount === 'number' ? userData.postsCount : '0'}
        </Text>
        <Text style={{ color: '#6B7280' }}>Posts</Text>
      </View>
      <TouchableOpacity
        style={{ alignItems: 'center' }}
        onPress={() =>
          navigation.navigate('Home/friends/FollowersPage', {
            userId: userData?._id,
            type: 'followers',
            viewSource: 'community',
          })
        }
      >
        <Text
          style={{
            color: isDarkMode ? '#fff' : '#000',
            fontWeight: 'bold',
          }}
        >
          {userData?.followersCount || 0}
        </Text>
        <Text style={{ color: '#6B7280' }}>Followers</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ alignItems: 'center' }}
        onPress={() =>
          navigation.navigate('Home/friends/FollowersPage', {
            userId: userData?._id,
            type: 'following',
            viewSource: 'community',
          })
        }
      >
        <Text
          style={{
            color: isDarkMode ? '#fff' : '#000',
            fontWeight: 'bold',
          }}
        >
          {userData?.followingCount || 0}
        </Text>
        <Text style={{ color: '#6B7280' }}>Following</Text>
      </TouchableOpacity>
    </View>
    {!isOwnProfile && (
      <TouchableOpacity
        style={{
          marginTop: 24,
          backgroundColor: isFollowing
            ? isDarkMode
              ? '#374151'
              : '#E5E7EB'
            : isDarkMode
            ? '#fff'
            : '#000',
          borderWidth: 1,
          borderColor: isFollowing
            ? isDarkMode
              ? '#6B7280'
              : '#D1D5DB'
            : 'transparent',
          paddingVertical: 8,
          borderRadius: 999,
        }}
        onPress={onToggleFollow}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={
              isDarkMode
                ? isFollowing
                  ? '#fff'
                  : '#000'
                : isFollowing
                ? '#000'
                : '#fff'
            }
          />
        ) : (
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '600',
              color: isFollowing
                ? isDarkMode
                  ? '#fff'
                  : '#000'
                : isDarkMode
                ? '#000'
                : '#fff',
            }}
          >
            {userData?.isMutualFollow && isFollowing
              ? 'Following Each Other'
              : isFollowing
              ? 'Following'
              : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    )}
    <View
      style={{
        flexDirection: 'row',
        marginTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
      }}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          paddingBottom: 12,
          borderBottomWidth: activeTab === 'posts' ? 2 : 0,
          borderBottomColor: activeTab === 'posts'
            ? isDarkMode
              ? '#fff'
              : '#000'
            : 'transparent',
          alignItems: 'center',
        }}
        onPress={() => setActiveTab('posts')}
      >
        <Text
          style={{
            textAlign: 'center',
            fontWeight: '600',
            color:
              activeTab === 'posts'
                ? isDarkMode
                  ? '#fff'
                  : '#000'
                : isDarkMode
                ? '#9CA3AF'
                : '#6B7280',
          }}
        >
          Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          flex: 1,
          paddingBottom: 12,
          borderBottomWidth: activeTab === 'replies' ? 2 : 0,
          borderBottomColor: activeTab === 'replies'
            ? isDarkMode
              ? '#fff'
              : '#000'
            : 'transparent',
          alignItems: 'center',
        }}
        onPress={() => setActiveTab('replies')}
      >
        <Text
          style={{
            textAlign: 'center',
            fontWeight: '600',
            color:
              activeTab === 'replies'
                ? isDarkMode
                  ? '#fff'
                  : '#000'
                : isDarkMode
                ? '#9CA3AF'
                : '#6B7280',
          }}
        >
          Replies
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const UserProfile = () => {
  const { uniqueName, qrCode } = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();  
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { user } = useGlobalContext();
  const [error, setError] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Add these for replies tab logic
  const [repliesData, setRepliesData] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesRefreshing, setRepliesRefreshing] = useState(false);
  const eventSourceRepliesRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };
  const handleReportUser = () => {
    analyticsService.logEvent('report_user', {
      userId: userData?._id,
      reporterId: user?._id,
    });
    setMenuModalVisible(false);
    navigation.navigate('Community/report/ReportPost', { 
      postId: userData?._id,
      isUserReport: 'true',
      userName: userData?.username 
    });
  };

  const handleShowQRCode = () => {
    analyticsService.logEvent('share_profile_qr', {
      userId: userData?._id,
      uniqueName: userData?.uniqueName,
    });
    toggleMenu();
    setShowQRCode(true);
  };

  // Handle follow/unfollow action
  const handleToggleFollow = async () => {
    analyticsService.logEvent(isFollowing ? 'unfollow_user' : 'follow_user', {
      followerId: user?._id,
      followingId: userData?._id,
      uniqueName: userData?.uniqueName,
    });
    if (!user?._id || !userData?._id) {
      console.log('Missing user IDs for follow operation');
      return;
    }
    if (user._id === userData._id) {
      console.error("Users cannot follow themselves");
      Alert.alert('Error', 'You cannot follow your own profile');
      return;
    }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const endpoint = isFollowing 
        ? `${API_URL}/api/following/unfollow`
        : `${API_URL}/api/following/follow`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          followerId: user._id,
          followingId: userData._id
        })
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setUserData(prev => ({
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1,
          isMutualFollow: !isFollowing && prev.isMutualFollow
        }));
      } else {
        const errorData = await response.json();
        console.error('Follow action failed:', errorData.message);
        Alert.alert('Error', errorData.message || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };
  const fetchUserData = async () => {
    try {
      let userUniqueName = uniqueName;
      if (qrCode && !uniqueName) {
        try {
          const parsedData = JSON.parse(qrCode);
          userUniqueName = parsedData.uniqueName || parsedData.username;
        } catch (error) {
          console.error('Error parsing QR data:', error);
          setError('Invalid QR code data');
          return null;
        }
      }
      if (!userUniqueName) {
        setError('No username provided');
        return null;
      }
      const response = await fetch(`${API_URL}/UserSearch/user/${userUniqueName}?currentUserId=${user?._id || ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setIsFollowing(data.followStatus?.isFollowing || false);
      const formattedUserData = {
        _id: data._id,
        username: data.username || '',
        uniqueName: data.uniqueName || '',
        avatar: data.avatar || 'https://example.com/default-avatar.png',
        bio: data.bio || '',
        link: data.link || '',
        postsCount: data.stats?.postsCount || data.postsCount || 0,
        followersCount: data.stats?.followersCount || data.followersCount || 0,
        followingCount: data.stats?.followingCount || data.followingCount || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        level: data.level || 1,
        exerciseTypes: data.exerciseTypes || [],
        isMutualFollow: data.followStatus?.isMutual || false
      };
      setUserData(formattedUserData);
      return formattedUserData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user profile');
      return null;
    }
  };
  const fetchUserPosts = async (pageNum = 1, userData) => {
    if (!userData || !userData._id) return;
    try {      
      const response = await fetch(
        `${API_URL}/posts/user/${userData._id}?page=${pageNum}&limit=12&currentUserId=${user?._id || ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setUserData(prev => ({
        ...prev,
        postsCount: data.totalPosts || prev.postsCount || data.posts.length,
        followersCount: data.userStats?.followersCount || prev.followersCount,
        followingCount: data.userStats?.followingCount || prev.followingCount
      }));
      setHasMore(data.hasMore);
      setPage(data.currentPage + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };
  const fetchReplies = React.useCallback(async () => {
    if (!userData?._id) return;
    setRepliesLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/comments/comments-by-user/${userData._id}?currentuserId=${user?._id || user?.$id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRepliesData(data.posts || []);
      } else {
        setRepliesData([]);
      }
    } catch (e) {
      setRepliesData([]);
    } finally {
      setRepliesLoading(false);
    }
  }, [userData, user]);

  useEffect(() => {
    if (activeTab === 'replies' && userData?._id) {
      fetchReplies();
    }
  }, [activeTab, userData, fetchReplies]);

  const handleRepliesRefresh = React.useCallback(async () => {
    setRepliesRefreshing(true);
    await fetchReplies();
    setRepliesRefreshing(false);
  }, [fetchReplies]);

  useEffect(() => {
    if (!userData?._id) return;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    if (eventSourceRepliesRef.current) {
      eventSourceRepliesRef.current.close();
      eventSourceRepliesRef.current = null;
    }
    const wsReplies = CommunitySSEClient.getInstance({
      userId: user?.id || user?._id || user?.$id || 'guest',
      clientType: `replies-${userData._id}`,
      debugLabel: `UserProfileReplies-${userData._id}`,
      onPosts: null,
      onLike: null,
      onSaved: null,
      onComment: (data, eventType) => {
        try {
          if (!data) return;
          if (data.type === 'likeUpdate' && data.postId && data.post) {
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
          if (data.type === 'delete' && data.commentId && data.userId === userData._id) {
            setRepliesData(prevReplies =>
              prevReplies
                .map(item => ({
                  ...item,
                  comments: item.comments.filter(c => c._id !== data.commentId)
                }))
                .filter(item => item.comments.length > 0 || item.post)
            );
            return;
          }
          if (!data.comment || (data.comment.userId !== userData._id && data.userId !== userData._id)) return;
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
              default:
                break;
            }
            return updated;
          });
        } catch (err) {
          console.error('Replies SSE error:', err);
        }
      },
      onError: (error) => {
        reconnectAttempts++;
        if (reconnectAttempts <= maxReconnectAttempts) {
          setTimeout(() => wsReplies.connect(), 5000 * Math.pow(2, reconnectAttempts));
        }
      },
      onOpen: () => {
        reconnectAttempts = 0;
      }
    });

    wsReplies.connect();
    eventSourceRepliesRef.current = wsReplies;

    return () => {
      if (eventSourceRepliesRef.current) {
        eventSourceRepliesRef.current.close();
        eventSourceRepliesRef.current = null;
      }
    };
  }, [userData]);

  const ReplyItem = React.useMemo(() => memo(({ post, comments }) => {
    const { isDarkMode } = useTheme();
    const navigation = useNavigation();
    const { user } = useGlobalContext();
    const [commentMenuId, setCommentMenuId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteComment = async (commentId) => {
      if (!commentId) return;
      setDeleting(true);
      try {
        const response = await fetch(
          `${API_URL}/comments/delete/${commentId}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?._id || user?.$id,
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setCommentMenuId(null);
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

    const CommentLikeButton = React.useCallback(({ commentId, initialLikesCount = 0, initialIsLiked }) => {
      const [isCommentLiked, setIsCommentLiked] = useState(initialIsLiked);
      const [commentLikesCount, setCommentLikesCount] = useState(Number(initialLikesCount) || 0);
      const userId = user?._id || user?.$id;
      const handleLikePress = useCallback(async () => {
      const previousLikeState = isCommentLiked;
      const previousCount = commentLikesCount;
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
        const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
        });
        if (!response.ok) {
        setIsCommentLiked(previousLikeState);
        setCommentLikesCount(previousCount);
        throw new Error('Failed to update like status');
        }
      } catch (error) {
        setIsCommentLiked(previousLikeState);
        setCommentLikesCount(previousCount);
      }
      }, [isCommentLiked, commentLikesCount, userId, commentId, user]);
      return (
      <TouchableOpacity
        style={{
        flexDirection: 'row',
        alignItems: 'center',
        }}
        onPress={handleLikePress}
      >
        <Ionicons
        name={isCommentLiked ? "heart" : "heart-outline"}
        size={24}
        color={isCommentLiked ? "#FF0000" : isDarkMode ? "#FFFFFF" : "#000000"}
        style={{ marginRight: 2 }}
        />
        <Text style={{
        marginLeft: 4,
        color: isDarkMode ? '#fff' : '#000'
        }}>{commentLikesCount}</Text>
      </TouchableOpacity>
      );
    }, [user]);

    return (
      <View style={{ marginBottom: 32, paddingHorizontal: 16 }}>
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
        />
      )}
      {comments && comments.length > 0 && (
        <View style={{ marginTop: 8 }}>
        <Text
          style={{
          marginBottom: 8,
          marginLeft: 16,
          fontWeight: '600',
          fontSize: 13,
          color: '#22C55E',
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
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: '#22C55E',
            backgroundColor: isDarkMode ? '#111827' : '#fff',
            opacity: 0.95,
            shadowColor: isDarkMode ? '#111' : '#aaa',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
          >
          <Image
            source={{
            uri: comment.profilepic || 'https://example.com/default-avatar.png',
            }}
            style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 12,
            marginTop: 4,
            borderWidth: 1,
            borderColor: '#22C55E',
            backgroundColor: isDarkMode ? '#222' : '#f5f5f5',
            }}
          />
          <View style={{ flex: 1 }}>
            <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
              justifyContent: 'space-between',
            }}
            >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: '600', color: isDarkMode ? '#fff' : '#000' }}>
              {comment.profilename}
              </Text>
              <Text style={{ marginLeft: 8, fontSize: 12, color: '#9CA3AF' }}>
              @{comment.uniqueName}
              </Text>
              <Text style={{ marginLeft: 8, fontSize: 12, color: '#9CA3AF' }}>
              · {timeSince(new Date(comment.timestamp))} ago
              </Text>
            </View>
            </View>
            <View
            style={{
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
            }}
            >
            <Text style={{ fontSize: 16, color: isDarkMode ? '#F3F4F6' : '#000' }}>
              {comment.content}
            </Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <CommentLikeButton
              commentId={comment._id}
              initialLikesCount={comment.likesCount}
              initialIsLiked={comment.isLiked}
            />
            </View>
          </View>
          </View>
        ))}
        </View>
      )}
      </View>
    );
  }), []);

  const loadMore = async () => {
    if (!isLoadingMore && hasMore && userData) {
      setIsLoadingMore(true);
      await fetchUserPosts(page, userData);
      setIsLoadingMore(false);
    }
  };

  const renderRepliesTab = () => {
    if (repliesLoading) {
      return (
        <View>
          <PostSkeleton />
          <PostSkeleton />
        </View>
      );
    }
    if (!repliesData || repliesData.length === 0) {
      return (
        <View style={{ flex: 1, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 14,
              textAlign: 'center',
              marginTop: 12,
              color: isDarkMode ? '#9CA3AF' : '#4B5563',
            }}
          >
            No replies yet
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={repliesData}
        renderItem={({ item }) => (
          <ReplyItem post={item.post} comments={item.comments} />
        )}
        keyExtractor={item => String(item.post?._id || Math.random())}
        refreshControl={
          <RefreshControl
            refreshing={repliesRefreshing}
            onRefresh={handleRepliesRefresh}
            progressViewOffset={10}
          />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    );
  };

  const renderPostsTab = () => (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={item => item._id || item.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={{ padding: 16 }}>
          <Text style={{
            textAlign: 'center',
            color: isDarkMode ? '#9CA3AF' : '#4B5563',
          }}>
            No posts yet
          </Text>
        </View>
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={{ paddingVertical: 16 }}>
            <PostSkeleton />
            <PostSkeleton />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 16 }}
    />
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{
            textAlign: 'center',
            color: isDarkMode ? '#fff' : '#000'
          }}>
            {error}
          </Text>
          <TouchableOpacity 
            style={{
              marginTop: 16,
              backgroundColor: '#22C55E',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }}
            onPress={handleRefresh}
          >
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (isLoading) {
      return (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={item => item.toString()}
          ListHeaderComponent={<ProfileHeaderSkeleton />}
          renderItem={() => <PostSkeleton />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }
    if (activeTab === 'posts') {
      return (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={item => item._id || item.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <ProfileHeader
              userData={userData}
              isDarkMode={isDarkMode}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isFollowing={isFollowing}
              onToggleFollow={handleToggleFollow}
              isLoading={followLoading}
              isOwnProfile={user?._id === userData?._id}
              navigation={navigation}
            />
          }
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{
                textAlign: 'center',
                color: isDarkMode ? '#9CA3AF' : '#4B5563'
              }}>No posts yet</Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <PostSkeleton />
                <PostSkeleton />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else {
      if (repliesLoading) {
        return (
          <FlatList
            data={[1, 2]}
            keyExtractor={item => item.toString()}
            ListHeaderComponent={
              <ProfileHeader
                userData={userData}
                isDarkMode={isDarkMode}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isFollowing={isFollowing}
                onToggleFollow={handleToggleFollow}
                isLoading={followLoading}
                isOwnProfile={user?._id === userData?._id}
                navigation={navigation}
              />
            }
            renderItem={() => <PostSkeleton />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          />
        );
      }
      return (
        <FlatList
          data={repliesData}
          renderItem={({ item }) => (
            <ReplyItem post={item.post} comments={item.comments} />
          )}
          keyExtractor={item => String(item.post?._id || Math.random())}
          refreshControl={
            <RefreshControl
              refreshing={repliesRefreshing}
              onRefresh={handleRepliesRefresh}
              progressViewOffset={10}
            />
          }
          ListHeaderComponent={
            <ProfileHeader
              userData={userData}
              isDarkMode={isDarkMode}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isFollowing={isFollowing}
              onToggleFollow={handleToggleFollow}
              isLoading={followLoading}
              isOwnProfile={user?._id === userData?._id}
              navigation={navigation}
            />
          }
          ListEmptyComponent={
            <View style={{ flex: 1, marginTop: 20 }}>
              <Text style={{
                fontSize: 14,
                textAlign: 'center',
                marginTop: 12,
                color: isDarkMode ? '#9CA3AF' : '#4B5563'
              }}>No replies yet</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        />
      );
    }
  };

  const renderMenuModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={menuModalVisible}
      onRequestClose={() => setMenuModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setMenuModalVisible(false)}>
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: isDarkMode ? 'rgba(17,24,39,0.7)' : 'rgba(255,255,255,0.7)'
        }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{
              padding: 20,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: isDarkMode ? '#111827' : '#fff'
            }}>
              <View style={{
                width: 80,
                height: 6,
                alignSelf: 'center',
                backgroundColor: isDarkMode ? '#111' : '#ccc',
                marginBottom: 16,
                marginTop: -8,
                borderRadius: 8,
                opacity: 0.15
              }} />
              <View style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 12,
                marginBottom: 8,
                overflow: 'hidden'
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#D1D5DB'
                  }}
                  onPress={handleShowQRCode}
                >
                  <Text style={{
                    marginLeft: 12,
                    flex: 1,
                    fontWeight: '500',
                    fontSize: 16,
                    color: isDarkMode ? '#fff' : '#000'
                  }}>Share QR Code</Text>
                  <Ionicons name="qr-code-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }}/>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12
                  }}
                  onPress={() => {
                    const url = `https://trackeatfit.xyz/posts/UserProfile/${user?.uniqueName || user?.username || 'guest'}`;
                    Clipboard.setString(url);
                    setMenuModalVisible(false);
                    Alert.alert('Link Copied', 'The profile link has been copied to your clipboard.');
                  }}
                >
                  <Text style={{
                    marginLeft: 12,
                    flex: 1,
                    fontWeight: '500',
                    fontSize: 16,
                    color: isDarkMode ? '#fff' : '#000'
                  }}>Copy Profile Link</Text>
                  <Ionicons name="link-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 12
                }}
                onPress={handleReportUser}
              >
                <Text style={{
                  marginLeft: 12,
                  flex: 1,
                  fontWeight: '500',
                  fontSize: 16,
                  color: 'red'
                }}>Report User</Text>
                <Ionicons name="flag-outline" size={24} color="red" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const qrSvgRef = useRef();
  const viewShotRef = useRef();

  const shareQRCode = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
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

  const saveQRCode = async () => {
    try {
      if (viewShotRef.current) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Need permission to save QR code');
          return;
        }
        const uri = await viewShotRef.current.capture();
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('TrackEatFit', asset, false);
        Alert.alert('Success', 'QR Code saved to gallery');
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

  const renderQRCodeModal = () => (
    <Modal
      transparent={true}
      visible={showQRCode}
      animationType="slide"
      onRequestClose={() => setShowQRCode(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: isDarkMode ? '#111827' : '#fff'
      }}>
        <SafeAreaView edges={['top']}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#D1D5DB'
          }}>
            <TouchableOpacity onPress={() => setShowQRCode(false)}>
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
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24
        }}>
          <View style={{ width: '100%', maxWidth: 400 }}>
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
                backgroundColor: isDarkMode ? '#fff' : '#F3F4F6',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 }
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontWeight: 'bold',
                    fontSize: 18,
                    color: '#000',
                    marginBottom: 12
                  }}>TrackEatFit</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
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
                        source={{ uri: userData?.avatar || 'https://example.com/default-avatar.png' }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                    <Text style={{
                      color: '#000',
                      fontWeight: '500'
                    }}>
                      @{userData?.uniqueName || 'guest'}
                    </Text>
                  </View>
                  <QRCode
                    value={`https://trackeatfit.xyz/posts/UserProfile/${userData?.uniqueName || userData?.username || 'guest'}`}
                    size={250}
                    color="black"
                    backgroundColor="white"
                    logo={{ uri: userData?.avatar || 'https://example.com/default-avatar.png' }}
                    logoSize={60}
                    logoBackgroundColor="white"
                    logoMargin={5}
                    logoBorderRadius={30}
                    getRef={(c) => (qrSvgRef.current = c)}
                  />
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
            <Text style={{
              textAlign: 'center',
              marginTop: 32,
              marginBottom: 8,
              fontSize: 16,
              color: isDarkMode ? '#D1D5DB' : '#4B5563'
            }}>
              People can scan this code to visit your profile
            </Text>
            <Text style={{
              textAlign: 'center',
              marginBottom: 32,
              fontSize: 13,
              color: isDarkMode ? '#9CA3AF' : '#6B7280'
            }}>
              Your QR code is unique to your account
            </Text>
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginTop: 16,
                backgroundColor: isDarkMode ? '#1F2937' : '#E5E7EB'
              }}
              onPress={saveQRCode}
            >
              <Ionicons name="download-outline" size={22} color={isDarkMode ? "white" : "black"} style={{marginRight: 8}} />
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
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const userDataFetched = await fetchUserData();
      if (userDataFetched) {
        await fetchUserPosts(1, userDataFetched);
      }
      if (activeTab === 'replies' && userDataFetched?._id) {
        await fetchReplies();
      }
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userDataFetched = await fetchUserData();
        if (userDataFetched) {
          await fetchUserPosts(1, userDataFetched);
        }
        if (activeTab === 'replies' && userDataFetched?._id) {
          await fetchReplies();
        }
      } catch (e) {
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [uniqueName, qrCode]);

  const renderItem = ({ item }) => (
    <Thread
      content={item.content}
      timestamp={item.timestamp}
      profilename={item.profilename}
      uniqueName={item.uniqueName}
      profilepic={item.profilepic}
      likesCount={item.likesCount}
      isLiked={item.isLiked}
      isSaved={item.isSaved}
      _id={item._id}
      commentsCount={item.commentsCount}
      images={item.images}
    />
  );

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#fff'
    }}>      
      <View style={{
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#111827' : '#fff'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setMenuModalVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
      {renderContent()}
      {renderMenuModal()}
      {renderQRCodeModal()}
    </SafeAreaView>
  );
};

export default UserProfile
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Clipboard, Dimensions, FlatList, Modal, PanResponder, RefreshControl, ScrollView, Share, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';
import analyticsService from '../../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";


const timeSince = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return "Invalid time";
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

// ImageViewerModal copied and adapted from all_news.jsx
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
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#fff' }}>
          <View style={{
            position: 'absolute',
            top: 48,
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            zIndex: 10
          }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
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
            <Animated.View style={{ flex: 1, justifyContent: 'center' }}>
              <PinchGestureHandler
                onGestureEvent={onPinchEvent}
              >
                <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
                  <Image
                    source={images[currentIndex]}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
          {/* Navigation dots */}
          <View style={{
            position: 'absolute',
            bottom: 40,
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  marginHorizontal: 4,
                  backgroundColor: index === currentIndex
                    ? (isDarkMode ? '#fff' : '#000')
                    : '#6b7280'
                }}
              />
            ))}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const Thread = memo(({ content, timestamp, profilename, uniqueName, profilepic, postId, commentsCount, images, isLiked: initialIsLiked, likesCount: initialLikesCount, isFollowing: initialIsFollowing, isSaved: initialIsSaved, userId: postUserId, onUnlike }) => {
  const { isDarkMode } = useTheme();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(Number(initialLikesCount) || 0);
  const [dragDistance, setDragDistance] = useState(0);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [selectedImage, setSelectedImage] = useState(null);
  // Add for show more/less
  const [showFullContent, setShowFullContent] = useState(false);
  const { width: screenWidth } = Dimensions.get('window');
  const { user } = useGlobalContext();
  const userId = user?.$id || user?._id;
  const navigation = useNavigation();

  // Fix: Only attach panResponder to the modal, not to the TouchableOpacity for menu icon
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't intercept touches outside modal
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: (e, gestureState) => setDragDistance(gestureState.dy),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100) setModalVisible(false);
        setDragDistance(0);
      },
    })
  ).current;

  const toggleModal = () => setModalVisible((prev) => !prev);

  // Optimistic Save/Unsave Handler (just toggle icon, do not remove from list)
  const handleSave = async () => {
    analyticsService.logEvent(isSaved ? 'unsave_post' : 'save_post', {
      postId,
      userId,
      profilename,
      uniqueName,
    });
    // Optimistically update UI for save/unsave
    setIsSaved(prev => !prev);
    try {
      const endpoint = isSaved ?
        `${API_URL}/saved-posts/unsave` :
        `${API_URL}/saved-posts/save`;
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, postId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to save post');
        // Revert optimistic update if failed
        setIsSaved(prev => !prev);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save post. Please try again.');
      // Revert optimistic update if error
      setIsSaved(prev => !prev);
    }
  };

  // Optimistic Like Handler (match Profile.jsx)
  const handleLike = async () => {
    analyticsService.logEvent(isLiked ? 'unlike_post' : 'like_post', {
      postId,
      userId,
      profilename,
      uniqueName,
    });
    // Optimistic update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    // If unliking in liked posts, remove from UI immediately
    if (!newIsLiked && onUnlike) {
      onUnlike(postId);
    }

    try {
      const endpoint = newIsLiked
        ? `${API_URL}/posts-likes/like`
        : `${API_URL}/posts-likes/unlike`;
      const method = newIsLiked ? 'POST' : 'DELETE';
      const body = {
        userId,
        postId,
        ...(method === 'POST' && { profilename, profilepic, uniqueName })
      };
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        // Revert optimistic update if failed
        setIsLiked(!newIsLiked);
        setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'Failed to update like. Please try again.');
      } else {
        // Optionally update with server count
        const result = await response.json();
        setLikesCount(Number(result.likesCount) || 0);
      }
    } catch (error) {
      // Revert optimistic update if error
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const handleCommentPress = () => {
    analyticsService.logEvent('view_comments', {
      postId,
      userId,
    });
    navigation.navigate('posts/[id]', { id: postId });
  };

  // Replace renderImages with modal logic
  const renderImages = () => {
    if (!images || images.length === 0) return null;
    const containerWidth = screenWidth - 32;
    const imageWidth = containerWidth * 0.74;
    return (
      <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingLeft: 0, marginTop: 0 }}
      >
        {images.slice(0, 6).map((imageUrl, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedImage({ url: imageUrl, index })}
            style={{
              maxWidth: imageWidth,
              borderRadius: 15,
              overflow: 'hidden',
              marginLeft: 0,
            }}
          >
            <View>
              <View style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundColor: '#e5e7eb',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ActivityIndicator size="small" color="#0000ff" />
              </View>
              <Image
                source={imageUrl}
                style={{
                  width: imageWidth,
                  height: undefined,
                  aspectRatio: 16/9,
                  borderRadius: 15,
                  overflow: 'hidden',
                }}
                contentFit="cover"
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {selectedImage && (
        <ImageViewerModal
          visible={!!selectedImage}
          imageUrl={selectedImage?.url}
          images={images}
          initialIndex={selectedImage?.index || 0}
          onClose={() => setSelectedImage(null)}
        />
      )}
      </>
    );
  };

  const handleFollowAction = async () => {
    analyticsService.logEvent(isFollowing ? 'unfollow_user' : 'follow_user', {
      followerId: userId,
      followingId: postUserId,
      postId,
      uniqueName,
    });
    if (userId === postUserId) {
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
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: userId, followingId: postUserId })
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
        toggleModal();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update follow status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = () => {
    analyticsService.logEvent('report_post', {
      postId,
      userId,
    });
    toggleModal();
    navigation.navigate('Community/report/ReportPost', { postId });
  };

  const handleCopyLink = async () => {
    analyticsService.logEvent('copy_post_link', {
      postId,
      userId,
    });
    const url = `https://trackeatfit.xyz/posts/${postId}`;
    Clipboard.setString(url);
    setModalVisible(false);
    // Optionally, show a toast or alert if desired
    // Alert.alert('Link Copied', 'The post link has been copied to your clipboard.');
  };

  // Share handler for modal
  const createShareableLink = (postId) => {
    return `https://trackeatfit.xyz/posts/${postId}`;
  };

  const handleShare = async () => {
    analyticsService.logEvent('share_post', {
      postId,
      userId,
    });
    try {
      const link = createShareableLink(postId);
      await Share.share({
        message: link,
        url: link,
        title: 'Check out this post'
      });
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share post');
    }
  };

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  // Helper to determine if content is long
  const isContentLong = content && (content.length > 180 || (content.match(/\n/g) || []).length >= 4);

  return (
    <View style={{
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
      backgroundColor: isDarkMode ? '#111827' : '#fff'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderWidth: 1,
            borderColor: '#16a34a',
            borderRadius: 9999,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            marginRight: 12
          }}
          onPress={() => navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName })}
        >
          <Image
            source={profilepic || 'https://example.com/default-avatar.png'}
            style={{ width: '100%', height: '100%', borderRadius: 999 }}
            contentFit="cover"
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#000' }}>{profilename}</Text>
              <Text style={{ color: '#6b7280', marginLeft: 4 }}>{uniqueName ? `@${uniqueName}` : `@${profilename?.toLowerCase?.()}`}</Text>
              <Text style={{ color: '#6b7280', marginLeft: 4 }}>· {timeSince(new Date(timestamp))} ago</Text>
            </View>
            <TouchableOpacity onPress={toggleModal}>
              <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }}/>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }} onPress={handleCommentPress}>
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
                <Text style={{ color: '#16a34a', fontWeight: '600' }}>show more</Text>
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
          <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleSave}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
        </TouchableOpacity>
        {/* Share Option */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
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
      </View>
      {/* Modal for Menu */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  padding: 20,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  backgroundColor: isDarkMode ? '#111827' : '#fff',
                  transform: [{ translateY: dragDistance }]
                }}
                {...panResponder.panHandlers}
              >
                <View style={{
                  width: 80,
                  alignSelf: 'center',
                  backgroundColor: '#0a0a0a',
                  paddingVertical: 2,
                  marginBottom: 16,
                  marginTop: -8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#0a0a0a'
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
                      style={{ marginRight: 10 }}/>
                  </TouchableOpacity>
                  {/* Share Option */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8
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
                </View>
                {/* Copy Link Option */}
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
                <View style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  marginTop: 16,
                  marginBottom: 12
                }}>
                  {userId !== postUserId && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#d1d5db'
                      }}
                      onPress={handleFollowAction}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <ActivityIndicator size="small" color={isDarkMode ? "white" : "black"} />
                      ) : (
                        <>
                          <Text style={{
                            marginLeft: 12,
                            flex: 1,
                            fontWeight: '500',
                            fontSize: 16,
                            marginTop: 2,
                            marginBottom: 2,
                            color: isDarkMode ? '#fff' : '#000'
                          }}>
                            {isFollowing ? `Unfollow @${uniqueName}` : `Follow @${uniqueName}`}
                          </Text>
                          <Ionicons
                            name={isFollowing ? "person-remove-outline" : "person-add-outline"}
                            size={24}
                            color={isDarkMode ? "white" : "black"}
                            style={{ marginRight: 10 }}
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8
                    }}
                    onPress={handleReport}
                  >
                    <Text style={{
                      marginLeft: 12,
                      flex: 1,
                      fontWeight: '500',
                      fontSize: 16,
                      marginTop: 2,
                      marginBottom: 2,
                      color: isDarkMode ? '#fff' : '#000'
                    }}>Report</Text>
                    <Ionicons name="flag-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
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

const PostSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
      backgroundColor: isDarkMode ? '#111827' : '#fff'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: '#e5e7eb' }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ width: '66%', height: 16, backgroundColor: '#e5e7eb', borderRadius: 8, marginBottom: 8 }} />
          <View style={{ width: '33%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
        </View>
      </View>
      <View style={{ marginTop: 12, width: '100%', height: 160, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <View style={{ width: 64, height: 16, backgroundColor: '#e5e7eb', borderRadius: 8, marginRight: 16 }} />
        <View style={{ width: 64, height: 16, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
      </View>
    </View>
  );
};

const LikedPosts = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const userId = user?.$id || user?._id;

  // Fetch liked posts from backend API
  const fetchLikedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!userId) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${API_URL}/posts-likes/likes-by-user/${userId}?currentUserId=${userId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText || 'Failed to fetch liked posts'}`);
      }
      const data = await response.json();
      setPosts(data.posts || []);
      setLoading(false);
    } catch (error) {
      setPosts([]);
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedPosts();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLikedPosts().finally(() => setRefreshing(false));
  };

  // Remove post from UI immediately when unliked
  const handleUnlike = useCallback((postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#1f2937' : '#e5e7eb'
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#000' }}>Liked Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Thread
              content={item.content}
              timestamp={item.createdAt || item.timestamp}
              images={item.images}
              profilename={item.profilename}
              uniqueName={item.uniqueName}
              profilepic={item.profilepic}
              postId={item._id}
              isLiked={item.isLiked}
              commentsCount={item.commentsCount || 0}
              likesCount={item.likesCount}
              isFollowing={item.isFollowing}
              isSaved={item.isSaved}
              userId={item.userId}
              onUnlike={handleUnlike}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      ) : (
        !error && (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16
          }}>
            <Icon name="heart-outline" size={64} color={isDarkMode ? 'gray' : '#aaa'} />
            <Text style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: '600',
              color: isDarkMode ? '#fff' : '#000'
            }}>
              No liked posts yet
            </Text>
            <Text style={{
              marginTop: 8,
              textAlign: 'center',
              color: isDarkMode ? '#9ca3af' : '#4b5563'
            }}>
              Posts you like will appear here. Tap the heart icon on any post to like it.
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

export default LikedPosts;

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Clipboard, Dimensions, Image, Keyboard, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
// Remove EventSource import
// import EventSource from 'react-native-event-source';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';
import analyticsService from '../../utils/firebaseAnalytics';
// Import the central SSE client
import { CommunitySSEClient } from '../../utils/sseClient';

const API_URL = "https://trackeatfit.onrender.com";


// Simple shimmer effect for skeletons
const Shimmer = ({ style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 300],
    });
    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 100,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    opacity: 0.7,
                    transform: [{ translateX }],
                    borderRadius: 12,
                },
                style,
            ]}
        />
    );
};

const PostSkeleton = ({ isDarkMode }) => (
    <View style={[styles.p4, styles.borderB, { borderColor: isDarkMode ? '#374151' : '#9ca3af' }]}>
        <View style={styles.flexRowStart}>
            {/* Profile Picture Skeleton */}
            <View style={{ position: 'relative' }}>
                <View style={[
                    { width: 40, height: 40, borderRadius: 20, marginRight: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
                    { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                ]} />
                <Shimmer style={{ height: 40, width: 40, borderRadius: 20 }} />
            </View>
            <View style={{ flex: 1 }}>
                {/* Username and Time Skeleton */}
                <View style={styles.flexRowCenter}>
                    <View style={{ position: 'relative' }}>
                        <View style={[
                            { width: 96, height: 16, borderRadius: 8 },
                            { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                        ]} />
                        <Shimmer style={{ height: 16, width: 96, borderRadius: 8 }} />
                    </View>
                    <View style={{ position: 'relative' }}>
                        <View style={[
                            { width: 64, height: 12, borderRadius: 6, marginLeft: 8 },
                            { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                        ]} />
                        <Shimmer style={{ height: 12, width: 64, borderRadius: 6, marginLeft: 8 }} />
                    </View>
                </View>
                {/* Content Skeleton */}
                <View style={{ position: 'relative' }}>
                    <View style={[
                        { width: '100%', height: 16, borderRadius: 8, marginTop: 8 },
                        { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                    ]} />
                    <Shimmer style={{ height: 16, width: '100%', borderRadius: 8, marginTop: 8 }} />
                </View>
                <View style={{ position: 'relative' }}>
                    <View style={[
                        { width: '75%', height: 16, borderRadius: 8, marginTop: 8 },
                        { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                    ]} />
                    <Shimmer style={{ height: 16, width: '75%', borderRadius: 8, marginTop: 8 }} />
                </View>
            </View>
        </View>
        {/* Image Skeleton */}
        <View style={{ position: 'relative' }}>
            <View style={[
                { width: '100%', height: 192, borderRadius: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
                { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
            ]} />
            <Shimmer style={{ height: 192, width: '100%', borderRadius: 16, marginTop: 16 }} />
        </View>
        {/* Action Buttons Skeleton */}
        <View style={[styles.flexRow, { marginTop: 16, marginLeft: 24 }]}>
            {[0, 1, 2].map((i) => (
                <View key={i} style={{ position: 'relative', marginRight: i < 2 ? 16 : 0 }}>
                    <View style={[
                        { width: 64, height: 32, borderRadius: 8 },
                        { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                    ]} />
                    <Shimmer style={{ height: 32, width: 64, borderRadius: 8 }} />
                </View>
            ))}
        </View>
    </View>
);

const CommentSkeleton = ({ isDarkMode }) => (
    <View style={[styles.p4, styles.borderB, { borderColor: isDarkMode ? '#374151' : '#9ca3af' }]}>
        <View style={styles.flexRowStart}>
            <View style={{ position: 'relative' }}>
                <View style={[
                    { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
                    { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                ]} />
                <Shimmer style={{ height: 40, width: 40, borderRadius: 20 }} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.flexRowCenter}>
                    <View style={{ position: 'relative' }}>
                        <View style={[
                            { width: 80, height: 16, borderRadius: 8 },
                            { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                        ]} />
                        <Shimmer style={{ height: 16, width: 80, borderRadius: 8 }} />
                    </View>
                    <View style={{ position: 'relative' }}>
                        <View style={[
                            { width: 56, height: 12, borderRadius: 6, marginLeft: 8 },
                            { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                        ]} />
                        <Shimmer style={{ height: 12, width: 56, borderRadius: 6, marginLeft: 8 }} />
                    </View>
                </View>
                <View style={{ position: 'relative' }}>
                    <View style={[
                        { width: '100%', height: 16, borderRadius: 8, marginTop: 8 },
                        { backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }
                    ]} />
                    <Shimmer style={{ height: 16, width: '100%', borderRadius: 8, marginTop: 8 }} />
                </View>
            </View>
        </View>
    </View>
);

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
        <View style={[{ flex: 1 }, { backgroundColor: isDarkMode ? '#111827' : '#fff' }]}>
          <View style={[{
            position: 'absolute', top: 48, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10
          }]}>
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
                  <ExpoImage
                    source={images[currentIndex]}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>

          <View style={{
            position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
          }}>
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8, height: 8, borderRadius: 4, marginHorizontal: 4,
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

const PostDetails = () => {
    const route = useRoute();
    const { id } = useLocalSearchParams();
    const postId = id;
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();
    const [isLiked, setIsLiked] = useState(false);  // State to track if the post is liked
    const [isSaved, setIsSaved] = useState(false);  // State to track if the post is saved
    const [likesCount, setLikesCount] = useState(0);  // State to track likes count
    const [totalCommentsCount, setTotalCommentsCount] = useState(0);
    const [postDetails, setPostDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(true); // <-- Add this line
    const [error, setError] = useState(null);
    // Add refetchCount state
    const [refetchCount, setRefetchCount] = useState(0);
    const { user } = useGlobalContext();
    const userId = user?.$id || user?._id;
    const [isModalVisible, setModalVisible] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState(''); // State for the comment box
    const [isSubmitting, setIsSubmitting] = useState(false); // Submission state


    const timeSince = (date) => {
        if (!(date instanceof Date) || isNaN(date)) {
            return "Invalid time"; // Handle invalid date
        }

        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return `${seconds}s`;
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

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };   useEffect(() => {
        if (postDetails) {
            setIsLiked(postDetails.isLiked);
            setIsSaved(postDetails.isSaved);
            setLikesCount(postDetails.likesCount);
            setTotalCommentsCount(postDetails.commentsCount);
        }
    }, [postDetails]);

        const handleLike = async (userId, postId, profilename, profilepic, uniqueName) => {
        analyticsService.logEvent(isLiked ? 'unlike_post' : 'like_post', {
            postId,
            userId,
            profilename,
            uniqueName,
        });
        try {
          // Optimistic update for better UX
          const newIsLiked = !isLiked;
          setIsLiked(newIsLiked);
          setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

          const endpoint = newIsLiked ? 'like' : 'unlike';
          const method = newIsLiked ? 'POST' : 'DELETE';
          
          // REPLACE fetchWithTimeout with fetch
          const response = await fetch(`${API_URL}/posts-likes/${endpoint}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              postId,
              ...(newIsLiked && { profilename, profilepic, uniqueName }) // Only include these fields for likes
            }),
          });

          // Handle HTTP errors here, not in fetchWithTimeout
          if (!response.ok) {
            const errorText = await response.text();
            setIsLiked(!newIsLiked);
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
          }

          // Fetch updated post data to ensure we have the latest state
          const updatedPostResponse = await fetch(`${API_URL}/posts/${postId}?userId=${userId}`);
          if (updatedPostResponse.ok) {
            const updatedData = await updatedPostResponse.json();
            setPostDetails(updatedData.post);
          }
        } catch (error) {
          console.error(`Error ${isLiked ? 'unliking' : 'liking'} post:`, error);
          Alert.alert('Error', `Failed to ${isLiked ? 'unlike' : 'like'} post`);
        }
      };      
      const handleSave = async (userId, postId) => {
        analyticsService.logEvent(isSaved ? 'unsave_post' : 'save_post', {
            postId,
            userId,
        });

        // Optimistic update
        const prevIsSaved = isSaved;
        setIsSaved(!isSaved);

        try {
            const endpoint = isSaved ? 
                `${API_URL}/saved-posts/unsave` : 
                `${API_URL}/saved-posts/save`;
            
            const method = isSaved ? 'DELETE' : 'POST';
            // REPLACE fetchWithTimeout with fetch
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    postId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Revert optimistic update on error
                setIsSaved(prevIsSaved);
                throw new Error(`HTTP error: ${response.status} - ${errorData.message || 'Failed to save post'}`);
            }

            toggleModal();
        } catch (error) {
            // Revert optimistic update on error
            setIsSaved(prevIsSaved);
            console.error('Error handling save/unsave:', error);
            Alert.alert('Error', 'Failed to save post. Please try again.');
        }
    };

    const Thread = ({ content, timestamp, profilename, profilepic, images, uniqueName }) => {
    const { width: screenWidth } = Dimensions.get('window');
    const [selectedImage, setSelectedImage] = useState(null);
    const navigation = useNavigation(); // Add navigation hook
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, []);

    const timeSince = (date) => {
      if (!(date instanceof Date) || isNaN(date)) {
          return "Invalid time";
      }
      const seconds = Math.floor((now - date.getTime()) / 1000);
      if (seconds < 60) return `${seconds}s`;
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

    const renderImages = () => {
      // Add null check and ensure images is an array
      const imageArray = Array.isArray(images) ? images : [];
      if (imageArray.length === 0) return null;

      const containerWidth = screenWidth - 32;
      const imageWidth = containerWidth * 0.74;
      return (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{
              gap: 16,
              paddingLeft: 0,
            }}
          >
            {imageArray.slice(0, 6).map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage({ url: imageUrl, index })}
                activeOpacity={0.85}
                style={{
                  maxWidth: imageWidth,
                  borderRadius: 18,
                  overflow: 'hidden',
                  marginLeft: index === 0 ? 0 : 0,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <View>
                  <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#00b894" />
                  </View>
                  <ExpoImage
                    source={imageUrl}
                    style={{
                      width: imageWidth,
                      height: undefined,
                      aspectRatio: 16/9,
                      borderRadius: 18,
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
            images={imageArray}
            initialIndex={selectedImage?.index || 0}
            onClose={() => setSelectedImage(null)}
          />
        </>
      );
    };

        // Fallback for avatar initials
    const getInitials = (name) => {
      if (!name) return "A";
      return name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
    };

    // Add handler to navigate to user profile (for both posts and comments)
    const handleAvatarPress = () => {
        navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName: uniqueName });
    };

    return (
        <View style={[
            styles.p4,
            styles.borderB,
            {
                borderColor: isDarkMode ? '#1f2937' : '#e5e7eb',
                backgroundColor: isDarkMode ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.9)',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                marginBottom: 12,
            }
        ]}>
            <View style={styles.flexRowStart}>
                <TouchableOpacity
                    onPress={handleAvatarPress}
                    activeOpacity={0.7}
                    style={{
                        width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#00916E',
                        justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12, backgroundColor: '#fff',
                        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
                    }}
                >
                    {profilepic ? (
                        <Image
                            source={{ uri: profilepic }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00916E' }}>{getInitials(profilename)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <View style={[styles.flexRowBetween, { alignItems: 'center' }]}>
                        <View style={[styles.flexRow, { alignItems: 'center', marginTop: -3 }]}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#000' }}>{profilename}</Text>
                            <Text style={{ color: '#6b7280', marginLeft: 4 }}>{uniqueName}</Text>
                            <Text style={{ fontSize: 12, color: isDarkMode ? '#9ca3af' : '#6b7280', marginLeft: 8 }}>{timeSince(new Date(timestamp))} ago</Text>
                        </View>
                    </View>
                    <Text style={{
                        fontSize: 16, marginTop: 8, marginLeft: 4, marginBottom: 8, lineHeight: 22,
                        color: isDarkMode ? '#fff' : '#000'
                    }}>{content}</Text>
                </View>
            </View>
            <View style={{ marginLeft: 4 }}>
                {renderImages()}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 16, marginLeft: 24 }}>
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginRight: 12 }}
                    onPress={() => handleLike(userId, postId, profilename, profilepic, uniqueName)}
                    activeOpacity={0.7}
                >
                    <Animated.View>
                        <Ionicons 
                            name={isLiked ? "heart" : "heart-outline"} 
                            size={26} 
                            color={isLiked ? "#FF3B30" : isDarkMode ? "#bbb" : "#888"} style={{ marginRight: 5 }}
                        />
                    </Animated.View>                        
                    <Text style={{ fontSize: 16, fontWeight: '500', color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                        {likesCount}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }} activeOpacity={0.7}>
                    <Ionicons 
                        name="chatbubble-outline" 
                        size={25} 
                        color={isDarkMode ? "#bbb" : "#888"} style={{ marginRight: 5 }}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '500', color: isDarkMode ? '#e5e7eb' : '#374151' }}>
                        {totalCommentsCount}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => handleSave(userId, postId)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={isDarkMode ? "white" : "black"}
                        style={{ marginRight: 5 }}
                    />
                </TouchableOpacity>
                {/* Add share icon beside save */}
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}
                    onPress={() => handleShare(postId)}
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
        </View>
    );
};

       // Handle comment submission
const handleCommentSubmit = async () => {
    analyticsService.logEvent('submit_comment', {
        postId,
        userId,
        content: newComment,
    });
    if (!newComment.trim()) {
        return;
    }

    // Validate required data
    if (!userId || !postId) {
        Alert.alert('Error', 'Missing required information to submit comment');
        return;
    }

    // Get user profile data
    const profilename = user?.name || user?.profilename || user?.username || 'Anonymous';
    const profilepic = user?.profilepic || user?.avatar || 'https://example.com/default-avatar.png';
    const uniqueName = user?.uniqueName;

    setIsSubmitting(true);

    // --- Optimistic update: add comment immediately ---
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
        _id: tempId,
        content: newComment,
        timestamp: new Date().toISOString(),
        profilename,
        uniqueName,
        profilepic,
        likesCount: 0,
        isLiked: false,
        // ...add any other fields needed by CommentThread
    };
    setComments(prev => [optimisticComment, ...prev]);
    setTotalCommentsCount(prev => prev + 1);
    setNewComment('');
    Keyboard.dismiss();

    try {
        const commentData = {
            postId,
            content: optimisticComment.content,
            userId,
            profilename,
            uniqueName,
            profilepic,
        };

        // REPLACE fetchWithTimeout with fetch
        const response = await fetch(`${API_URL}/comments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status} - ${responseData.error || 'Failed to submit comment'}`);
        }

        // Replace the optimistic comment with the real one from the server, but avoid duplicates
        if (responseData.comment && responseData.comment._id) {
            setComments(prev => {
                // Remove any optimistic comment with same content and close timestamp
                const filtered = prev.filter(c =>
                    !(
                        c._id === tempId ||
                        (
                            c._id?.startsWith('temp-') &&
                            c.content === responseData.comment.content &&
                            Math.abs(new Date(c.timestamp) - new Date(responseData.comment.timestamp)) < 10000 // 10s window
                        )
                    )
                );
                // Also, if the real comment is already present (e.g. via SSE), don't add again
                const alreadyExists = filtered.some(c => c._id === responseData.comment._id);
                if (alreadyExists) return filtered;
                return [responseData.comment, ...filtered];
            });
        }
        // Else, let SSE update handle it
    } catch (error) {
        // --- Revert optimistic update on error ---
        setComments(prev => prev.filter(c => c._id !== tempId));
        setTotalCommentsCount(prev => Math.max(0, prev - 1));
        console.error('Error submitting comment:', error);
        Alert.alert(
            'Error', 
            'Failed to submit comment. Please check your connection and try again.\n' + 
            (error.message || 'Unknown error occurred')
        );
    } finally {
        setIsSubmitting(false);
    }
};

// Replace the existing SSE useEffect with CommunitySSEClient
useEffect(() => {
    if (!postId || !userId) return;

    // Create SSE client instance for comments
    const sseClient = CommunitySSEClient.getInstance({
        url: `${API_URL}/ws/events`,
        userId: userId,
        clientType: 'postDetails',
        debugLabel: `PostDetails-${postId}`,
        onComment: (data, eventType) => {
            console.log('Comment event received:', { data, eventType, postId });
            
            // Handle new comments
            if (eventType === 'newComment' && data.postId === postId) {
                setComments(prevComments => {
                    // Prevent duplicates: check by _id, and also by content/timestamp for optimistic comments
                    const commentExists = prevComments.some(comment =>
                        comment._id === data.comment._id ||
                        (
                            comment._id?.startsWith('temp-') &&
                            comment.content === data.comment.content &&
                            Math.abs(new Date(comment.timestamp) - new Date(data.comment.timestamp)) < 10000
                        )
                    );
                    
                    if (!commentExists) {
                        setTotalCommentsCount(prev => prev + 1);
                        return [data.comment, ...prevComments];
                    }
                    return prevComments;
                });
            }
            
            // Handle comment deletions
            if (eventType === 'comments' && data.type === 'delete' && data.postId === postId) {
                setComments(prevComments => 
                    prevComments.filter(comment => comment._id !== data.commentId)
                );
                setTotalCommentsCount(prev => Math.max(0, prev - 1));
            }
        },
        onError: (error) => {
            console.error('PostDetails SSE Error:', error);
        },
        maxReconnectAttempts: 5
    });

    // Connect to SSE
    sseClient.connect();

    // Cleanup function
    return () => {
        sseClient.close();
    };
}, [postId, userId]);

// Effect to fetch initial comments
useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
        setLoading(true);
        setCommentsLoading(true); // <-- Set comments loading to true
        try {
            // Fetch post details first, show as soon as available
            // REPLACE fetchWithTimeout with fetch
            const postPromise = fetch(`${API_URL}/posts/${postId}?userId=${userId}`)
                .then(res => res.json().then(data => ({ ok: res.ok, data })));
            // Start comments fetch in parallel (remove countPromise)
            const commentsPromise = fetch(`${API_URL}/comments/comments-by-post/${postId}?currentUserId=${userId}`)
                .then(res => res.json().then(data => ({ ok: res.ok, data })));

            // Await post details first
            const postResult = await postPromise;
            if (!postResult.ok) throw new Error(postResult.data.message || 'Failed to fetch post details');
            if (isMounted) {
                setPostDetails(postResult.data.post);
                // Set comment count from post details
                setTotalCommentsCount(postResult.data.post?.commentsCount || 0);
            }

            // Now update loading state for post details
            if (isMounted) setLoading(false);

            // Await comments in parallel
            const commentsResult = await commentsPromise;
            if (isMounted && commentsResult.ok) setComments(commentsResult.data.comments);

            if (isMounted) setCommentsLoading(false); // <-- Set comments loading to false after fetching
        } catch (error) {
            if (isMounted) {
                console.error('Error fetching data:', error);
                setError(error); // Pass the error object, not just error.message
                setLoading(false);
                setCommentsLoading(false); // <-- Also set to false on error
            }
        }
    };
    if (postId && userId) fetchAllData();
    return () => { isMounted = false; };
}, [postId, userId, refetchCount]); // Add refetchCount here

    // Add a retry handler for ErrorState
    const handleRetry = () => {
        setError(null);
        setLoading(true);
        setRefetchCount(c => c + 1); // This will trigger the useEffect to refetch
    };

    if (loading) {
        return (
            <SafeAreaView style={[{ flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb' }]}>
                <View style={[styles.flexRow, { alignItems: 'center', marginBottom: 16, marginTop: 8 }]}
                >
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDarkMode ? '#374151' : '#d1d5db', marginRight: 16 }} />
                    <View style={{ width: 96, height: 24, borderRadius: 12, backgroundColor: isDarkMode ? '#374151' : '#d1d5db' }} />
                </View>
                <View style={{ height: 1, backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb' }} />
                <ScrollView>
                    <PostSkeleton isDarkMode={isDarkMode} />
                    <View style={{ marginTop: 16 }}>
                        <View style={{ width: 96, height: 20, borderRadius: 10, backgroundColor: isDarkMode ? '#374151' : '#d1d5db', marginLeft: 8, marginBottom: 8 }} />
                        <View style={{ height: 1, backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb' }} />
                        {[1, 2, 3].map((_, index) => (
                            <CommentSkeleton key={index} isDarkMode={isDarkMode} />
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (error) {
        return null;
    }

    if (!postDetails) {
        return (
            <SafeAreaView style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#111827' : '#fff' }]}>
                <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>No post found.</Text>
            </SafeAreaView>
        );
    }

    const createShareableLink = (postId) => {
        return `https://trackeatfit.xyz/posts/${postId}`;
    };

    const handleShare = async (postId) => {
        analyticsService.logEvent('share_post', {
            postId,
            userId,
        });
        try {
            const link = createShareableLink(postId);
            const result = await Share.share({
                message: link,
                url: link,
                title: 'Check out this post'
            });    
           
        } catch (error) {
            Alert.alert('Error', 'Failed to share post');
        }
    };

        const CommentLikeButton = React.memo(({ commentId, isDarkMode, initialLikesCount = 0, initialIsLiked }) => {
    const [isCommentLiked, setIsCommentLiked] = useState(initialIsLiked);
    const [commentLikesCount, setCommentLikesCount] = useState(Number(initialLikesCount) || 0);
    const { user } = useGlobalContext();
    const userId = user?.$id || user?._id;

    const handleLikePress = useCallback(async () => {
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
                    profilepic: user?.avatar,
                    uniqueName: user?.uniqueName
                })
            };

            // REPLACE fetchWithTimeout with fetch
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                setIsCommentLiked(previousLikeState);
                setCommentLikesCount(previousCount);
                throw new Error(`HTTP error: ${response.status} - ${errorText}`);
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
            <Text style={{ marginLeft: 4, color: isDarkMode ? '#fff' : '#000' }}>{commentLikesCount}</Text>
        </TouchableOpacity>
    );
});

const CommentThread = React.memo(({ content, timestamp, profilename, profilepic, commentId, likesCount, isLiked, uniqueName }) => {
    const { isDarkMode } = useTheme();
    const navigation = useNavigation();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeSince = (date) => {
        if (!(date instanceof Date) || isNaN(date)) {
            return "Invalid time";
        }
        const seconds = Math.floor((now - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s`;
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

        // Fallback for avatar initials
    const getInitials = (name) => {
      if (!name) return "A";
      return name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
    };

    // Add handler to navigate to user profile (for comments)
    const handleAvatarPress = () => {
        console.log('Navigating to user profile for comment, uniqueName:', uniqueName);
        navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName });
    };

    return (
        <View style={[
            styles.p4,
            styles.borderB,
            {
                borderColor: isDarkMode ? '#1f2937' : '#e5e7eb',
                backgroundColor: isDarkMode ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.9)',
                borderRadius: 16,
                marginBottom: 8,
            }
        ]}>
            <View style={styles.flexRowStart}>
                <TouchableOpacity
                    onPress={handleAvatarPress}
                    activeOpacity={0.7}
                    style={{
                        width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#00916E',
                        justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12, backgroundColor: '#fff',
                        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
                    }}
                >
                    {profilepic ? (
                        <Image
                            source={{ uri: profilepic }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00916E' }}>{getInitials(profilename)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <View style={[styles.flexRowBetween, { alignItems: 'center' }]}
                    >
                        <View style={[styles.flexRow, { alignItems: 'center' }]}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: isDarkMode ? '#fff' : '#000' }}>{profilename || 'Anonymous'}</Text>
                            <Text style={{ color: '#6b7280', marginLeft: 4 }}>{uniqueName}</Text>
                            <Text style={{ fontSize: 12, color: isDarkMode ? '#9ca3af' : '#6b7280', marginLeft: 8 }}>{timeSince(new Date(timestamp))} ago</Text>
                        </View>
                    </View>
                    <Text style={{
                        fontSize: 16, marginTop: 4, lineHeight: 22,
                        color: isDarkMode ? '#fff' : '#000'
                    }}>{content}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 8 }}>
                <View style={{ marginLeft: 24, marginRight: 12 }}>
                    <CommentLikeButton
                        commentId={commentId}
                        isDarkMode={isDarkMode}
                        initialLikesCount={likesCount}
                        initialIsLiked={isLiked}
                    />
                </View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }} activeOpacity={0.7}>
                    <Ionicons name="chatbubble-outline" size={22} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} activeOpacity={0.7}>
                    <Ionicons name="paper-plane-outline" size={22} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
});


    return (

        <SafeAreaView style={[{ flex: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 }, { backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb' }]}>
            <View style={[styles.flexRow, { alignItems: 'center', marginBottom: 16 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={26} color={isDarkMode ? "white" : "black"} />
                </TouchableOpacity>
                <Text style={{ fontSize: 24, fontWeight: '800', marginLeft: 16, color: isDarkMode ? '#fff' : '#000' }}>Post</Text>
                <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={toggleModal} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={26} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb' }} />
            <ScrollView showsVerticalScrollIndicator={false}>
            <Thread
                content={postDetails.content}
                images={postDetails.images}
                timestamp={postDetails.timestamp}
                profilename={postDetails.profilename}
                profilepic={postDetails.profilepic}
                uniqueName={postDetails.uniqueName || postDetails.uniquename} // Pass uniqueName prop
                totalCommentsCount={postDetails.totalComments}
            />
            <View style={{ flexDirection: 'row', marginTop: 16, marginLeft: 8, marginBottom: 8, alignItems: 'center' }}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={isDarkMode ? "#00b894" : "#00916E"} />
                <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 8, color: isDarkMode ? '#fff' : '#000' }}>Comments</Text>
                <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 8, marginTop: 1, color: '#00916E' }}>{totalCommentsCount}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: isDarkMode ? '#1f2937' : '#e5e7eb', marginTop: 8 }} />
            {/* User comment Section */}
            {commentsLoading ? (
                // Show 3 comment skeletons while loading
                <>
                    <CommentSkeleton isDarkMode={isDarkMode} />
                    <CommentSkeleton isDarkMode={isDarkMode} />
                    <CommentSkeleton isDarkMode={isDarkMode} />
                </>
            ) : (
                comments?.map(comment => (
                    comment?.content && (
                        <CommentThread
                            key={comment._id}
                            content={comment?.content || 'No comment provided'}
                            timestamp={comment?.timestamp ? new Date(comment.timestamp) : new Date()}
                            profilename={comment?.profilename || 'Anonymous'}
                            profilepic={comment?.profilepic || ''}
                            uniqueName={comment?.uniqueName || comment?.uniquename}
                            commentId={comment._id}
                            likesCount={comment.likesCount}
                            isLiked={comment.isLiked}
                        />
                    )
                ))
            )}
        </ScrollView>
        {/* Comment Box */}
        <View style={{
            flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 8, paddingVertical: 8,
            backgroundColor: isDarkMode ? "#23272f" : "#f9fafb",
            borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
            borderColor: isDarkMode ? "#333" : "#e5e7eb", borderWidth: 1
        }}>
            <TextInput
                style={{
                    flex: 1, height: 48, paddingLeft: 16, paddingRight: 16, backgroundColor: 'transparent', borderRadius: 8,
                    fontSize: 16, color: isDarkMode ? '#fff' : '#374151'
                }}
                placeholder="Write a comment..."
                placeholderTextColor={isDarkMode ? "#9ca3af" : "#6b7280"}
                value={newComment}
                onChangeText={setNewComment}
                multiline
            />
            <TouchableOpacity
                style={{
                    marginLeft: 12, padding: 12, borderRadius: 8,
                    backgroundColor: '#00916E'
                }}
                onPress={handleCommentSubmit}
                disabled={isSubmitting}
                activeOpacity={0.7}
            >
                <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
        </View>
        {/* Modal for Options */}            
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={toggleModal}
        >
            <TouchableWithoutFeedback onPress={toggleModal}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <TouchableWithoutFeedback>
                        <View style={{
                            padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                            backgroundColor: isDarkMode ? '#111827' : '#fff'
                        }}>
                            <View style={{
                                borderWidth: 1, borderRadius: 12, marginBottom: 8,
                                borderColor: isDarkMode ? '#374151' : '#d1d5db'
                            }}>                                    
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                                        borderBottomWidth: 1, borderColor: isDarkMode ? '#374151' : '#d1d5db'
                                    }}
                                    onPress={() => {
                                        handleSave(userId, postId);
                                        toggleModal();
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ marginLeft: 12, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>
                                            {isSaved ? 'Unsave' : 'Save'}
                                        </Text>
                                    </View>
                                    <Ionicons 
                                        name={isSaved ? "bookmark" : "bookmark-outline"} 
                                        size={24} 
                                        color={isDarkMode ? "white" : "black"} 
                                        style={{ marginRight: 10 }} 
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', paddingVertical: 8
                                    }}
                                    onPress={() => console.log('Not Interested pressed')}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ marginLeft: 12, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>
                                            Not Interested
                                        </Text>
                                    </View>
                                    <Ionicons name="close-circle-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderRadius: 12, marginBottom: 8,
                                        borderColor: isDarkMode ? '#374151' : '#d1d5db'
                                    }}
                                    onPress={() => {
                                        handleShare(postId);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ marginLeft: 12, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>
                                            Share
                                        </Text>
                                    </View>
                                    <Ionicons name="share-social-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderRadius: 12, marginBottom: 8,
                                        borderColor: isDarkMode ? '#374151' : '#d1d5db'
                                    }}
                                    onPress={async () => {
                                        try {
                                            const link = createShareableLink(postId);
                                            Clipboard.setString(link);
                                            toggleModal();
                                            Alert.alert('Link Copied', 'Post link has been copied to clipboard');
                                        } catch (error) {
                                            Alert.alert('Error', 'Failed to copy link');
                                        }
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ marginLeft: 12, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>
                                            Copy Link
                                        </Text>
                                    </View>
                                    <Ionicons name="link-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    </SafeAreaView>
    );
};

// Stylesheet for reusable styles
const styles = StyleSheet.create({
    p4: { padding: 16 },
    borderB: { borderBottomWidth: 1 },
    flexRow: { flexDirection: 'row' },
    flexRowStart: { flexDirection: 'row', alignItems: 'flex-start' },
    flexRowCenter: { flexDirection: 'row', alignItems: 'center' },
    flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default PostDetails;

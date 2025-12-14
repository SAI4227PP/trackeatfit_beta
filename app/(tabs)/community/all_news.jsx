import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from 'expo-router';
import debounce from 'lodash.debounce';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Animated as AnimatedRN, Clipboard, Dimensions, FlatList, Modal, PanResponder, RefreshControl, ScrollView, Share, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { CommunitySSEClient } from '../../../utils/sseClient';

import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme } from '../../../context/ThemeContext';
import analyticsService from '../../../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

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
                <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1a202c' : '#fff' }}>
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
                                    <ExpoImage
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
                                    borderRadius: 4,
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

const Thread = memo(({ content, timestamp, profilename, uniqueName, profilepic, postId, commentsCount, images, isLiked: initialIsLiked, likesCount: initialLikesCount, isFollowing: initialIsFollowing, isSaved: initialIsaved, userId: postUserId }) => {
    const { isDarkMode } = useTheme();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(Number(initialLikesCount) || 0);
    const [showFullContent, setShowFullContent] = useState(false);
    const [dragDistance, setDragDistance] = useState(0);
    const [commentCount, setCommentCount] = useState(commentsCount || 0);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followLoading, setFollowLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(initialIsaved);
    const { width: screenWidth } = Dimensions.get('window');
    const [selectedImage, setSelectedImage] = useState(null);

    const { user } = useGlobalContext();
    const userId = user?.$id || user?._id;
    const navigation = useNavigation();

    // Ensure isSaved state updates when prop changes (SSE or parent update)
    useEffect(() => {
        setIsSaved(initialIsaved);
    }, [initialIsaved]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                setDragDistance(gestureState.dy); // Set the vertical drag distance
            },
            onPanResponderRelease: (e, gestureState) => {
                // On release, check if the drag distance exceeds a threshold
                if (gestureState.dy > 100) {
                    toggleModal();
                }
                setDragDistance(0);
            },
        })
    ).current;

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

  const handleSave = async () => {
    analyticsService.logEvent(isSaved ? 'unsave_post' : 'save_post', {
      postId,
      userId,
      profilename,
      uniqueName,
    });
    // Optimistically update UI
    setIsSaved(prev => !prev);
    try {
      const endpoint = isSaved ? 
        `${API_URL}/saved-posts/unsave` : 
        `${API_URL}/saved-posts/save`;
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          postId
        }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setIsSaved(prev => !prev);
        const errorData = await response.json();
        console.error('Save action failed:', errorData.message);
        Alert.alert('Error', errorData.message || 'Failed to save post');
      }
      // If ok, do nothing (UI already updated)
    } catch (error) {
      // Revert optimistic update
      setIsSaved(prev => !prev);
      console.error('Error handling save/unsave:', error);
      Alert.alert('Error', 'Failed to save post. Please try again.');
    }
  };

    const handleLike = async (userId, postId, profilename, profilepic, uniqueName) => {
        analyticsService.logEvent(isLiked ? 'unlike_post' : 'like_post', {
            postId,
            userId,
            profilename,
            uniqueName,
        });
        try {
            const endpoint = isLiked ? 
                `${API_URL}/posts-likes/unlike` : 
                `${API_URL}/posts-likes/like`;
            
            const method = isLiked ? 'DELETE' : 'POST';
            const body = {
                userId,
                postId,
                ...(method === 'POST' && { profilename, profilepic, uniqueName })
            };

            // Optimistic UI update
            setIsLiked(!isLiked);
            setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const result = await response.json();
                // Use server value if available, else keep optimistic
                setLikesCount(typeof result.likesCount === 'number' ? result.likesCount : (isLiked ? likesCount - 1 : likesCount + 1));
                setIsLiked(!isLiked);
            } else {
                // Revert optimistic update on error
                setIsLiked(isLiked);
                setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
            }
        } catch (error) {
            // Revert optimistic update on error
            setIsLiked(isLiked);
            setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
            console.error('Error handling like/unlike:', error);
        }
    };

    const handleCommentPress = () => {
        analyticsService.logEvent('view_comments', {
            postId,
            userId,
        });
        // Navigate to the PostDetails screen, passing the postId or any necessary data
        navigation.navigate('posts/[id]', { id: postId });
    };
    
    const renderImages = () => {
        if (!images || images.length === 0) return null;
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
                            {/* Placeholder while loading */}
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
                images={images}
                initialIndex={selectedImage?.index || 0}
                onClose={() => setSelectedImage(null)}
            />
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

            console.log('Making follow request:', {
                method,
                endpoint,
                body: {
                    followerId: userId,
                    followingId: postUserId
                }
            });

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    followerId: userId,
                    followingId: postUserId
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Follow response:', data);
                
                setIsFollowing(!isFollowing);
                toggleModal();
            } else {
                const errorData = await response.json();
                console.error('Follow action failed:', errorData.message);
                Alert.alert('Error', errorData.message || 'Failed to update follow status');
            }
        } catch (error) {
            console.error('Error handling follow/unfollow:', error);
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
        // Alert.alert('Link Copied', 'The post link has been copied to your clipboard.');
        toggleModal();
    };

    // Helper to create shareable link
    const createShareableLink = (postId) => {
        return `https://trackeatfit.xyz/posts/${postId}`;
    };

    // Update handleShare to match the requested pattern
    const handleShare = async () => {
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

            // if (result.action === Share.sharedAction) {
            //     toggleModal();
            // }
        } catch (error) {
            Alert.alert('Error', 'Failed to share post');
        }
    };

    useEffect(() => {
        setIsFollowing(initialIsFollowing);
        console.log('Following status updated:', { postId, initialIsFollowing });
    }, [initialIsFollowing]);

    // Update isLiked and likesCount if props change (fixes like UI not updating after SSE or prop change)
    useEffect(() => {
        setIsLiked(initialIsLiked);
    }, [initialIsLiked]);
    useEffect(() => {
        setLikesCount(Number(initialLikesCount) || 0);
    }, [initialLikesCount]);

    const isContentLong = content && (content.length > 180 || (content.match(/\n/g) || []).length >= 4);


    return (
        <View style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
            backgroundColor: isDarkMode ? '#1a202c' : '#fff'
        }}>
            {/* Profile Section */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <TouchableOpacity 
                  style={{
                    width: 40,
                    height: 40,
                    borderWidth: 1,
                    borderColor: '#22c55e',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    marginRight: 12
                  }}
                  onPress={() => navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName })}
                >
                  <ExpoImage
                    source={profilepic || 'https://example.com/default-avatar.png'}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Profile Name and Timestamp */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#000' }}>{profilename}</Text>
                        <Text style={{ color: '#6b7280', marginLeft: 4 }}>{uniqueName ? `@${uniqueName}` : `@${profilename.toLowerCase()}`}</Text>
                        <Text style={{ color: '#6b7280', marginLeft: 4 }}>· {timeSince(new Date(timestamp))} ago</Text>
                        </View>

                        {/* Menu Icon */}
                        <TouchableOpacity onPress={toggleModal}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }}/>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
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
                            <Text style={{ color: '#22c55e', fontWeight: '600' }}>show more</Text>
                        }
                        </Text>                    
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ marginLeft: 32 }}>
                {/* Post Image */}
                {renderImages()}
            </View>
            {/* Icons Section */}
            <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 8 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginRight: 12 }} onPress={() => handleLike(userId, postId, profilename, profilepic, uniqueName)}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "red" : isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
                    <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{likesCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }} onPress={handleCommentPress}>
                    <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
                    <Text style={{ fontSize: 14, color: isDarkMode ? '#fff' : '#000' }}>{commentsCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => { if (!isModalVisible) handleSave(); }}>
                    <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
                </TouchableOpacity>
                {/* Add share icon beside save */}
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

            {/* Modal for Menu */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={toggleModal}
            >                
            <TouchableWithoutFeedback onPress={toggleModal}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={{
                        padding: 20,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        backgroundColor: isDarkMode ? '#1a202c' : '#fff',
                        transform: [{ translateY: dragDistance }]
                    }}
                    {...panResponder.panHandlers}>
                        <View style={{
                            width: 80,
                            alignSelf: 'center',
                            backgroundColor: '#0f172a',
                            padding: 2,
                            marginBottom: 16,
                            marginLeft: '36%',
                            marginTop: -8,
                            borderWidth: 1,
                            borderColor: '#0f172a',
                            borderRadius: 12
                        }} />
                        {/* Save and Not Interested Options in One Border */}
                        <View style={{
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            borderRadius: 12,
                            marginBottom: 4
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

                            {/* <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 8
                                }}
                                onPress={() => {
                                    console.log('Not Interested pressed');
                                    toggleModal();
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
                                }}>Not Interested</Text>
                                <Ionicons name="close-circle-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                            </TouchableOpacity> */}
                        </View>

                        {/* Share Option */}
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
                                    handleShare();
                                    toggleModal();
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
                        {/* Mute, Unfollow, Report Options in One Border */}
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

// Memoize the Thread component
const MemoizedThread = memo(Thread);
  
  // Debounce the scroll handler
  const useDebounce = (callback, delay) => {
    const debouncedFn = useCallback(
      debounce((...args) => callback(...args), delay),
      [callback]
    );
    return debouncedFn;
  };

const PostSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <View style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
        backgroundColor: isDarkMode ? '#1a202c' : '#fff'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Animated.View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' }} />
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

const AnimatedFlatList = AnimatedRN.createAnimatedComponent(FlatList);

const AllNews = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const [posts, setPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const eventSourceRef = useRef(null);
  const sseRef = useRef(null);
  const sseClientRef = useRef(null);

  const headerHeight = 60;

  // Use useCallback for fetchPosts to always get latest currentPage
  const fetchPosts = useCallback(async (reset = false) => {
    if (isLoading && !reset) return;

    try {
      setIsLoading(true);
      let pageToFetch = currentPage;
      if (reset) pageToFetch = 1;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const userId = user?.$id || user?._id;
      if (!userId) {
        console.error('No user ID available');
        setIsLoading(false);
        return;
      }

      const url = `${API_URL}/posts/all?page=${pageToFetch}&limit=10&userId=${userId}&timestamp=${Date.now()}`;
      console.log('Fetching posts from:', url);

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response for posts/all:', data);
      if (!data || !Array.isArray(data.posts)) {
        throw new Error('Invalid response format from server');
      }

      setPosts(prevPosts => {
        if (reset) return data.posts;
        const existingIds = new Set(prevPosts.map(p => p._id));
        const newPosts = data.posts.filter(post => !existingIds.has(post._id));
        return [...prevPosts, ...newPosts];
      });

      // Only set hasMore to false if the returned posts array is empty for a non-initial page
      if (!data.hasMore && data.posts.length === 0 && !reset) {
        setHasMore(false);
      } else {
        setHasMore(Boolean(data.hasMore));
      }
      setCurrentPage(prev => reset ? 2 : prev + 1);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      } else {
        console.error('Error details:', error);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isLoading, user]);

  const onRefresh = useCallback(async () => {
    console.log('🔄 Refreshing posts...');
    console.log('🔄 Refreshing posts...');
    setIsRefreshing(true);
    setCurrentPage(1); // Reset page to 1 on refresh
    await fetchPosts(true);
    setIsRefreshing(false);
    console.log('✅ Refresh complete');
  }, [fetchPosts]);

  // Add logging to the FlatList handlers
  const handleEndReached = () => {
    console.log('📜 List end reached:', {
      hasMore,
      isLoading,
      currentPage,
      currentPostsCount: posts.length
    });
    if (!isLoading && hasMore) {
      console.log('🔄 Fetching more posts...');
      fetchPosts();
    }
  };

  useEffect(() => {
    console.log('Initial posts fetch with user:', user?.$id || user?._id);
    if (user?.$id || user?._id) {
      fetchPosts(true);
    } else {
      console.log('Waiting for user data...');
    }
  }, [user]);

  // Replace the SSE useEffect with a global CommunitySSEClient instance
  useEffect(() => {
    let isMounted = true;
    const userId = user?.$id || user?._id;
    if (!userId) return;

    // Always use the singleton instance for this user
    if (sseClientRef.current && typeof sseClientRef.current.close === 'function') {
      sseClientRef.current.close();
      sseClientRef.current = null;
    }

    let reconnectTimeout = null;

    const handleError = (err) => {
      console.error('[AllNews] WebSocket Error:', err);
      // Attempt to reconnect after a delay if still mounted
      if (isMounted) {
        reconnectTimeout = setTimeout(() => {
          if (isMounted && sseClientRef.current) {
            sseClientRef.current.connect();
          }
        }, 5000); // 5s delay
      }
    };

    const handleOpen = () => {
      console.log('[AllNews] WebSocket connection opened');
      if (isMounted) setIsLoading(false);
    };

    // Handler for real-time post events
    const handlePostsEvent = (data) => {
      // --- Match Profile's SSE logic for posts event ---
      console.log('[AllNews] Received posts event:', data);
      setPosts(prevPosts => {
        // Normalize userId for comparison (not strictly necessary in AllNews, but keep logic similar)
        const eventUserId =
          typeof data?.post?.userId === 'object'
            ? data.post.userId._id || data.post.userId.$id
            : data?.post?.userId;

        switch (data.type) {
          case 'create': {
            // Insert if not already present
            if (prevPosts.some(post => post._id === data.post._id)) return prevPosts;
            // Ensure likesCount, commentsCount, isLiked, isSaved are present
            const normalizedPost = {
              ...data.post,
              likesCount: typeof data.post.likesCount === 'number' ? data.post.likesCount : 0,
              commentsCount: typeof data.post.commentsCount === 'number' ? data.post.commentsCount : 0,
              isLiked: typeof data.post.isLiked === 'boolean' ? data.post.isLiked : false,
              isSaved: typeof data.post.isSaved === 'boolean' ? data.post.isSaved : false,
            };
            return [normalizedPost, ...prevPosts];
          }
          case 'update':
            return prevPosts.map(post =>
              post._id === data.post._id
                ? { ...post, ...data.post }
                : post
            );
          case 'delete':
            return prevPosts.filter(post => post._id !== data.postId);
          case 'saveUpdate':
            return prevPosts.map(post =>
              post._id === (data.postId || data.post?._id)
                ? { ...post, ...(data.post || {}), isSaved: data.isSaved }
                : post
            );
          case 'likeUpdate':
            return prevPosts.map(post =>
              post._id === (data.postId || data.post?._id)
                ? {
                    ...post,
                    ...(data.post || {}),
                    likesCount: data.likesCount,
                    isLiked: data.isLiked
                  }
                : post
            );
          default:
            return prevPosts;
        }
      });
    };

    // Handler for real-time like/unlike events
    const handleLikeEvent = (event) => {
      console.log('[AllNews] Received like event:', event);
      if (!isMounted) return;
      setPosts(prevPosts => prevPosts.map(p =>
        p._id === event.postId
          ? {
              ...p,
              likesCount: typeof event.likesCount === 'number' ? event.likesCount : p.likesCount,
              isLiked: typeof event.isLiked === 'boolean' ? event.isLiked : p.isLiked,
            }
          : p
      ));
    };

    // Handler for real-time saved/unsaved events
    const handleSavedEvent = (event) => {
      console.log('[AllNews] Received savedPosts event:', event);
      if (!isMounted) return;
      setPosts(prevPosts => {
        // If event includes a full post object, update/insert it
        if (event.post && event.type === 'save') {
          const idx = prevPosts.findIndex(p => p._id === event.post._id);
          if (idx !== -1) {
            // Update existing post with new data (including isSaved)
            return prevPosts.map((p, i) =>
              i === idx ? { ...p, ...event.post, isSaved: true } : p
            );
          } else {
            // Insert new post at the top
            return [{ ...event.post, isSaved: true }, ...prevPosts];
          }
        }
        // For save/unsave, just update isSaved flag by postId
        if (event.postId) {
          return prevPosts.map(p =>
            p._id === event.postId
              ? { ...p, isSaved: event.type === 'save' }
              : p
          );
        }
        return prevPosts;
      });
    };

    // Use the singleton instance for this user
    const client = CommunitySSEClient.getInstance({
      userId,
      onError: handleError,
      onOpen: handleOpen,
      onPosts: handlePostsEvent,
      onLike: handleLikeEvent,
      onSaved: handleSavedEvent, // <-- Add this line
    });
    sseClientRef.current = client;
    client.connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (sseClientRef.current && typeof sseClientRef.current.close === 'function') {
        sseClientRef.current.close();
        sseClientRef.current = null;
      }
      console.log('[AllNews] Cleaned up CommunitySSEClient');
    };
  }, [user]);
  
  const Header = () => (
    <View style={{
        borderBottomWidth: 1,
        backgroundColor: isDarkMode ? '#1a202c' : '#fff',
        borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, paddingVertical: 16 }}>  
        <TouchableOpacity onPress={() => navigation.navigate('home')} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={30} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            flex: 1,
            marginLeft: 8,
            color: isDarkMode ? '#fff' : '#000'
        }}>Community</Text>
      </View>
    </View>
  );

  const ListHeader = useCallback(() => (
    <View>  
      <TouchableOpacity onPress={() => navigation.navigate('Posts')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 4, marginLeft: 12 }}>
          <View style={{
            width: 48,
            height: 48,
            borderWidth: 1,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            marginRight: 12,
            borderColor: isDarkMode ? '#374151' : '#22c55e'
          }}>
            <ExpoImage
              source={user?.avatar || 'https://example.com/default-avatar.png'}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
          <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
            <Text style={{
                fontWeight: '500',
                fontSize: 16,
                color: isDarkMode ? '#fff' : '#000'
            }}>
              {user?.username || 'Guest'}
            </Text>
            <Text style={{
                fontSize: 14,
                fontWeight: '400',
                color: isDarkMode ? '#9ca3af' : '#4b5563'
            }}>
              What's new?
            </Text>
          </View>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8, marginLeft: 40 }}
          contentContainerStyle={{ paddingHorizontal: 15 }}
        >
          <Ionicons 
            name="images-outline" 
            size={25} 
            color={isDarkMode ? "white" : "black"} 
            style={{ marginHorizontal: 15 }} 
          />
          <Ionicons 
            name="camera-outline" 
            size={25} 
            color={isDarkMode ? "white" : "black"} 
            style={{ marginHorizontal: 10 }} 
          />
        </ScrollView>
      </TouchableOpacity>

      <View style={{
        height: 1,
        marginBottom: 4,
        marginTop: 8,
        backgroundColor: isDarkMode ? '#1e293b' : '#e5e7eb'
      }} />
    </View>
  ), [user, isDarkMode]);

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View>
        <PostSkeleton />
        <PostSkeleton />
      </View>
    );
  };

  // Optimize FlatList rendering  
  const renderItem = ({ item }) => (
    <MemoizedThread
      content={item.content}
      timestamp={item.timestamp}
      images={item.images}
      profilename={item.profilename}
      uniqueName={item.uniqueName || item.uniquename}
      profilepic={item.profilepic}
      postId={item._id}
      isLiked={item.isLiked}
      commentsCount={item.commentsCount}
      likesCount={item.likesCount}
      isFollowing={item.isFollowing}
      isSaved={item.isSaved}
      userId={item.userId}
    />
  );
  // Use a fallback in case _id is missing, and ensure string type
  const keyExtractor = useCallback((item, index) => (item._id ? String(item._id) : String(index)), []);
  const debouncedEndReached = useDebounce(handleEndReached, 150);

  const renderContent = () => {
    if (isLoading && posts.length === 0) {
      return (
        <ScrollView>
          <Header />
          <ListHeader />
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </ScrollView>
      );
    }

    return (
      <>
        <Header />
        <AnimatedFlatList
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={renderFooter}
          onEndReached={debouncedEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              progressViewOffset={headerHeight}
            />
          }
          contentContainerStyle={{
            paddingBottom: 70,
          }}
          extraData={posts}
        />
      </>
    );
  };

  // Use a single return statement
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#1a202c' : '#fff' }} edges={['left', 'right', 'bottom']}>
      {renderContent()}
    </SafeAreaView>
  );
};

export default memo(AllNews);

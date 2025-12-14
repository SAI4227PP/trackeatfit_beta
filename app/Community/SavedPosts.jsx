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

// Add ImageViewerModal for image preview
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
                <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    <View className="absolute top-12 w-full flex-row justify-between px-4 z-10">
                        <Text className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
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
                        <Animated.View className="flex-1 justify-center">
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
                    <View className="absolute bottom-10 w-full flex-row justify-center items-center">
                        {images.map((_, index) => (
                            <View
                                key={index}
                                className={`w-2 h-2 rounded-full mx-1 ${
                                    index === currentIndex 
                                        ? isDarkMode ? 'bg-white' : 'bg-black' 
                                        : 'bg-gray-500'
                                }`}
                            />
                        ))}
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

const Thread = memo(({ content, timestamp, profilename, uniqueName, profilepic, postId, commentsCount, images, isLiked: initialIsLiked, likesCount: initialLikesCount, isFollowing: initialIsFollowing, isSaved: initialIsSaved, userId: postUserId, onUnsave }) => {
    const { isDarkMode } = useTheme();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(Number(initialLikesCount) || 0);
    const [dragDistance, setDragDistance] = useState(0);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followLoading, setFollowLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showFullContent, setShowFullContent] = useState(false);
    const { width: screenWidth } = Dimensions.get('window');
    const { user } = useGlobalContext();
    const userId = user?.$id || user?._id;
    const navigation = useNavigation();

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => setDragDistance(gestureState.dy),
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 100) toggleModal();
                setDragDistance(0);
            },
        })
    ).current;

    const toggleModal = () => setModalVisible(!isModalVisible);

    const handleSave = async () => {
        analyticsService.logEvent(isSaved ? 'unsave_post' : 'save_post', {
            postId,
            userId,
            profilename,
            uniqueName,
        });
        try {
            const endpoint = isSaved ?
                `${API_URL}/saved-posts/unsave` :
                `${API_URL}/saved-posts/save`;
            const method = isSaved ? 'DELETE' : 'POST';
            // Optimistically update UI for unsave
            if (isSaved && onUnsave) {
                onUnsave(postId);
            }
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, postId }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                Alert.alert('Error', errorData.message || 'Failed to save post');
            } else {
                setIsSaved(!isSaved);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save post. Please try again.');
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
                // Optionally show errorText in Alert
            } else {
                // Optionally update with server count
                const result = await response.json();
                setLikesCount(Number(result.likesCount) || 0);
            }
        } catch (error) {
            // Revert optimistic update if error
            setIsLiked(prev => !prev);
            setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
        }
    };

    const handleCommentPress = () => {
        analyticsService.logEvent('view_comments', {
            postId,
            userId,
        });
        navigation.navigate('posts/[id]', { id: postId });
    };

    // Update renderImages to include modal
    const renderImages = () => {
        if (!images || images.length === 0) return null;
        const containerWidth = screenWidth - 32;
        const imageWidth = containerWidth * 0.74;
        return (
            <>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-0"
                contentContainerStyle={{ gap: 16, paddingLeft: 0 }}
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
                            <View className="absolute w-full h-full bg-gray-200 items-center justify-center">
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

    // Add share handler for modal
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
        <View className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <View className="flex-row items-start">
                <TouchableOpacity
                  className="w-10 h-10 border border-cugreen rounded-full justify-center items-center overflow-hidden mr-3"
                  onPress={() => navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName })}
                >
                                    <Image
                                        source={profilepic || 'https://example.com/default-avatar.png'}
                                        style={{ width: '100%', height: '100%', borderRadius: 999 }}
                                        contentFit="cover"
                                    />
                </TouchableOpacity>
                <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center ">
                        <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{profilename}</Text>
                        <Text className="text-gray-500 ml-1">{uniqueName ? `@${uniqueName}` : `@${profilename?.toLowerCase?.()}`}</Text>
                        <Text className="text-gray-500 ml-1">· {timeSince(new Date(timestamp))} ago</Text>
                        </View>
                        <TouchableOpacity onPress={toggleModal}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }}/>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity className="flex-row items-center mr-3" onPress={handleCommentPress}>
                        <Text className={`text-base mt-1 font-normal ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {
                                isContentLong
                                    ? `${content.slice(0, 180).replace(/\n/g, ' ')}... `
                                    : content
                            }
                            {
                                isContentLong &&
                                <Text className="text-cugreen font-semibold">show more</Text>
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View className="ml-8">
                {renderImages()}
            </View>
            <View className="flex-row ml-6 mt-2">
                <TouchableOpacity className="flex-row items-center ml-6 mr-3" onPress={handleLike}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "red" : isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
                    <Text className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>{likesCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center mr-3" onPress={handleCommentPress}>
                    <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
                    <Text className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>{commentsCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center" onPress={handleSave}>
                    <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }}/>
                </TouchableOpacity>
                <TouchableOpacity
                className="flex-row items-center ml-3"
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
                onRequestClose={toggleModal}
            >
            <TouchableWithoutFeedback onPress={toggleModal}>
                <View className="flex-1 justify-end bg-opacity-100">
                <TouchableWithoutFeedback onPress={() => {}}>
                    <View className={`p-5 rounded-t-2xl ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} style={{ transform: [{ translateY: dragDistance }] }}
                                {...panResponder.panHandlers}>
                <View className="flex-1 w-20 items-center justify-center bg-gray-950 p-0.5 mb-4 ml-[36%] mt-[-8] border border-gray-950 rounded-xl" />
                        <View className="border border-gray-300 rounded-lg mb-2">
                            <TouchableOpacity
                            className="flex-row items-center py-2 border-b border-gray-300"
                                onPress={handleSave}
                            >
                                <Text className={`ml-3 flex-1 font-medium text-base mt-0.5 mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
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
                                className="flex-row items-center py-2"
                                onPress={handleShare}
                            >
                                <Text className={`ml-3 flex-1 font-medium text-base mt-0.5 mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>Share</Text>
                                <Ionicons name="share-social-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                        </View>
                        {/* Copy Link Option */}
                        <View className="mt-4">
                            <TouchableOpacity
                                className="flex-row items-center py-2 border border-gray-300 rounded-lg mb-2 "
                                onPress={handleCopyLink}
                            >
                                <Text className={`ml-3 flex-1 font-medium text-base mt-0.5 mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>Copy Link</Text>
                                <Ionicons name="link-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                        </View>
                        <View className="border border-gray-300 rounded-lg mt-4 mb-3">
                            {/* <TouchableOpacity
                                className="flex-row items-center py-2 border-b border-gray-300"
                                onPress={() => {
                                    toggleModal();
                                }}
                            >
                                <Text className={`ml-3 flex-1 font-medium text-base mt-0.5 mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>Mute</Text>
                                <Ionicons name="volume-mute-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 10 }} />
                            </TouchableOpacity> */}
                            {userId !== postUserId && (
                                <TouchableOpacity
                                    className="flex-row items-center py-2 border-b border-gray-300"
                                    onPress={handleFollowAction}
                                    disabled={followLoading}
                                >
                                    {followLoading ? (
                                        <ActivityIndicator size="small" color={isDarkMode ? "white" : "black"} />
                                    ) : (
                                        <>
                                            <Text className={`ml-3 flex-1 font-medium text-base mt-0.5 mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
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
                                className="flex-row items-center py-2"
                                onPress={handleReport}
                            >
                                <Text className={`ml-3 flex-1 font-medium text-base mt-0.5 mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>Report</Text>
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
        <View className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-gray-200" />
                <View className="flex-1 ml-3">
                    <View className="w-2/3 h-4 bg-gray-200 rounded mb-2" />
                    <View className="w-1/3 h-3 bg-gray-200 rounded" />
                </View>
            </View>
            <View className="mt-3 w-full h-40 bg-gray-200 rounded" />
            <View className="flex-row mt-3">
                <View className="w-16 h-4 bg-gray-200 rounded mr-4" />
                <View className="w-16 h-4 bg-gray-200 rounded" />
            </View>
        </View>
    );
};

const SavedPosts = () => {
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();
    const { user } = useGlobalContext();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchSavedPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const userId = user?.$id || user?._id;
            if (!userId) {
                setPosts([]);
                setLoading(false);
                return;
            }
            const response = await fetch(
                `${API_URL}/saved-posts/user/${userId}?currentUserId=${userId}`
            );
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error: ${response.status} - ${errorText || 'Failed to fetch saved posts'}`);
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
        fetchSavedPosts();
    }, [user]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSavedPosts().finally(() => setRefreshing(false));
    };

    // Remove post from UI immediately when unsaved
    const handleUnsave = useCallback((postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    }, []);

    return (
        <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} edges={['top']}>
            {/* Header */}
            <View className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Saved Posts</Text>
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
                            onUnsave={handleUnsave}
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
                // Only show this if there is NO error and posts is empty
                !error && (
                    <View className="flex-1 justify-center items-center p-4">
                        <Icon name="bookmark-outline" size={64} color={isDarkMode ? 'gray' : '#aaa'} />
                        <Text className={`mt-4 text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            No saved posts yet
                        </Text>
                        <Text className={`mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Posts you save will appear here. Tap the bookmark icon on any post to save it.
                        </Text>
                    </View>
                )
            )}
        </SafeAreaView>
    );
};

export default SavedPosts;

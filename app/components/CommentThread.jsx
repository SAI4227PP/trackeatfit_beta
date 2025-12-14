import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const CommentLikeButton = React.memo(({ commentId, isDarkMode, initialLikesCount, initialIsLiked }) => {
    const [isCommentLiked, setIsCommentLiked] = useState(initialIsLiked);
    const [commentLikesCount, setCommentLikesCount] = useState(initialLikesCount);
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
                    profilepic: user?.avatar
                })
            };

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
            className="flex-row items-center"
            onPress={handleLikePress}
            accessibilityLabel={isCommentLiked ? "Unlike comment" : "Like comment"}
        >
            <Ionicons
                name={isCommentLiked ? "heart" : "heart-outline"}
                size={24}
                color={isCommentLiked ? "#FF0000" : isDarkMode ? "#FFFFFF" : "#000000"}
                style={{ marginRight: 2 }}
            />
            <Text className={`ml-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{commentLikesCount}</Text>
        </TouchableOpacity>
    );
});

const CommentThread = React.memo(({ content, timestamp, profilename, profilepic, commentId, likesCount, isLiked }) => {
    const { isDarkMode } = useTheme();

    const timeSince = (date) => {
        if (!(date instanceof Date) || isNaN(date)) {
            return "Invalid time";
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

    return (
        <View className="p-4 border-b border-gray-400">
            <View className="flex-row items-start">
                <View className="w-10 h-10 border border-cugreen rounded-full justify-center items-center overflow-hidden mr-3">
                    <Image
                        source={{ uri: profilepic || 'https://example.com/default-avatar.png' }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{profilename || 'Anonymous'}</Text>
                            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>{timeSince(new Date(timestamp))} ago</Text>
                        </View>
                    </View>
                    <Text className={`text-base mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{content}</Text>
                </View>
            </View>

            <View className="flex-row ml-6 mt-2">
                <View className="ml-6 mr-3">
                    <CommentLikeButton
                        commentId={commentId}
                        isDarkMode={isDarkMode}
                        initialLikesCount={likesCount}
                        initialIsLiked={isLiked}
                    />
                </View>
                <TouchableOpacity className="flex-row items-center mr-3">
                    <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center">
                    <Ionicons name="paper-plane-outline" size={24} color={isDarkMode ? "white" : "black"} style={{ marginRight: 5 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default CommentThread;

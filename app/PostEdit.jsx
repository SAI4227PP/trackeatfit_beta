import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import analyticsService from '../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

const PostEdit = () => {
  const { postId, content: initialContent, images: initialImages, userId } = useLocalSearchParams();
  const [content, setContent] = useState(initialContent || '');
  const [images, setImages] = useState(() => {
    try {
      return initialImages ? JSON.parse(initialImages) : [];
    } catch (error) {
      console.error('Error parsing images:', error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const handleUpdatePost = async () => {
    analyticsService.logEvent('edit_post', {
      postId,
      userId,
      content,
      imageCount: images.length,
    });

    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts/update/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          images,
          userId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Post updated successfully');
        navigation.goBack();
      } else {
        throw new Error(data.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', error.message || 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
      <View className={`flex-row justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cancel</Text>
        </TouchableOpacity>
        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Edit Post</Text>
        <TouchableOpacity
          onPress={handleUpdatePost}
          disabled={isLoading || !content.trim()}
        >
          <Text className={`text-base ${isLoading || !content.trim() ? 'text-gray-400' : 'text-cugreen'}`}>
            {isLoading ? 'Updating...' : 'Update'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <TextInput
          className={`text-base mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind?"
          placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          autoFocus
        />

        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {images.map((imageUrl, index) => (
              <View key={index} className="mr-4 relative">
                <Image
                  source={imageUrl}
                  style={{ width: 128, height: 128, borderRadius: 12 }}
                  contentFit="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default PostEdit;
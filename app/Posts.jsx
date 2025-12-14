import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Dimensions, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../components/CustomAlert';
import animationData from '../assets/lottie/Animation - comfirmation.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import analyticsService from '../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

const Posts = () => {
    const { isDarkMode } = useTheme();
    const { user } = useGlobalContext();
    const userId = user?.$id || user?._id;
    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState([]); // Change to array for multiple images
    const [mimeType, setMimeType] = useState(null); // State for storing MIME type
    const [isAlertVisible, setAlertVisible] = useState(false); // State to control alert visibility
    const navigation = useNavigation();
    const [hasMediaPermission, setHasMediaPermission] = useState(false); // State for media permission
    const [hasCameraPermission, setHasCameraPermission] = useState(false); // State for camera permission
    const [permissionsChecked, setPermissionsChecked] = useState(false); // State for initial permission check
    const [isUploading, setIsUploading] = useState(false); // State for uploading

    const { width: screenWidth } = Dimensions.get('window'); // Get screen width

    // Check permissions on mount
    useEffect(() => {
        checkInitialPermissions();
    }, []);

    const checkInitialPermissions = async () => {
        try {
            const [mediaStatus, cameraStatus] = await Promise.all([
                AsyncStorage.getItem('mediaPermission'),
                AsyncStorage.getItem('cameraPermission')
            ]);

            setHasMediaPermission(mediaStatus === 'granted');
            setHasCameraPermission(cameraStatus === 'granted');
            setPermissionsChecked(true);
        } catch (error) {
            console.error('Error checking initial permissions:', error);
        }
    };

    const requestPermission = async (type) => {
        try {
            const permissionMethod = type === 'media' 
                ? ImagePicker.requestMediaLibraryPermissionsAsync 
                : ImagePicker.requestCameraPermissionsAsync;
            
            const { status } = await permissionMethod();
            const granted = status === 'granted';
            
            if (granted) {
                await AsyncStorage.setItem(`${type}Permission`, 'granted');
                type === 'media' ? setHasMediaPermission(true) : setHasCameraPermission(true);
                return true;
            }

            Alert.alert(
                'Permission Required',
                `Please enable ${type === 'media' ? 'media library' : 'camera'} access in settings to ${type === 'media' ? 'pick images' : 'take photos'}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Open Settings', 
                        onPress: async () => {
                            await Linking.openSettings();
                        }
                    }
                ]
            );
            return false;
        } catch (error) {
            console.error(`Error handling ${type} permission:`, error);
            return false;
        }
    };

    const pickImage = async () => {
        analyticsService.logEvent('pick_image', {
            userId,
        });
        try {
            if (selectedImages.length >= 6) {
                Alert.alert('Limit Reached', 'Maximum 6 images allowed');
                return;
            }

            const hasPermission = hasMediaPermission || await requestPermission('media');
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsMultipleSelection: true, // Enable multiple selection
                selectionLimit: 6 - selectedImages.length, // Limit remaining slots
                // Remove aspect ratio constraint
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map(asset => ({
                    uri: asset.uri,
                    mimeType: asset.mimeType || 'image/jpeg',
                    width: asset.width,
                    height: asset.height
                }));

                setSelectedImages(prev => {
                    const combined = [...prev, ...newImages];
                    return combined.slice(0, 6); // Ensure max 6 images
                });
            }
        } catch (error) {
            console.error('Error picking images:', error);
        }
    };

    const takePhoto = async () => {
        analyticsService.logEvent('take_photo', {
            userId,
        });
        try {
            const hasPermission = hasCameraPermission || await requestPermission('camera');
            if (!hasPermission) return;

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                // Remove aspect ratio constraint
            });

            if (!result.canceled) {
                setSelectedImages(prev => [...prev, {
                    uri: result.assets[0].uri,
                    mimeType: result.assets[0].mimeType,
                    width: result.assets[0].width,
                    height: result.assets[0].height
                }]);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
        }
    };

    const uploadImagesToS3 = async (images) => {
        analyticsService.logEvent('upload_images', {
            userId,
            imageCount: images.length,
        });
        const formData = new FormData();
        
        images.forEach((image, index) => {
            const fileName = image.uri.split('/').pop();
            formData.append('images', {
                uri: image.uri,
                type: image.mimeType || 'image/jpeg',
                name: fileName
            });
        });

        const response = await fetch(`${API_URL}/posts/upload-image`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) throw new Error('Failed to upload images');
        const data = await response.json();
        return data.urls;
    };

    const handleCreatePost = async () => {
        analyticsService.logEvent('create_post', {
            userId,
            content,
            imageCount: selectedImages.length,
        });
        if (!content && selectedImages.length === 0) {
            Alert.alert('Error', 'Please add some content or images to create a post.');
            return;
        }

        setIsUploading(true);
        try {
            let imageUrls = [];
            if (selectedImages.length > 0) {
                imageUrls = await uploadImagesToS3(selectedImages);
            }

            const postPayload = {
                content,
                images: imageUrls,
                userId,
                profilename: user?.username,
                uniqueName: user?.uniqueName,
                profilepic: user?.avatar || 'https://example.com/default-avatar.png',
            };

            const postResponse = await fetch(`${API_URL}/posts/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postPayload),
            });

            if (!postResponse.ok) {
                throw new Error('Failed to create post');
            }

            // Clear form and show success
            setContent('');
            setSelectedImages([]);
            setAlertVisible(true);
            navigation.goBack(); // Optional: go back after successful post

        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const renderImages = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginLeft: 44 }}>
            {selectedImages.map((image, index) => {
                const aspectRatio = image.width / image.height;
                const displayHeight = screenWidth * 0.4;
                const displayWidth = displayHeight * aspectRatio;

                return (
                    <View key={index} style={{
                        marginRight: 8,
                        position: 'relative',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                        borderRadius: 10,
                        backgroundColor: isDarkMode ? '#222' : '#fff'
                    }}>
                        <Image
                            source={{ uri: image.uri }}
                            style={{
                                width: displayWidth,
                                height: displayHeight,
                                borderRadius: 10,
                            }}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: '#222',
                                borderRadius: 16,
                                padding: 4,
                                opacity: 0.85
                            }}
                            accessibilityLabel="Remove image"
                        >
                            <Ionicons name="close" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                );
            })}
        </ScrollView>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#18181b' : '#f9fafb' }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 16,
                    paddingVertical: 18,
                    marginTop: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#4CAF50',
                    backgroundColor: isDarkMode ? '#18181b' : '#f9fafb'
                }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ padding: 6, borderRadius: 20 }}
                        accessibilityLabel="Close"
                    >
                        <Ionicons name="close-outline" size={30} color={isDarkMode ? 'white' : '#222'} />
                    </TouchableOpacity>
                    <Text style={{
                        color: isDarkMode ? '#fff' : '#222',
                        fontWeight: '700',
                        fontSize: 20,
                        marginLeft: 18,
                        letterSpacing: 0.5
                    }}>
                        Create Post
                    </Text>
                </View>

                <View style={{ padding: 18 }}>
                    {/* User Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 }}>
                        <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            borderWidth: 2,
                            borderColor: '#4CAF50',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            marginRight: 12,
                            backgroundColor: '#fff'
                        }}>
                            <Image
                                source={{ uri: user?.avatar || 'https://example.com/default-avatar.png' }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                color: isDarkMode ? '#fff' : '#222',
                                fontWeight: '600',
                                fontSize: 16,
                                marginBottom: 2
                            }}>
                                {user?.username || 'Guest'}
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isDarkMode ? '#23272f' : '#fff',
                                borderRadius: 10,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.07,
                                shadowRadius: 2,
                                elevation: 1,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                marginRight: 8
                            }}>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        color: isDarkMode ? '#fff' : '#222',
                                        fontSize: 15,
                                        minHeight: 40,
                                        maxHeight: 120,
                                        padding: 0,
                                        backgroundColor: 'transparent'
                                    }}
                                    placeholder="Share your thoughts..."
                                    placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                                    value={content}
                                    onChangeText={setContent}
                                    onSubmitEditing={handleCreatePost}
                                    multiline
                                    textAlignVertical="top"
                                    accessibilityLabel="Post content"
                                />
                                <TouchableOpacity
                                    onPress={handleCreatePost}
                                    style={{
                                        marginLeft: 12,
                                        backgroundColor: '#4CAF50',
                                        borderRadius: 20,
                                        padding: 6,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                    accessibilityLabel="Submit post"
                                >
                                    <Ionicons name="send-outline" size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Images Preview */}
                    {selectedImages.length > 0 && renderImages()}

                    {/* Actions */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginTop: 6,
                        gap: 18
                    }}>
                        <TouchableOpacity
                            onPress={pickImage}
                            style={{
                                backgroundColor: isDarkMode ? '#23272f' : '#e5e7eb',
                                borderRadius: 12,
                                padding: 10,
                                marginHorizontal: 4
                            }}
                            accessibilityLabel="Pick images"
                        >
                            <Ionicons name="images-outline" size={24} color={isDarkMode ? '#fff' : '#222'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={takePhoto}
                            style={{
                                backgroundColor: isDarkMode ? '#23272f' : '#e5e7eb',
                                borderRadius: 12,
                                padding: 10,
                                marginHorizontal: 4
                            }}
                            accessibilityLabel="Take photo"
                        >
                            <Ionicons name="camera-outline" size={24} color={isDarkMode ? '#fff' : '#222'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Uploading Overlay */}
                {isUploading && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10
                    }}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={{ color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '500' }}>
                            Uploading your post...
                        </Text>
                    </View>
                )}

                {/* Success Alert */}
                <CustomAlert
                    visible={isAlertVisible}
                    onClose={() => setAlertVisible(false)}
                    message="Your post was published successfully!"
                    animation={animationData}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Posts;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from 'expo-router';
import analyticsService from '../../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

const AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';

const EditProfile = () => {
  const { isDarkMode } = useTheme();
  const { user, setUser, refreshUserData } = useGlobalContext();
  const userId = user?.$id || user?._id;
  const [username, setUsername] = useState(user.username);
  const [uniqueName, setUniqueName] = useState(user.uniqueName);
  const [bio, setBio] = useState(user.bio || '');
  const [link, setLink] = useState(user.link || '');
  const [isCheckingUniqueName, setIsCheckingUniqueName] = useState(false);
  const [uniqueNameStatus, setUniqueNameStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_PLACEHOLDER);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarAsset, setAvatarAsset] = useState(null); // store picked asset for later upload
  // Pick new avatar image (but do not upload yet)
  const pickAvatar = async () => {
    analyticsService.logEvent('change_avatar', {
      userId,
    });
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setAvatar(asset.uri); // show preview
        setAvatarAsset(asset); // store for upload on save
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick avatar.');
      console.error('Avatar pick error:', error);
    }
  };

  const navigation = useNavigation();

  const handleCancel = () => {
    navigation.goBack();
  };

  const handlebio = ()=> {
    navigation.navigate('favorite');
  }  // Function to check if unique name is taken or available
  const checkUniqueName = async (name) => {
    analyticsService.logEvent('check_unique_name', {
      userId,
      uniqueName: name,
    });
    if (!name) {
      console.log('Unique name is empty, skipping check.');
      setUniqueNameStatus(null); // Reset unique name status to null when name is empty
      return;
    }

    // Normalize name for comparison
    const normalizedName = name.trim().toLowerCase();
    const normalizedUserUniqueName = user.uniqueName.trim().toLowerCase();
    
    // Skip check if uniqueName hasn't changed from the current user's uniqueName (case-insensitive)
    if (normalizedName === normalizedUserUniqueName) {
      console.log('Unique name is unchanged (case-insensitive match), skipping check.');
      setUniqueNameStatus('available');
      return;
    }

    setIsCheckingUniqueName(true);
    setUniqueNameStatus(null); // Reset the status before checking

    console.log(`Checking availability for unique name: ${name}`);    
    try {
      // We already normalized the name above, so we can use it directly
      
      // Log the URL being hit for debugging
      const apiUrl = `${API_URL}/users/check-unique-name/${normalizedName}`;
      console.log(`Making API request to: ${apiUrl}`);
      
      // Fetch status from the API using the provided name
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to check unique name');
      }

      const { status } = await response.json(); // API returns { status: 'available' or 'taken' }
      console.log(`Received response: ${status}`);

      setUniqueNameStatus(status);  // Update the unique name status directly with backend response
    } catch (error) {
      console.error('Error checking unique name:', error);
      setUniqueNameStatus('Error');  // Set status to error if something goes wrong
    }

    setIsCheckingUniqueName(false);  // Stop checking after completion
  };
  // Debounce for checking unique name
  useEffect(() => {
    // Skip debounce if the name is empty
    if (!uniqueName.trim()) {
      setUniqueNameStatus(null);
      return;
    }
    
    const normalizedName = uniqueName.trim().toLowerCase();
    const normalizedUserUniqueName = user.uniqueName.trim().toLowerCase();
    
    // Immediately set as available if it's just case or whitespace differences
    if (normalizedName === normalizedUserUniqueName) {
      console.log('useEffect detected unchanged uniqueName (normalized), skipping debounce');
      setUniqueNameStatus('available');
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      console.log('Debounced check for unique name:', uniqueName);
      checkUniqueName(uniqueName); // Call checkUniqueName function
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer);
  }, [uniqueName, user.uniqueName]);

  const isValidUrl = (url) => {
    const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/;
    return pattern.test(url);
  };
  const handleDone = async () => {
    analyticsService.logEvent('save_profile', {
      userId,
      username,
      uniqueName,
      bio,
      link,
    });
    if (!username.trim() || !uniqueName.trim()) {
      console.log('Validation failed: Username or Unique Name is empty.');
      Alert.alert('Error', 'Username and Unique Name cannot be empty.');
      return;
    }

    if (uniqueNameStatus === 'taken') {
      console.log('Validation failed: Unique Name is already taken.');
      Alert.alert('Error', 'Unique Name is already taken. Choose another.');
      return;
    }
    
    // If we're still checking the uniqueName, wait for it to complete
    if (isCheckingUniqueName) {
      console.log('Still checking unique name, waiting...');
      Alert.alert('Please wait', 'Still checking if your unique name is available.');
      return;
    }

    // If link is empty, set it as null
    const validLink = link && isValidUrl(link) ? link : null;

    setIsLoading(true);
    console.log('Saving profile changes...');
    try {
      let avatarUrl = user.avatar;
      // If avatarAsset is set, upload to S3 now
      if (avatarAsset) {
        const formData = new FormData();
        const fileName = avatarAsset.uri.split('/').pop();
        formData.append('image', {
          uri: avatarAsset.uri,
          type: avatarAsset.mimeType || 'image/jpeg',
          name: fileName,
        });
        if (userId) formData.append('userId', userId);
        if (user.uniqueName) formData.append('uniqueName', user.uniqueName);
        const uploadRes = await fetch(`${API_URL}/users/upload-avatar`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (!uploadRes.ok) throw new Error('Failed to upload avatar');
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          avatarUrl = uploadData.url;
        }
      }

      const response = await fetch(`${API_URL}/users/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            username,
            uniqueName: uniqueName.trim().toLowerCase(),
            bio,
            link: validLink,
            avatar: avatarUrl,
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setUser({
        ...user,
        username,
        uniqueName: uniqueName.trim().toLowerCase(),
        bio,
        link: validLink,
        avatar: avatarUrl,
      });
      // Refresh user data from backend and update global context/cache
      if (typeof refreshUserData === 'function') {
        refreshUserData();
      }

      console.log('Profile updated successfully:', { username, uniqueName, bio, link: validLink, avatar: avatarUrl });
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.message || 'Failed to save profile changes. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}
      style={{ paddingHorizontal: 0 }}
    >
      {/* Header */}
      <View
        className={`flex-row items-center justify-between px-6 py-4`}
        style={{
          backgroundColor: isDarkMode ? '#18181b' : '#fff',
          borderBottomWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#e5e7eb',
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <TouchableOpacity onPress={handleCancel} className="p-1 rounded-full">
          <Ionicons name="arrow-back" size={26} color={isDarkMode ? "#fff" : "#18181b"} />
        </TouchableOpacity>
        <Text className={`text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleDone}
          disabled={isCheckingUniqueName || isLoading}
          className={`px-4 py-2 rounded-full ${isCheckingUniqueName || uniqueNameStatus === 'taken' ? 'bg-gray-300' : 'bg-cugreen'} `}
          style={{ minWidth: 80, alignItems: 'center' }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#fff"} />
          ) : (
            <Text className={`text-base font-semibold ${isCheckingUniqueName || uniqueNameStatus === 'taken' ? 'text-gray-500' : 'text-white'}`}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-start',
            paddingHorizontal: 0,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Card */}
          <View
            className="mx-5"
            style={{
              backgroundColor: isDarkMode ? '#23272f' : '#fff',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              marginBottom: 24,
            }}
          >
            {/* Avatar Section */}
            <View className="items-center mb-8">
              <TouchableOpacity
                onPress={pickAvatar}
                disabled={isUploadingAvatar}
                style={{
                  borderWidth: 3,
                  borderColor: isDarkMode ? '#22c55e' : '#22c55e',
                  borderRadius: 999,
                  padding: 4,
                  backgroundColor: isDarkMode ? '#18181b' : '#f3f4f6',
                  shadowColor: '#22c55e',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                accessibilityLabel="Change profile picture"
              >
                <Image
                  source={{ uri: avatar || AVATAR_PLACEHOLDER }}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    backgroundColor: '#e5e7eb',
                  }}
                  resizeMode="cover"
                />
                {isUploadingAvatar && (
                  <View style={{
                    position: 'absolute',
                    left: 0, right: 0, top: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    borderRadius: 42,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ActivityIndicator size="small" color="#22c55e" />
                  </View>
                )}
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#22c55e',
                  borderRadius: 16,
                  padding: 4,
                  borderWidth: 2,
                  borderColor: '#fff',
                }}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text className={`mt-4 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> 
                {username}
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}> 
                @{uniqueName}
              </Text>
            </View>

            {/* Input Fields */}
            {/* Username */}
            <View className="mb-6">
              <Text className={`mb-2 ml-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Username
              </Text>
              <View
                className={`flex-row items-center px-3 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
                style={{ height: 48 }}
              >
                <MaterialIcons name="person" size={20} color={isDarkMode ? "#a3a3a3" : "#6b7280"} style={{ marginRight: 8 }} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  className={`flex-1 text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  style={{ paddingVertical: 0 }}
                />
              </View>
            </View>

            {/* Unique Name */}
            <View className="mb-6">
              <Text className={`mb-2 ml-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Unique Name
              </Text>
              <View
                className={`flex-row items-center px-3 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
                style={{ height: 48 }}
              >
                <MaterialIcons name="alternate-email" size={20} color={isDarkMode ? "#a3a3a3" : "#6b7280"} style={{ marginRight: 8 }} />
                <TextInput
                  value={uniqueName}
                  onChangeText={setUniqueName}
                  onBlur={() => {
                    if (uniqueName !== uniqueName.trim()) setUniqueName(uniqueName.trim());
                  }}
                  placeholder="Choose a unique name"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`flex-1 text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  style={{ paddingVertical: 0 }}
                />
                <View style={{ marginLeft: 8 }}>
                  {isCheckingUniqueName ? (
                    <ActivityIndicator size="small" color="gray" />
                  ) : uniqueNameStatus === 'available' ? (
                    <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                  ) : uniqueNameStatus === 'taken' ? (
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  ) : null}
                </View>
              </View>
              {/* Status Messages */}
              {uniqueNameStatus === 'taken' && (
                <Text className="text-red-500 text-xs mt-1 ml-1">
                  This name is already taken. Choose another.
                </Text>
              )}
              {uniqueNameStatus === 'available' && (
                <Text className="text-green-500 text-xs mt-1 ml-1">
                  {uniqueName.trim().toLowerCase() === user.uniqueName.trim().toLowerCase()
                    ? "This is your current unique name."
                    : "This name is available."}
                </Text>
              )}
              {uniqueNameStatus === 'Error' && (
                <Text className="text-amber-500 text-xs mt-1 ml-1">
                  Couldn't verify availability. Try again later.
                </Text>
              )}
            </View>

            {/* Bio */}
            <View className="mb-6">
              <Text className={`mb-2 ml-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Bio
              </Text>
              <View
                className={`px-3 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
                style={{ minHeight: 48, paddingTop: 8, paddingBottom: 8 }}
              >
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  multiline
                  style={{ minHeight: 36, paddingVertical: 0 }}
                />
              </View>
            </View>

            {/* Link */}
            <View className="mb-2">
              <Text className={`mb-2 ml-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Link
              </Text>
              <View
                className={`flex-row items-center px-3 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
                style={{ height: 48 }}
              >
                <MaterialIcons name="link" size={20} color={isDarkMode ? "#a3a3a3" : "#6b7280"} style={{ marginRight: 8 }} />
                <TextInput
                  value={link}
                  onChangeText={setLink}
                  placeholder="Add a website or profile link"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  className={`flex-1 text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  style={{ paddingVertical: 0 }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;

import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, View } from 'react-native'
import { useGlobalContext } from '../../../context/GlobalProvider'
import { useTheme } from '../../../context/ThemeContext'

const API_URL = "https://trackeatfit.onrender.com";

const AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?background=E5E7EB&color=374151&name=';

const formatTimeAgo = (timestamp) => {
  try {
    if (!timestamp) return 'just now';
    
    const now = new Date();
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) return 'invalid date';
    
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'just now';
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'just now';
  }
};

const ForYou = () => {
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();
  const [activeTab, setActiveTab] = useState('follows');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followNotifications, setFollowNotifications] = useState([]);

  const tabs = [
    { id: 'follows', label: 'Follows' },
    // { id: 'replies', label: 'Replies' },
    // { id: 'mentions', label: 'Mentions' },
    // { id: 'quotes', label: 'Quotes' },
    // { id: 'reposts', label: 'Reposts' }
  ];  const emptyStateMessages = {
    replies: {
      icon: 'chatbubble-ellipses-outline',
      title: 'No replies yet',
      message: 'When someone replies to your posts or comments, you\'ll see them here.'
    },
    mentions: {
      icon: 'at',
      title: 'No mentions yet',
      message: 'When someone mentions you in a post, you\'ll find it here.'
    },
    quotes: {
      icon: 'chatbox-outline',
      title: 'No quotes yet',
      message: 'When someone quotes your posts, they\'ll appear here.'
    },
    reposts: {
      icon: 'share-outline',
      title: 'No reposts yet',
      message: 'When someone reposts your content, you\'ll see it here.'
    }
  };

  const fetchFollowNotifications = async () => {
    try {
      setLoading(true);
      const userId = user?.$id || user?._id;
      if (!userId) return;

      const response = await fetch(`${API_URL}/api/following/notifications/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
      console.log('Follow notifications response:', data);
      setFollowNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFollowNotifications();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'follows') {
      fetchFollowNotifications();
    }
  }, [activeTab, user]);
  const navigation = useNavigation();

  const renderAvatar = (name, avatarUrl) => (
    <View
      style={{
        borderWidth: 2,
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
        borderRadius: 999,
        padding: 2,
        backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',
        marginRight: 0,
      }}
    >
      <Image
        source={{ uri: avatarUrl || `${AVATAR_PLACEHOLDER}${encodeURIComponent(name || 'U')}` }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isDarkMode ? '#1F2937' : '#E5E7EB',
        }}
      />
    </View>
  );

  // Helper for badge (shows only if there are new notifications)
  const renderBadge = (count) =>
    count > 0 ? (
      <View
        style={{
          backgroundColor: '#22d3ee',
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 6,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{count}</Text>
      </View>
    ) : null;

  const renderFollowActivity = (activity, idx, arr) => (
    <Pressable
      key={activity._id}
      onPress={() => navigation.navigate('posts/UserProfile/[uniqueName]', { uniqueName: activity.followerUniqueName })}
      style={{
        marginHorizontal: 16,
        marginTop: idx === 0 ? 16 : 0,
        marginBottom: idx === arr.length - 1 ? 16 : 0,
        borderRadius: 18,
        backgroundColor: isDarkMode ? '#18181b' : '#fff',
        shadowColor: isDarkMode ? '#000' : '#9ca3af',
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        overflow: 'hidden',
        transform: [{ scale: 1 }],
      }}
      android_ripple={{ color: isDarkMode ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.06)' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 16 }}>
        {renderAvatar(activity.followerName, activity.followerAvatar)}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{
              fontWeight: '700',
              fontSize: 16,
              color: isDarkMode ? '#fff' : '#18181b',
              fontFamily: 'System',
              letterSpacing: 0.1,
            }}>{activity.followerName}</Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginLeft: 4 }}>@{activity.followerUniqueName}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginLeft: 8 }}>·</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginLeft: 8 }}>{formatTimeAgo(activity.timestamp)}</Text>
          </View>
          <Text style={{
            fontSize: 15,
            color: isDarkMode ? '#D1D5DB' : '#4B5563',
            marginTop: 4,
            lineHeight: 21,
          }}>
            <Ionicons name="person-add-outline" size={16} color={isDarkMode ? '#60A5FA' : '#2563EB'} /> started following you
          </Text>
        </View>
      </View>
      {/* Divider between cards */}
      {idx < arr.length - 1 && (
        <View style={{ height: 1, backgroundColor: isDarkMode ? '#23272f' : '#f1f5f9', marginHorizontal: 16 }} />
      )}
    </Pressable>
  );

  const renderContent = () => {
    if (activeTab === 'follows') {
      if (loading) {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
          </View>
        );
      }

      if (followNotifications.length === 0) {
        return (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 32,
              backgroundColor: isDarkMode ? '#18181b' : '#F3F4F6',
              borderRadius: 16,
              margin: 24,
              padding: 24,
              shadowColor: isDarkMode ? '#000' : '#9ca3af',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
          >
            <Ionicons name="notifications-off-outline" size={48} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              marginTop: 16,
              color: isDarkMode ? '#D1D5DB' : '#374151',
            }}>
              No new follow notifications
            </Text>
            <Text style={{
              marginTop: 8,
              textAlign: 'center',
              color: '#6B7280',
              maxWidth: 280,
            }}>
              When someone follows you, you'll see it here.
            </Text>
          </View>
        );
      }

      return (
        <View>
          {followNotifications.map((notification, idx) =>
            renderFollowActivity(notification, idx, followNotifications)
          )}
        </View>
      );
    }
    // For non-follow tabs, show empty state
    const emptyState = emptyStateMessages[activeTab];
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          minHeight: 500,
          backgroundColor: isDarkMode ? '#18181b' : '#F3F4F6',
          borderRadius: 16,
          margin: 24,
          padding: 24,
          shadowColor: isDarkMode ? '#000' : '#9ca3af',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <Ionicons
          name={emptyState.icon}
          size={64}
          color={isDarkMode ? '#4B5563' : '#9CA3AF'}
        />
        <Text style={{
          marginTop: 16,
          fontSize: 20,
          fontWeight: '600',
          textAlign: 'center',
          color: isDarkMode ? '#fff' : '#000',
        }}>
          {emptyState.title}
        </Text>
        <Text style={{
          marginTop: 8,
          textAlign: 'center',
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          maxWidth: 280,
        }}>
          {emptyState.message}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#111827', '#18181b'] : ['#f3f4f6', '#fff']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 16,
            backgroundColor: 'transparent',
          }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                letterSpacing: 0.5,
                color: isDarkMode ? '#fff' : '#18181b',
                fontFamily: 'System',
              }}
            >
              Activity
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: isDarkMode ? '#27272a' : '#e5e7eb' }} />

          {/* Navigation Tabs */}
          <View style={{
            backgroundColor: 'transparent',
            paddingHorizontal: 8,
            paddingVertical: 8,
          }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 2 }}
            >
              {tabs.map(tab => (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  android_ripple={{ color: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    marginHorizontal: 4,
                    borderRadius: 999,
                    backgroundColor:
                      activeTab === tab.id
                        ? (isDarkMode ? '#2563EB' : '#2563EB')
                        : (isDarkMode ? '#18181b' : '#F3F4F6'),
                    borderWidth: activeTab === tab.id ? 0 : 1,
                    borderColor: isDarkMode ? '#27272a' : '#e5e7eb',
                    shadowColor: activeTab === tab.id ? '#2563EB' : 'transparent',
                    shadowOpacity: activeTab === tab.id ? 0.12 : 0,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: activeTab === tab.id ? 2 : 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: activeTab === tab.id
                        ? '#fff'
                        : (isDarkMode ? '#9CA3AF' : '#374151'),
                      fontWeight: activeTab === tab.id ? '700' : '500',
                      fontSize: 15,
                      letterSpacing: 0.2,
                    }}
                  >
                    {tab.label}
                  </Text>
                  {tab.id === 'follows' && renderBadge(followNotifications.length)}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Activity Feed */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                enabled={activeTab === 'follows'}
                tintColor={isDarkMode ? '#fff' : '#000'}
              />
            }
          >
            {renderContent()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default ForYou
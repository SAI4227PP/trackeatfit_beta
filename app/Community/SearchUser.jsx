import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Keyboard, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import analyticsService from '../../utils/firebaseAnalytics'

const API_URL = "https://trackeatfit.onrender.com";

const styles = {
  safeArea: (isDarkMode) => ({
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#fff',
  }),
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : 70,
  },
  innerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  flex1: {
    flex: 1,
  },
  searchBar: (isDarkMode) => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
  }),
  searchInput: (isDarkMode) => ({
    flex: 1,
    marginLeft: 4,
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 16,
  }),
  userItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    flex: 1,
  },
  userImageContainer: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: (isDarkMode) => ({
    color: isDarkMode ? '#fff' : '#000',
    fontWeight: '600',
    fontSize: 16,
  }),
  userUsername: {
    color: '#6B7280',
    fontSize: 14,
  },
  followButton: (isDarkMode) => ({
    borderWidth: 1,
    borderColor: '#6366F1',
    backgroundColor: isDarkMode ? '#fff' : '#000',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 16,
  }),
  followButtonText: (isDarkMode) => ({
    color: isDarkMode ? '#000' : '#fff',
    fontWeight: '600',
    fontSize: 13,
  }),
  dividerContainer: {
    marginLeft: 53,
    marginRight: 8,
    marginVertical: 10,
  },
  divider: (isDarkMode) => ({
    height: 0.5,
    backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
  }),
  flatList: {
    flex: 1,
    marginTop: 8,
  },
  activityIndicator: {
    paddingVertical: 16,
  },
};

const SearchUser = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    setCurrentPage(1);
    setSearchResults([]);
    const timeoutId = setTimeout(() => {
      if (searchQuery) handleSearch(1, true);
      else setSearchResults([]);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (page = 1, reset = false) => {
    analyticsService.logEvent('search_user', {
      query: searchQuery,
      page,
      reset,
    });
    try {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsLoading(true);
      const response = await fetch(`${API_URL}/UserSearch/search?query=${searchQuery}&page=${page}`);
      const data = await response.json();
      setSearchResults(prev => reset ? data.users : [...prev, ...data.users]);
      setHasMore(data.pagination.hasMore);
      setCurrentPage(data.pagination.currentPage);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadMore = () => {
    if (hasMore && !isLoading) {
      handleSearch(currentPage + 1);
    }
  }

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.activityIndicator}>
        <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#000'} />
      </View>
    );
  }
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => router.push({
        pathname: 'posts/UserProfile/[uniqueName]',
        params: {
          uniqueName: item.profile.uniqueName,
        }
      })}
      style={styles.userItem}
    >
      <View style={styles.userRow}>
        <View style={styles.userInfoRow}>
          <View style={styles.userImageContainer}>
            <Image 
              source={{ uri: item.profile.avatar || 'https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png' }}
              style={styles.userImage}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName(isDarkMode)}>{item.profile.username}</Text>
            <Text style={styles.userUsername}>@{item.profile.uniqueName}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.followButton(isDarkMode)}
          onPress={(e) => {
            e.stopPropagation();
            analyticsService.logEvent('follow_user_search', {
              uniqueName: item.profile.uniqueName,
              username: item.profile.username,
            });
            console.log('Follow', item.profile.uniqueName);
          }}
        >
          <Text style={styles.followButtonText(isDarkMode)}>Follow</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dividerContainer}>
        <View style={styles.divider(isDarkMode)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea(isDarkMode)}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.innerContainer}>
            <View style={styles.row}>
              <TouchableWithoutFeedback onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
              </TouchableWithoutFeedback>
              <View style={styles.flex1}>
                <View style={styles.searchBar(isDarkMode)}>
                  <Ionicons name="search" size={20} color={isDarkMode ? '#9CA3AF' : '#71767B'} />
                  <TextInput
                    style={styles.searchInput(isDarkMode)}
                    placeholder="Search users"
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#71767B'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    onSubmitEditing={() => handleSearch(1, true)}
                    autoFocus
                  />
                </View>
              </View>
            </View>
          </View>          
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={item => item._id}
            style={styles.flatList}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  )
}

export default SearchUser
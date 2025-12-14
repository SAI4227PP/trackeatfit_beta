import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, Keyboard, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { useTheme } from '../../../context/ThemeContext'

const API_URL = "https://trackeatfit.onrender.com";

const styles = {
  container: (isDarkMode) => ({
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#fff',
  }),
  scrollView: {
    paddingBottom: Platform.OS === 'ios' ? 0 : 70,
  },
  innerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerText: (isDarkMode) => ({
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  }),
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
    marginLeft: 8,
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 16,
  }),
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: (isDarkMode) => ({
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  }),
  emptyUsersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyUsersText: (isDarkMode) => ({
    color: isDarkMode ? '#9CA3AF' : '#6B7280',
    marginTop: 12,
    fontSize: 16,
  }),
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
  userFollowers: {
    color: '#6B7280',
    fontSize: 13,
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
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // const popularUsers = [
  //   {
  //     id: 1,
  //     name: 'John Fitness',
  //     username: '@johnfit',
  //     followers: '10.2K',
  //     image: 'https://randomuser.me/api/portraits/men/1.jpg'
  //   },
  //   {
  //     id: 2,
  //     name: 'Sarah Health',
  //     username: '@sarahhealth',
  //     followers: '8.5K',
  //     image: 'https://randomuser.me/api/portraits/women/1.jpg'
  //   },
  //   {
  //     id: 3,
  //     name: 'Mike Nutrition',
  //     username: '@mikenutrition',
  //     followers: '15.7K',
  //     image: 'https://randomuser.me/api/portraits/men/2.jpg'
  //   },
  //   {
  //     id: 4,
  //     name: 'Emma Wellness',
  //     username: '@emmawellness',
  //     followers: '12.3K',
  //     image: 'https://randomuser.me/api/portraits/women/2.jpg'
  //   },
  //   {
  //     id: 5,
  //     name: 'Alex Trainer',
  //     username: '@alexfitpro',
  //     followers: '20.1K',
  //     image: 'https://randomuser.me/api/portraits/men/3.jpg'
  //   },
  //   {
  //     id: 6,
  //     name: 'Lisa Diet',
  //     username: '@lisadiet',
  //     followers: '9.8K',
  //     image: 'https://randomuser.me/api/portraits/women/3.jpg'
  //   }
  // ];
  const popularUsers = []; // Empty state for demonstration

  const handleSearchPress = () => {
    router.push('/Community/SearchUser');
  }

  return (
    <SafeAreaView style={styles.container(isDarkMode)}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.innerContainer}>
            <Text style={styles.headerText(isDarkMode)}>Search</Text>
            <TouchableOpacity onPress={handleSearchPress}>
              <View style={styles.searchBar(isDarkMode)}>
                <Ionicons name="search" size={20} color={isDarkMode ? '#9CA3AF' : '#71767B'} />
                <TextInput
                  style={styles.searchInput(isDarkMode)}
                  placeholder="Search"
                  placeholderTextColor={isDarkMode ? '#9CA3AF' : '#71767B'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  enablesReturnKeyAutomatically
                  editable={false}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle(isDarkMode)}>Popular Users</Text>
              {popularUsers.length === 0 ? (
                <View style={styles.emptyUsersContainer}>
                  <Ionicons name="people-outline" size={48} color={isDarkMode ? '#6B7280' : '#D1D5DB'} />
                  <Text style={styles.emptyUsersText(isDarkMode)}>
                    No popular users found.
                  </Text>
                </View>
              ) : (
                popularUsers.map((user, index) => (
                  <View key={user.id}>
                    <TouchableOpacity 
                      style={styles.userRow}
                      onPress={() => router.push(`Community/UserProfile/`)}
                    >
                      <View style={styles.userInfoRow}>
                        <View style={styles.userImageContainer}>
                          <Image
                            source={{ uri: user.image }}
                            style={styles.userImage}
                          />
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={styles.userName(isDarkMode)}>{user.name}</Text>
                          <Text style={styles.userUsername}>{user.username}</Text>
                          <Text style={styles.userFollowers}>{user.followers} followers</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.followButton(isDarkMode)}
                        onPress={(e) => {
                          e.stopPropagation();
                          console.log('Follow', user.id);
                        }}
                      >
                        <Text style={styles.followButtonText(isDarkMode)}>Follow</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {index < popularUsers.length - 1 && (
                      <View style={styles.dividerContainer}>
                        <View style={styles.divider(isDarkMode)} />
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  )
}

export default Search
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useGlobalContext } from '../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

const Favorite = () => {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useGlobalContext();

  const filters = ['All', 'Recipes', 'Foods'];

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const userId = user?.$id || user?._id;
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_URL}/favorites/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this item from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/favorites/${favoriteId}`, {
                method: 'DELETE',
              });
              if (!response.ok) {
                throw new Error('Failed to remove favorite');
              }
              // Update local state to remove the item
              setFavorites(favorites.filter(fav => fav._id !== favoriteId));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          }
        }
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="heart" size={40} color="#556B2F" />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding your favorite recipes, meals, and foods
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('(tabs)')}
      >
        <Text style={styles.exploreButtonText}>Explore Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  const handleItemPress = (item) => {
    if (item.itemType === 'recipe') {
      navigation.navigate('RecipeDetails', { recipeId: item.itemId });
    } else {
      navigation.navigate('FoodDetails', { foodId: item.itemId });
    }
  };

  const getFilteredFavorites = () => {
    if (activeFilter === 'All') return favorites;
    const itemType = activeFilter === 'Recipes' ? 'recipe' : 'food';
    return favorites.filter(fav => fav.itemType === itemType);
  };

  const renderFavoriteItem = (item, index, arr) => (
    <TouchableOpacity 
      key={item._id}
      style={[styles.favoriteCard, {
        width: '48%',
        elevation: 2,
        marginRight: (index % 2 === 0) && (index !== arr.length - 1) ? '4%' : 0
      }]}
      onPress={() => handleItemPress(item)}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/300' }}
        style={styles.favoriteImage}
        resizeMode="cover"
      />
      <View style={styles.favoriteContent}>
        <Text style={styles.favoriteTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.favoriteRow}>
          <Text style={styles.favoriteCalories}>
            {item.nutrition?.calories || 0} kcal
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item._id)}
            style={styles.trashButton}
          >
            <Icon name="trash-2" size={16} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#556B2F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Favorites
          </Text>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterButton, activeFilter === filter ? styles.filterButtonActive : styles.filterButtonInactive]}
            >
              <Text
                style={[styles.filterText, activeFilter === filter ? styles.filterTextActive : styles.filterTextInactive]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {getFilteredFavorites().length > 0 ? (
        <ScrollView contentContainerStyle={styles.contentScroll}>
          <View style={styles.favoriteList}>
            {getFilteredFavorites().map((item, index, arr) =>
              renderFavoriteItem(item, index, arr)
            )}
          </View>
        </ScrollView>
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151', // text-gray-800
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterButton: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterButtonActive: {
    backgroundColor: '#556B2F', // oliveDrab
  },
  filterButtonInactive: {
    backgroundColor: '#F3F4F6', // bg-gray-100
  },
  filterText: {
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterTextInactive: {
    color: '#4B5563', // text-gray-600
  },
  contentScroll: {
    flexGrow: 1,
    paddingTop: 16,
  },
  favoriteList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  favoriteImage: {
    width: '100%',
    height: 128,
  },
  favoriteContent: {
    padding: 12,
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  favoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteCalories: {
    fontSize: 12,
    color: '#6B7280', // text-gray-500
  },
  trashButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#4B5563', // text-gray-600
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280', // text-gray-500
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#556B2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

export default Favorite;
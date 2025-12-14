import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "https://trackeatfit.onrender.com";

// --- Constants ---
const CATEGORY_LIST = [
  { name: 'All', image: null },
  { name: 'Cardio', image: 'https://cdn.trackeatfit.xyz/exercisetypes/cardio.webp' },
  { name: 'Strength', image: 'https://cdn.trackeatfit.xyz/exercisetypes/strength.webp' },
  { name: 'Plyometrics', image: 'https://cdn.trackeatfit.xyz/exercisetypes/Plyometrics.webp' },
  { name: 'Stretching', image: 'https://cdn.trackeatfit.xyz/exercisetypes/stretching.webp' },
  { name: 'Yoga', image: 'https://cdn.trackeatfit.xyz/exercisetypes/yoga.webp' },
  { name: 'Weightlifting', image: 'https://cdn.trackeatfit.xyz/exercisetypes/weightlifting.webp' },
  { name: 'Aerobic', image: 'https://cdn.trackeatfit.xyz/exercisetypes/aerobic.webp' },
];

// --- Helper Functions ---
const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');

function MenuModal({ visible, onClose, onOptionSelect }) {
  const isDarkMode = false;
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                backgroundColor: isDarkMode ? '#111827' : '#fff',
              }}
            >
              <View style={{
                flex: 1,
                width: 80,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a',
                padding: 1,
                marginBottom: 16,
                marginLeft: '36%',
                marginTop: -8,
                borderWidth: 1,
                borderColor: '#0f172a',
                borderRadius: 16,
              }} />
              {/* Sort By */}
              <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, marginBottom: 8 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}
                  onPress={() => onOptionSelect('sort_difficulty')}
                  accessibilityLabel="Sort by Difficulty"
                  accessible
                >
                  <Text style={{ marginLeft: 12, flex: 1, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>Sort by Difficulty</Text>
                  <Ionicons name="barbell-outline" size={24} color={isDarkMode ? 'white' : 'black'} style={{ marginRight: 10 }} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                  onPress={() => onOptionSelect('sort_popular')}
                  accessibilityLabel="Sort by Most Popular"
                  accessible
                >
                  <Text style={{ marginLeft: 12, flex: 1, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>Sort by Most Popular</Text>
                  <Ionicons name="flame-outline" size={24} color={isDarkMode ? 'white' : 'black'} style={{ marginRight: 10 }} />
                </TouchableOpacity>
              </View>
              {/* Other Options */}
              <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, marginBottom: 8 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}
                  onPress={() => onOptionSelect('recently_viewed')}
                  accessibilityLabel="Recently Viewed"
                  accessible
                >
                  <Text style={{ marginLeft: 12, flex: 1, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>Recently Viewed</Text>
                  <Ionicons name="time-outline" size={24} color={isDarkMode ? 'white' : 'black'} style={{ marginRight: 10 }} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}
                  onPress={() => onOptionSelect('add_custom')}
                  accessibilityLabel="Add Custom Exercise"
                  accessible
                >
                  <Text style={{ marginLeft: 12, flex: 1, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>Add Custom Exercise</Text>
                  <Ionicons name="add-circle-outline" size={24} color={isDarkMode ? 'white' : 'black'} style={{ marginRight: 10 }} />
                </TouchableOpacity>
              </View>
              {/* Filter */}
              <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, marginBottom: 8 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}
                  onPress={() => onOptionSelect('filter_equipment')}
                  accessibilityLabel="Filter by Equipment"
                  accessible
                >
                  <Text style={{ marginLeft: 12, flex: 1, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>Filter by Equipment</Text>
                  <Ionicons name="fitness-outline" size={24} color={isDarkMode ? 'white' : 'black'} style={{ marginRight: 10 }} />
                </TouchableOpacity>
              </View>
              {/* Help */}
              <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, marginBottom: 8 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}
                  onPress={() => onOptionSelect('help')}
                  accessibilityLabel="Help / Exercise Guide"
                  accessible
                >
                  <Text style={{ marginLeft: 12, flex: 1, fontWeight: '500', fontSize: 16, color: isDarkMode ? '#fff' : '#000' }}>Help / Exercise Guide</Text>
                  <Ionicons name="help-circle-outline" size={24} color={isDarkMode ? 'white' : 'black'} style={{ marginRight: 10 }} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function Exercises() {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortByDifficulty, setSortByDifficulty] = useState(false);
  const [sortByPopular, setSortByPopular] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState(null);
  const [networkSlow, setNetworkSlow] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingMore = useRef(false);

  // --- Effects ---
  useEffect(() => {
    if (!loading) {
      setNetworkSlow(false);
      return;
    }
    const timer = setTimeout(() => {
      if (loading) setNetworkSlow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  // --- Data Fetch ---
  const fetchExercises = useCallback(
    async (category = 'All', pageNum = 1, append = false) => {
      // Remove console.time and console.timeEnd (not supported in React Native)
      console.log('fetchExercises called', { category, pageNum, append });
      if (append) {
        if (isFetchingMore.current) {
          console.log('Already fetching more, skipping fetch');
          return;
        }
        isFetchingMore.current = true;
      } else {
        if (loading) {
          return;
        }
        setLoading(true);
      }
      try {
        let url = '';
        if (category === 'All') {
          url = `${API_URL}/api/v3/v3_exercises?page=${pageNum}&limit=10`;
        } else {
          url = `${API_URL}/api/v3/v3_exercises/exercisetype/${category.toLowerCase()}?page=${pageNum}&limit=10`;
        }
        const res = await fetch(url);
        const data = await res.json();
        const newExercises = data.data || [];
        setTotal(data.total || 0);

        // Only update page if fetch is successful
        setPage(data.page || pageNum);

        if (append) {
          setExercises((prev) => [...prev, ...newExercises]);
        } else {
          setExercises(newExercises);
        }
        setHasMore(data.page < data.totalPages);
      } catch (e) {
        if (!append) setExercises([]);
        setTotal(0);
        setHasMore(false);
        Alert.alert('Error', 'Failed to load exercises. Please try again.');
      } finally {
        if (append) {
          isFetchingMore.current = false;
        } else {
          setLoading(false);
          setRefreshing(false);
        }
        // Removed console.timeEnd
      }
    },
    [loading]
  );

  // --- Handlers ---
  const handleMenuOption = (option) => {
    setMenuVisible(false);
    switch (option) {
      case 'sort_difficulty':
        setSortByDifficulty((prev) => !prev);
        setSortByPopular(false);
        break;
      case 'sort_popular':
        setSortByPopular((prev) => !prev);
        setSortByDifficulty(false);
        break;
      case 'filter_equipment': {
        const equipmentOptions = Array.from(new Set(exercises.map((e) => e.equipment).filter(Boolean)));
        Alert.alert(
          'Filter by Equipment',
          'Select equipment to filter',
          [
            ...equipmentOptions.map((eq) => ({
              text: eq,
              onPress: () => setEquipmentFilter(eq),
            })),
            { text: 'Clear', onPress: () => setEquipmentFilter(null), style: 'destructive' },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        break;
      }
      case 'add_custom':
        Alert.alert('Add Custom', 'Navigate to add custom exercise screen.');
        break;
      case 'help':
        navigation.navigate('screens/ExerciseGuide');
        break;
      default:
        break;
    }
  };

  const handleCategoryPress = (categoryName) => {
    setSelectedCategory(categoryName);
    setPage(1);
    setHasMore(true);
  };

  // --- Pagination Handler ---
  const handleLoadMore = () => {
    console.log('handleLoadMore called', { loading, hasMore, page, isFetchingMore: isFetchingMore.current });
    // Only fetch if not already fetching more and has more data
    if (!isFetchingMore.current && hasMore) {
      console.log('Fetching next page:', page + 1);
      fetchExercises(selectedCategory, page + 1, true);
    } else {
      console.log('Not fetching: already fetching, or no more data', { hasMore, isFetchingMore: isFetchingMore.current });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExercises(selectedCategory, 1, false);
  };

  // --- Filtering & Sorting ---
  const filteredExercises = useMemo(() => {
    let result = exercises.filter((exercise) => {
      const matchesSearch =
        (exercise.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.target?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.equipment?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesEquipment = equipmentFilter ? exercise.equipment === equipmentFilter : true;
      return matchesSearch && matchesEquipment;
    });

    if (sortByDifficulty) {
      const diffOrder = ['beginner', 'intermediate', 'advanced'];
      const getDiffIndex = (ex) => {
        if (Array.isArray(ex.idealFor) && ex.idealFor.length > 0) {
          const indices = ex.idealFor
            .map((val) => diffOrder.findIndex((d) => val?.toLowerCase() === d))
            .filter((idx) => idx !== -1);
          return indices.length > 0 ? Math.min(...indices) : -1;
        }
        return -1;
      };
      result = [...result].sort((a, b) => {
        const aIdx = getDiffIndex(a);
        const bIdx = getDiffIndex(b);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    } else if (sortByPopular) {
      result = [...result].sort((a, b) => {
        const aRating = typeof a.rating === 'number' ? a.rating : -Infinity;
        const bRating = typeof b.rating === 'number' ? b.rating : -Infinity;
        return bRating - aRating;
      });
    }
    return result;
  }, [exercises, searchQuery, equipmentFilter, sortByDifficulty, sortByPopular]);

  // --- Effects: Fetch on filter/category/search change ---
  useEffect(() => {
    setExercises([]);
    setPage(1);
    setHasMore(true);
    fetchExercises(selectedCategory, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, equipmentFilter, searchQuery]);

  // --- Renderers ---
  const renderExerciseCard = ({ item: exercise, index }) => {
    const handlePress = () => {
      if (exercise._id) {
        navigation.navigate('screens/Exercise', { exerciseId: exercise._id });
      }
    };
    return (
      <TouchableOpacity
        key={exercise._id || index}
        activeOpacity={0.92}
        onPress={handlePress}
        style={{
          marginBottom: 22,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.13,
          shadowRadius: 8,
          elevation: 6,
          borderRadius: 24,
          overflow: 'hidden',
        }}
        accessibilityLabel={exercise.name}
        accessible
      >
        <LinearGradient
          colors={['#f8fafc', '#e0e7ef', '#f3e8ff']}
          style={{ borderRadius: 24, overflow: 'hidden' }}
        >
          <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 16, paddingRight: 8, justifyContent: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#312e81', flex: 1 }} numberOfLines={2}>
                {capitalize(exercise.exerciseName || exercise.name)}
              </Text>
              {typeof exercise.rating !== 'undefined' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                  <Ionicons name="star" size={18} color="#fbbf24" style={{ marginRight: 2 }} />
                  <Text style={{ color: '#f59e42', fontWeight: 'bold', fontSize: 15 }}>{exercise.rating}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {(exercise.mainImage || exercise.image) ? (
                <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Image
                    source={{ uri: exercise.mainImage || exercise.image }}
                    style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e0e7ef' }}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Ionicons name="image-outline" size={36} color="#cbd5e1" />
                </View>
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6, gap: 4 }}>
                  {exercise.category && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                      <Ionicons name="grid-outline" size={14} color="#b45309" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#b45309', fontSize: 13, fontWeight: '600' }}>{capitalize(exercise.category)}</Text>
                    </View>
                  )}
                  {exercise.bodyPart && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                      <Ionicons name="body-outline" size={14} color="#166534" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#166534', fontSize: 13, fontWeight: '600' }}>{capitalize(exercise.bodyPart)}</Text>
                    </View>
                  )}
                  {exercise.equipment && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                      <Ionicons name="construct-outline" size={14} color="#a16207" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#a16207', fontSize: 13, fontWeight: '600' }}>{capitalize(exercise.equipment)}</Text>
                    </View>
                  )}
                  {exercise.target && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9d5ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                      <Ionicons name="locate-outline" size={14} color="#7c3aed" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#7c3aed', fontSize: 13, fontWeight: '600' }}>{capitalize(exercise.target)}</Text>
                    </View>
                  )}
                </View>
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="git-branch-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>
                      Secondary: {exercise.secondaryMuscles.map(capitalize).join(', ')}
                    </Text>
                  </View>
                )}
                {exercise.idealFor && exercise.idealFor.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 }}>
                    <Ionicons name="people-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }} numberOfLines={1}>
                      Ideal For: <Text style={{ fontSize: 12, color: '#1e3a8a', fontWeight: '400' }}>{exercise.idealFor.map(capitalize).join(', ')}</Text>
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  {typeof exercise.caloriesBurnedPerSet !== 'undefined' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="flame-outline" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '600' }}>
                        {exercise.caloriesBurnedPerSet} <Text style={{ color: '#b91c1c', fontWeight: '400' }}>cal</Text>
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={14} color="#0891b2" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13, color: '#0891b2', fontWeight: '600' }}>
                      {exercise.duration || 30} <Text style={{ color: '#0e7490', fontWeight: '400' }}>sec</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderSkeletonCard = ({ index }) => (
    <View key={index} style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f3f4f6', padding: 0, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: '#e5e7eb', marginRight: 18 }} />
        <View style={{ flex: 1 }}>
          <View style={{ width: '60%', height: 18, backgroundColor: '#e5e7eb', borderRadius: 6, marginBottom: 10 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 60, height: 18, backgroundColor: '#e0e7ef', borderRadius: 12, marginRight: 6, marginBottom: 4 }} />
            <View style={{ width: 50, height: 18, backgroundColor: '#e0e7ef', borderRadius: 12, marginRight: 6, marginBottom: 4 }} />
            <View style={{ width: 40, height: 18, backgroundColor: '#e0e7ef', borderRadius: 12, marginRight: 6, marginBottom: 4 }} />
          </View>
          <View style={{ width: '40%', height: 14, backgroundColor: '#e5e7eb', borderRadius: 6, marginTop: 6 }} />
        </View>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb', marginLeft: 8 }} />
      </View>
    </View>
  );

  // --- List Header: Categories & Filter Bar ---
  const ListHeader = (
    <View>
      {/* Categories */}
      <FlatList
        data={CATEGORY_LIST}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        style={{ marginBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCategoryPress(item.name)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: item.name === selectedCategory ? '#3b82f6' : '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
            accessibilityLabel={item.name}
            accessible
          >
            {item.image && (
              <View style={{ marginRight: 6 }}>
                <ImageBackground source={{ uri: item.image }} style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden' }} />
              </View>
            )}
            <Text style={{
              fontWeight: '500',
              color: item.name === selectedCategory ? '#fff' : '#374151',
            }}>
              {capitalize(item.name)}
            </Text>
          </TouchableOpacity>
        )}
      />
      {/* Filter Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
        {(searchQuery || selectedCategory !== 'All') && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            style={{ flexDirection: 'row', alignItems: 'center' }}
            accessibilityLabel="Clear filters"
            accessible
          >
            <Text style={{ color: '#3b82f6', marginRight: 4 }}>Clear filters</Text>
            <Ionicons name="close-circle" size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // --- Main Render ---
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
  <LinearGradient colors={['#f8fafc', '#f1f5f9', '#e2e8f0']} style={{ flex: 1 }}>
          {networkSlow && (
            <View style={{ backgroundColor: '#fef3c7', padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
              <Ionicons name="cloud-outline" size={18} color="#f59e42" style={{ marginRight: 6 }} />
              <Text style={{ color: '#b45309', fontWeight: 'bold' }}>Network is slow...</Text>
            </View>
          )}
          {/* Header */}
          <View style={{ marginBottom: 8 }}>
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              style={{ paddingHorizontal: 16, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Exercises</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ padding: 8, backgroundColor: '#f9fafb', borderRadius: 999 }}
                    onPress={() => navigation.navigate('screens/Favorites')}
                    accessibilityLabel="Go to Favorites"
                    accessible
                  >
                    <Ionicons name="heart-outline" size={22} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 8, backgroundColor: '#f9fafb', borderRadius: 999, marginLeft: 8 }}
                    onPress={() => setMenuVisible(true)}
                    accessibilityLabel="Open Filter Menu"
                    accessible
                  >
                    <Ionicons name="filter-outline" size={22} color="#374151" />
                  </TouchableOpacity>
                  {sortByDifficulty && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#dbeafe', borderRadius: 999, marginLeft: 4 }}>
                      <Text style={{ color: '#2563eb', fontSize: 12 }}>Sorted by Difficulty</Text>
                      <TouchableOpacity onPress={() => setSortByDifficulty(false)} style={{ marginLeft: 4 }}>
                        <Ionicons name="close-circle" size={14} color="#2563eb" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {equipmentFilter && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#bbf7d0', borderRadius: 999, marginLeft: 4 }}>
                      <Text style={{ color: '#047857', fontSize: 12 }}>{equipmentFilter}</Text>
                      <TouchableOpacity onPress={() => setEquipmentFilter(null)} style={{ marginLeft: 4 }}>
                        <Ionicons name="close-circle" size={14} color="#047857" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              {/* Search Bar */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('screens/SearchExercise')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginTop: 16,
                }}
                accessibilityLabel="Search exercises"
                accessible
              >
                <Ionicons name="search-outline" size={20} color="#6B7280" />
                <Text style={{ color: '#9CA3AF', marginLeft: 8, fontSize: 16, flex: 1 }}>
                  Search exercises...
                </Text>
              </TouchableOpacity>
              <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} onOptionSelect={handleMenuOption} />
            </LinearGradient>
          </View>
          {/* Exercise List */}
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <FlatList
              data={filteredExercises}
              keyExtractor={(item, idx) => item._id || idx.toString()}
              renderItem={renderExerciseCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              onEndReached={() => {
                console.log('FlatList onEndReached');
                handleLoadMore();
              }}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={
                loading && exercises.length === 0 ? (
                  <FlatList
                    data={[...Array(6)]}
                    keyExtractor={(_, idx) => `skeleton-${idx}`}
                    renderItem={renderSkeletonCard}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                    <Ionicons name="search" size={48} color="#9CA3AF" />
                    <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16 }}>No exercises found</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                      Try adjusting your search or filters
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={
                // Show skeleton loader when loading next page (pagination)
                isFetchingMore.current && exercises.length > 0 && hasMore ? (
                  <View>
                    {[...Array(2)].map((_, idx) => renderSkeletonCard({ index: `footer-${idx}` }))}
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563eb" />
              }
            />
          </View>
        </LinearGradient>
      </SafeAreaView>
  <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }} />
    </>
  );
}

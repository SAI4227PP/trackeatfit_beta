import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import * as Speech from 'expo-speech';
import { useEffect, useLayoutEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomAlert from '../components/CustomAlert';
import MuscleVisual from '../components/MuscleVisual';

const API_URL = "https://trackeatfit.onrender.com";

// Helper style objects
const styles = {
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#dbeafe', // bg-blue-100
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb', // text-blue-700
  },
  skeletonItem: {
    backgroundColor: '#f3f4f6', // bg-gray-100
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  // ...add more as needed for each region...
};

// Badge for tags and status
const Badge = ({ children, color = "#dbeafe", textColor = "#2563eb" }) => (
  <View style={{
    ...styles.badge,
    backgroundColor: color,
  }}>
    <Text style={{
      ...styles.badgeText,
      color: textColor,
    }}>{children}</Text>
  </View>
);

const SkeletonItem = ({ style }) => (
  <View style={[styles.skeletonItem, style]} />
);

const ExerciseSkeletonLoader = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <SkeletonItem style={{ width: 32, height: 32, borderRadius: 16, marginRight: 16 }} />
          <SkeletonItem style={{ width: 192, height: 24, borderRadius: 8 }} />
        </View>
        <SkeletonItem style={{ width: 32, height: 32, borderRadius: 16 }} />
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Main Image Card */}
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
          <SkeletonItem style={{ width: 144, height: 28, borderRadius: 8, marginBottom: 16 }} />
          <SkeletonItem style={{ width: '100%', height: 192, borderRadius: 16, marginBottom: 16 }} />
          {/* Stats Grid Section 1 */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 }}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', width: '31%', marginBottom: 8 }}>
                  <SkeletonItem style={{ width: 40, height: 40, borderRadius: 8, marginRight: 8 }} />
                  <View>
                    <SkeletonItem style={{ width: 64, height: 12, borderRadius: 8, marginBottom: 4 }} />
                    <SkeletonItem style={{ width: 80, height: 16, borderRadius: 8 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
          {/* Stats Grid Section 2 */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 }}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 12 }}>
                  <SkeletonItem style={{ width: 40, height: 40, borderRadius: 8, marginRight: 8 }} />
                  <View>
                    <SkeletonItem style={{ width: 80, height: 12, borderRadius: 8, marginBottom: 4 }} />
                    <SkeletonItem style={{ width: 64, height: 16, borderRadius: 8 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        {/* Info Cards */}
        {[...Array(4)].map((_, i) => (
          <View key={i} style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <SkeletonItem style={{ width: 32, height: 32, borderRadius: 8, marginRight: 12 }} />
              <SkeletonItem style={{ width: 128, height: 24, borderRadius: 8 }} />
            </View>
            <View style={{ gap: 12 }}>
              {[...Array(3)].map((_, j) => (
                <SkeletonItem
                  key={j}
                  style={{
                    height: 16,
                    borderRadius: 8,
                    width: j === 2 ? '75%' : '100%',
                    marginBottom: 0,
                  }}
                />
              ))}
            </View>
          </View>
        ))}
        {/* Tags Section */}
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <SkeletonItem style={{ width: 32, height: 32, borderRadius: 8, marginRight: 12 }} />
            <SkeletonItem style={{ width: 96, height: 24, borderRadius: 8 }} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[...Array(6)].map((_, i) => (
              <SkeletonItem
                key={i}
                style={{ width: 80, height: 24, borderRadius: 999, marginRight: 8, marginBottom: 8 }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Section header with icon (now uses imported icons)
const SectionHeader = ({ icon, iconType = "emoji", title }) => (
  <View style={styles.sectionHeader}>
    {iconType === "MaterialCommunityIcons" && (
      <MaterialCommunityIcons name={icon} size={22} color="#3b82f6" style={{ marginRight: 8 }} />
    )}
    {iconType === "FontAwesome5" && (
      <FontAwesome5 name={icon} size={20} color="#3b82f6" style={{ marginRight: 8 }} />
    )}
    {iconType === "Ionicons" && (
      <Ionicons name={icon} size={20} color="#3b82f6" style={{ marginRight: 8 }} />
    )}
    {iconType === "emoji" && (
      <Text style={{ fontSize: 18, marginRight: 8 }}>{icon}</Text>
    )}
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const InfoCard = ({ icon, iconType = "emoji", title, children }) => (
  <View style={styles.infoCard}>
    <SectionHeader icon={icon} iconType={iconType} title={title} />
    {children}
  </View>
);

// "At a Glance" summary card
const AtAGlance = ({ data, showAlert }) => (
  <View>
    {/* Section 1: Mechanics, Force Type, Rating */}
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {/* Mechanics */}
        <View style={{ flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginRight: 8 }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="cog-outline" size={22} color="#3b82f6" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Mechanics</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.mechanics.title, EXERCISE_INFO.mechanics.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.mechanics}</Text>
          </View>
        </View>
        {/* Force Type */}
        <View style={{ flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginRight: 8 }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="arm-flex" size={22} color="#3b82f6" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Force Type</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.forceType.title, EXERCISE_INFO.forceType.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.forceType}</Text>
          </View>
        </View>
        {/* Rating */}
        <View style={{ flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="star" size={22} color="#fbbf24" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500', marginBottom: 4 }}>Rating</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.rating.title, EXERCISE_INFO.rating.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 }}>
              {[1,2,3,4,5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    // You can replace this with your rating handler logic
                    alert(`You rated this exercise ${star} star${star > 1 ? "s" : ""}.`);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={star <= Math.round(data.rating) ? "star" : "star-outline"}
                    size={18}
                    color={star <= Math.round(data.rating) ? "#fbbf24" : "#e5e7eb"}
                    style={{ marginRight: 2 }}
                  />
                </TouchableOpacity>
              ))}
              <Text style={{ marginLeft: 8, fontSize: 12, color: '#4b5563', fontWeight: '600' }}>
                {data.rating ? `${data.rating}/5` : "Unrated"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
    {/* Section 2: Remaining stats */}
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {/* Tempo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="timer-outline" size={22} color="#3b82f6" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Tempo</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.tempo.title, EXERCISE_INFO.tempo.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.tempo}</Text>
          </View>
        </View>
        {/* Reps Range */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="numeric" size={22} color="#3b82f6" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Reps Range</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.repsRange.title, EXERCISE_INFO.repsRange.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.repsRange}</Text>
          </View>
        </View>
        {/* Sets */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="cube-outline" size={22} color="#3b82f6" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Sets</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.sets.title, EXERCISE_INFO.sets.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.setsRecommended}</Text>
          </View>
        </View>
        {/* Rest */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#3b82f6" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Rest</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.rest.title, EXERCISE_INFO.rest.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.restBetweenSets}</Text>
          </View>
        </View>
        {/* Calories/Set */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="fire" size={22} color="#f87171" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Calories/Set</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.caloriesPerSet.title, EXERCISE_INFO.caloriesPerSet.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.caloriesBurnedPerSet}</Text>
          </View>
        </View>
        {/* Duration */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
          <View style={{ height: 32, width: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <MaterialCommunityIcons name="timer" size={22} color="#0891b2" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>Duration/Set</Text>
              <TouchableOpacity
                onPress={() => showAlert(EXERCISE_INFO.duration.title, EXERCISE_INFO.duration.message)}
                style={{ marginLeft: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>{data.duration || 30} sec</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

const List = ({ items }) => (
  <View style={{ gap: 8 }}>
    {items.map((item, idx) => (
      <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ color: '#2563eb', fontWeight: 'bold', marginRight: 8, marginTop: 2 }}>•</Text>
        <Text style={{ color: '#374151', fontSize: 16, flex: 1 }}>{item}</Text>
      </View>
    ))}
  </View>
);

const NumberedList = ({ items }) => (
  <View style={{ gap: 8 }}>
    {items.map((item, idx) => (
      <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ backgroundColor: '#dbeafe', height: 24, width: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: '#2563eb', fontWeight: '500' }}>{idx + 1}</Text>
        </View>
        <Text style={{ color: '#374151', fontSize: 16, flex: 1 }}>{item}</Text>
      </View>
    ))}
  </View>
);


const Exercise = () => {
  const navigation = useNavigation();
  const { exerciseId } = useLocalSearchParams();
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: ''
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { user } = useGlobalContext(); // Get user from global context
  const userId = user?.id || user?._id; // Adjust according to your user object structure

  const handleStartWorkout = () => {
    // Navigate to workout session with exercise data
    navigation.navigate('screens/Workout/WorkoutSession', {
      exercise: {
        _id: exerciseData._id, // <-- use _id, not id
        name: exerciseData.exerciseName,
        sets: exerciseData.setsRecommended,
        reps: exerciseData.repsRange,
        rest: exerciseData.restBetweenSets,
        duration: exerciseData.duration || 30,
        image: exerciseData.mainImage,
        caloriesBurnedPerSet: exerciseData.caloriesBurnedPerSet,
        userId // pass userId if needed
      }
    });
  };

  // Log the received exerciseId for debugging
  console.log('Exercise screen received exerciseId:', exerciseId);

  useEffect(() => {
    const fetchExercise = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/api/v3/v3_exercises/${exerciseId}?userId=${userId}`;
        console.log('Fetching exercise from URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });
        const data = await response.json();
        console.log('Received exercise data:', data);
        console.log('isFavorite value:', data.isFavorite);
        // The backend returns the exercise object directly, not wrapped in { data: ... }
        if (data && data._id) {
          setExerciseData(data);
          setIsFavorite(data.isFavorite === true);
          console.log('Setting isFavorite to:', data.isFavorite === true);
        } else {
          setError('Exercise not found');
        }
      } catch (err) {
        setError('Failed to fetch exercise');
      } finally {
        setLoading(false);
      }
    };
    if (exerciseId) fetchExercise();
    else setError('No exercise ID provided');
  }, [exerciseId, userId]);

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!userId || !exerciseId) {
      showAlert('Error', 'User ID or Exercise ID is missing');
      return;
    }
    
    try {
      if (isFavorite) {
        // Remove favorite
        const response = await fetch(`${API_URL}/api/v3/favorite-exercise/${userId}/${exerciseId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
          setIsFavorite(false);
        } else {
          showAlert('Error', data.message || 'Failed to remove from favorites');
        }
      } else {
        // Add favorite
        const response = await fetch(`${API_URL}/api/v3/favorite-exercise/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, exerciseId })
        });
        const data = await response.json();
        
        if (data.success) {
          setIsFavorite(true);
        } else {
          showAlert('Error', data.message || 'Failed to add to favorites');
        }
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
      showAlert('Error', 'Failed to update favorite status');
    }
  };

  const showAlert = (title, message) => {
    setAlertConfig({
      visible: true,
      title,
      message
    });
  };

  const hideAlert = () => {
    setAlertConfig({
      visible: false,
      title: '',
      message: ''
    });
  };

  useLayoutEffect(() => {
    if (exerciseData && exerciseData.exerciseName) {
      navigation.setOptions({
        headerTitle: exerciseData.exerciseName,
      });
    }
  }, [navigation, exerciseData]);

  // Setup expo-speech listeners for speaking state
  useEffect(() => {
    const onStart = () => setIsSpeaking(true);
    const onDone = () => setIsSpeaking(false);
    const onStopped = () => setIsSpeaking(false);

    Speech.addListener && Speech.addListener('start', onStart);
    Speech.addListener && Speech.addListener('done', onDone);
    Speech.addListener && Speech.addListener('stopped', onStopped);

    // Fallback for expo-speech < 12: use Speech.addEventListener
    if (Speech.addEventListener) {
      Speech.addEventListener('start', onStart);
      Speech.addEventListener('done', onDone);
      Speech.addEventListener('stopped', onStopped);
    }

    return () => {
      Speech.removeAllListeners && Speech.removeAllListeners();
      if (Speech.removeEventListener) {
        Speech.removeEventListener('start', onStart);
        Speech.removeEventListener('done', onDone);
        Speech.removeEventListener('stopped', onStopped);
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ExerciseSkeletonLoader />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, color: '#ef4444' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  // Only render the main content if exerciseData is available
  if (!exerciseData) {
    return null;
  }

  // Cache the verified status once for use in render (now safe)
  const isVerified = !!exerciseData.verifiedByCoach;

  const handlePlayTTS = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false); // Ensure state is updated immediately
      return;
    }
    let text = "";
    if (Array.isArray(exerciseData?.instructions) && exerciseData.instructions.length > 0) {
      text = exerciseData.instructions.join('. ');
    } else if (typeof exerciseData?.instructions === "string" && exerciseData.instructions.trim().length > 0) {
      text = exerciseData.instructions;
    } else if (exerciseData?.description) {
      text = exerciseData.description;
    }
    if (text) {
      setIsSpeaking(true); // Set state immediately
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.9,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false), // fallback if supported
        onStopped: () => setIsSpeaking(false), // fallback if supported
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Custom Header with Back Button and Favorite Icon */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8, marginRight: 8 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {exerciseData.exerciseName}
          </Text>
          {isVerified && (
            <TouchableOpacity
              onPress={() => showAlert(EXERCISE_INFO.verification.title, EXERCISE_INFO.verification.message)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={20}
                color="#22c55e"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={handleFavoriteToggle}
          style={{ padding: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#ef4444" : "#222"}
          />
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, paddingTop: 0, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {/* Media */}
        <InfoCard icon="weight-lifter" iconType="MaterialCommunityIcons" title={exerciseData.exerciseName}>
          {/* <Text className="text-xs text-gray-500 mb-2">Created by {exerciseData.createdBy}</Text> */}
          <Image source={{ uri: exerciseData.mainImage }} style={{ width: '100%', height: 192, borderRadius: 16, marginBottom: 16 }} resizeMode="cover" />
          <AtAGlance data={exerciseData} showAlert={showAlert} />
        </InfoCard>

        {/* Exercise Details: Body Part, Equipment, Target, Secondary Muscles */}
        <InfoCard icon="information-outline" iconType="MaterialCommunityIcons" title="Exercise Details">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 12, marginBottom: 8 }}>
              <MaterialCommunityIcons name="dumbbell" size={18} color="#2563eb" style={{ marginRight: 4 }} />
              <Text style={{ fontWeight: '600', color: '#2563eb', marginRight: 4 }}>Body Part:</Text>
              <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>{exerciseData.bodyPart}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 12, marginBottom: 8 }}>
              <MaterialCommunityIcons name="tools" size={18} color="#16a34a" style={{ marginRight: 4 }} />
              <Text style={{ fontWeight: '600', color: '#16a34a', marginRight: 4 }}>Equipment:</Text>
              <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>{exerciseData.equipment}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 12, marginBottom: 8 }}>
              <MaterialCommunityIcons name="bullseye-arrow" size={18} color="#7c3aed" style={{ marginRight: 4 }} />
              <Text style={{ fontWeight: '600', color: '#7c3aed', marginRight: 4 }}>Target:</Text>
              <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>{exerciseData.target}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            <MaterialCommunityIcons name="account-group-outline" size={18} color="#eab308" style={{ marginRight: 4 }} />
            <Text style={{ fontWeight: '600', color: '#eab308', marginRight: 4 }}>Secondary Muscles:</Text>
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>
              {Array.isArray(exerciseData.secondaryMuscles)
                ? exerciseData.secondaryMuscles.join(", ")
                : exerciseData.secondaryMuscles}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={18} color="#db2777" style={{ marginRight: 4 }} />
            <Text style={{ fontWeight: '600', color: '#db2777', marginRight: 4 }}>Category:</Text>
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>{exerciseData.category}</Text>
          </View>
        </InfoCard>
        
        {/* Ideal For (moved below AtAGlance) */}
        <InfoCard icon="star" iconType="FontAwesome5" title="Ideal For">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {exerciseData.idealFor.map((item, idx) => (
              <Badge key={idx} color="bg-orange-100" textColor="text-orange-700">{item}</Badge>
            ))}
          </View>
        </InfoCard>

        {/* Description */}
        {exerciseData.description && (
          <InfoCard icon="text" iconType="MaterialCommunityIcons" title="Description">
            <Text style={{ color: '#374151', fontSize: 16 }}>{exerciseData.description}</Text>
          </InfoCard>
        )}

        {/* Instructions */}
        {exerciseData.instructions && exerciseData.instructions.length > 0 && (
          <InfoCard icon="clipboard-text-outline" iconType="MaterialCommunityIcons" title="Instructions">
            <NumberedList items={exerciseData.instructions} />
          </InfoCard>
        )}

        {/* Target Muscles Visualization */}
        <InfoCard icon="human" iconType="MaterialCommunityIcons" title={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222', marginRight: 8 }}>Target Muscles</Text>
            <TouchableOpacity
              onPress={() => showAlert(EXERCISE_INFO.targetMuscles.title, EXERCISE_INFO.targetMuscles.message)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="information-outline" size={18} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        }>
          <MuscleVisual 
            highlightMuscles={{
              front: Array.isArray(exerciseData.highlightMuscles?.front) ? exerciseData.highlightMuscles.front : [],
              back: Array.isArray(exerciseData.highlightMuscles?.back) ? exerciseData.highlightMuscles.back : []
            }} 
          />
        </InfoCard>

        {/* Coach Notes */}
        <InfoCard icon="note-text" iconType="MaterialCommunityIcons" title="Coach Notes">
          <Text style={{ color: '#374151', fontSize: 16 }}>{exerciseData.coachNotes}</Text>
        </InfoCard>

        {/* Safety Tips */}
        <InfoCard icon="check-circle-outline" iconType="MaterialCommunityIcons" title="Safety Tips">
          <List items={exerciseData.safetyTips} />
        </InfoCard>
        {/* Common Mistakes */}
        <InfoCard icon="alert-circle-outline" iconType="MaterialCommunityIcons" title="Common Mistakes">
          <List items={exerciseData.commonMistakes} />
        </InfoCard>
        {/* Progressions */}
        <InfoCard icon="arrow-up-bold-circle-outline" iconType="MaterialCommunityIcons" title="Progressions">
          <List items={exerciseData.progressions} />
        </InfoCard>
        {/* Regressions */}
        <InfoCard icon="arrow-down-bold-circle-outline" iconType="MaterialCommunityIcons" title="Regressions">
          <List items={exerciseData.regressions} />
        </InfoCard>

        {/* Audio Instruction */}
        <InfoCard icon="volume-high" iconType="MaterialCommunityIcons" title="Audio Instruction">
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#dbeafe', borderRadius: 8, width: 'fit-content' }}
            onPress={handlePlayTTS}
          >
            <Text style={{ color: '#2563eb', fontWeight: 'semibold', marginRight: 8 }}>
              {isSpeaking ? '■ Stop' : '▶ Listen'}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              {exerciseData?.instructions ? (isSpeaking ? "Stop Listening" : "Play Instructions") : "No instructions available"}
            </Text>
          </TouchableOpacity>
        </InfoCard>

        {/* Recommended For */}
        <InfoCard icon="tag" iconType="FontAwesome5" title="Recommended For">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {exerciseData.recommendedFor.map((item, idx) => (
              <Badge key={idx} color="bg-gray-200" textColor="text-gray-700">{item}</Badge>
            ))}
          </View>
        </InfoCard>

        {/* Training Goals */}
        <InfoCard icon="bullseye" iconType="FontAwesome5" title="Training Goals">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {exerciseData.trainingGoals.map((item, idx) => (
              <Badge key={idx} color="bg-purple-100" textColor="text-purple-700">{item}</Badge>
            ))}
          </View>
        </InfoCard>

        {/* Ideal For */}
        {/* <InfoCard icon="star" iconType="FontAwesome5" title="Ideal For">
          <View className="flex-row flex-wrap">
            {exerciseData.idealFor.map((item, idx) => (
              <Badge key={idx} color="bg-orange-100" textColor="text-orange-700">{item}</Badge>
            ))}
          </View>
        </InfoCard> */}

        {/* Suitability & Environment */}
        <InfoCard icon="people-outline" iconType="Ionicons" title="Suitability & Environment">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#374151', marginRight: 4 }}>Gender Suitability:</Text>
            <Text style={{ color: '#4b5563', marginRight: 16 }}>{exerciseData.genderSuitability}</Text>
            <Text style={{ fontWeight: 'bold', color: '#374151', marginRight: 4 }}>Environment:</Text>
            <Text style={{ color: '#4b5563' }}>{exerciseData.environment}</Text>
          </View>
        </InfoCard>

        {/* Tags */}
        <InfoCard icon="tags" iconType="FontAwesome5" title="Tags">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {exerciseData.tags.map((tag, idx) => (
              <Badge key={idx} color="bg-gray-200" textColor="text-gray-700">{tag}</Badge>
            ))}
          </View>
        </InfoCard>
        <View style={{ marginBottom: 16 }} />
      </ScrollView>
      <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingVertical: 16, paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={handleStartWorkout}
          style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="play-circle-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'semibold' }}>Start Workout</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};


const EXERCISE_INFO = {
  mechanics: {
    title: 'Exercise Mechanics',
    message: `Exercise mechanics refers to how many joints are involved in the movement:

• Isolation: Involves movement at only one joint (e.g., bicep curls)
  - Targets specific muscles
  - Easier to learn
  - Great for rehabilitation
  - Useful for correcting imbalances

• Compound: Involves movement at multiple joints (e.g., squats)
  - Works multiple muscle groups
  - Burns more calories
  - More functional movement
  - Better for building overall strength

This exercise is an isolation movement.`
  },
  forceType: {
    title: 'Force Type',
    message: `Force type describes the direction of force required to perform the exercise:

• Push: You move weight away from your body (e.g., bench press, shoulder press).
• Pull: You move weight toward your body (e.g., rows, pull-ups).

This exercise uses a pull force type.`
  },
  rating: {
    title: 'Rating',
    message: `The rating represents the average score given by users and coaches, typically on a scale from 1 to 5 stars. It helps you gauge the effectiveness, safety, and popularity of the exercise.`
  },
  tempo: {
    title: 'Tempo',
    message: `Tempo is the speed at which you perform each phase of a repetition, usually written as a sequence of numbers (e.g., 2-1-2):

• First number: Lowering phase (eccentric)
• Second number: Pause at the bottom
• Third number: Lifting phase (concentric)

For example, 2-1-2 means 2 seconds down, 1 second pause, 2 seconds up.`
  },
  repsRange: {
    title: 'Reps Range',
    message: `The recommended number of repetitions (reps) to perform in each set. For example, 8-12 reps means you should aim for 8 to 12 repetitions per set for optimal results.`
  },
  sets: {
    title: 'Sets',
    message: `The suggested number of sets to complete for this exercise. A set is a group of consecutive repetitions performed without resting.`
  },
  rest: {
    title: 'Rest',
    message: `The recommended rest period between sets. Adequate rest helps with muscle recovery and performance in subsequent sets.`
  },
  caloriesPerSet: {
    title: 'Calories Burned Per Set',
    message: `An estimate of the number of calories you burn by completing one set of this exercise. Actual calories burned may vary based on intensity, weight, and individual factors.`
  },
  targetMuscles: {
    title: 'Target Muscles',
    message: `Target muscles are the primary muscles that are activated and worked during the exercise. Understanding which muscles are targeted helps you focus on proper form and muscle engagement for optimal results.

• Primary muscles: The main muscles responsible for the movement (e.g., latissimus dorsi for pull-downs).
• Secondary muscles: Muscles that assist or stabilize during the exercise (e.g., biceps, core).

Visualizing target muscles can help you mindfully contract and control the right muscle groups during each repetition.`
  },
  duration: {
    title: 'Exercise Duration',
    message: 'The recommended time in seconds to complete one repetition of this exercise. This helps maintain proper form and get the most benefit from the movement.'
  },
  verification: {
    title: "Professional Verification",
    message: "All exercise information provided within this platform is professionally verified.\n\nDescriptions, instructions, safety guidelines, and muscle targeting have been curated from certified fitness professionals and backed by reputable, evidence-based sources — including the National Academy of Sports Medicine (NASM), American Council on Exercise (ACE), and peer-reviewed platforms such as ExRx.net, NSCA, and Stronger by Science.\n\nThis ensures each exercise reflects proper biomechanics, effectiveness, and training integrity for all experience levels."
  }
};


export default Exercise;

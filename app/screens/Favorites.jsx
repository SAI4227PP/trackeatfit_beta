import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from '../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

// Skeleton loader for favorite cards
const FavoriteSkeleton = () => (
  <View style={{ marginBottom: 24, borderRadius: 24, overflow: 'hidden', backgroundColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
    <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e7ef' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingLeft: 16, paddingRight: 8 }}>
        <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <View style={{ width: '70%', height: 16, backgroundColor: '#e5e7eb', borderRadius: 6, marginBottom: 10 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 64, height: 16, backgroundColor: '#f3f4f6', borderRadius: 999, marginRight: 6, marginBottom: 4 }} />
            <View style={{ width: 48, height: 16, backgroundColor: '#f3f4f6', borderRadius: 999, marginRight: 6, marginBottom: 4 }} />
            <View style={{ width: 40, height: 16, backgroundColor: '#f3f4f6', borderRadius: 999, marginRight: 6, marginBottom: 4 }} />
          </View>
          <View style={{ width: '40%', height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, marginTop: 6 }} />
        </View>
      </View>
    </View>
  </View>
);

const Favorites = () => {
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id;
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v3/favorite-exercise/${userId}`);
        const data = await res.json();
        setFavorites(Array.isArray(data) ? data : []);
      } catch (e) {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchFavorites();
  }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8 }}>
          <Ionicons name="chevron-back-outline" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222', flex: 1 }}>Favorites</Text>
      </View>
      <ScrollView
        contentContainerStyle={
          favorites.length === 0 && !loading
            ? { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }
            : { padding: 16 }
        }
      >
        {loading ? (
          <>
            {[...Array(4)].map((_, idx) => (
              <FavoriteSkeleton key={idx} />
            ))}
          </>
        ) : favorites.length === 0 ? (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="heart-dislike-outline" size={56} color="#e5e7eb" />
            <Text style={{ color: '#374151', fontSize: 20, fontWeight: '600', marginTop: 24 }}>No Favorites Yet</Text>
            <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 12, maxWidth: 320 }}>
              Mark exercises as favorites by tapping the heart icon on their Exercise page. Your favorite exercises will appear here for quick access.
            </Text>
          </View>
        ) : (
          favorites.map((fav, idx) => {
            const exercise = fav.exerciseId;
            return (
              <TouchableOpacity
                key={exercise?._id || idx}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('screens/Exercise', { exerciseId: exercise?._id })}
                style={{
                  marginBottom: 22,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.13,
                  shadowRadius: 8,
                  elevation: 6,
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                }}
              >
                <View
                  style={{
                    borderRadius: 24,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#e0e7ef',
                  }}
                >
                  <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 16, paddingRight: 8, justifyContent: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text
                        style={{ fontSize: 20, fontWeight: 'bold', color: '#312e81', flex: 1 }}
                        numberOfLines={2}
                      >
                        {exercise?.exerciseName}
                      </Text>
                      {typeof exercise?.rating === 'number' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                          <Ionicons name="star" size={18} color="#fbbf24" style={{ marginRight: 2 }} />
                          <Text style={{ color: '#f59e42', fontWeight: 'bold', fontSize: 15 }}>{exercise.rating}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {exercise?.mainImage ? (
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <Image
                            source={{ uri: exercise.mainImage }}
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
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                          {exercise?.category && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                              <Ionicons name="grid-outline" size={14} color="#b45309" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#b45309', fontSize: 13, fontWeight: '600' }}>{exercise.category}</Text>
                            </View>
                          )}
                          {exercise?.bodyPart && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                              <Ionicons name="body-outline" size={14} color="#166534" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#166534', fontSize: 13, fontWeight: '600' }}>{exercise.bodyPart}</Text>
                            </View>
                          )}
                          {exercise?.equipment && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                              <Ionicons name="construct-outline" size={14} color="#a16207" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#a16207', fontSize: 13, fontWeight: '600' }}>{exercise.equipment}</Text>
                            </View>
                          )}
                          {exercise?.target && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9d5ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                              <Ionicons name="locate-outline" size={14} color="#7c3aed" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#7c3aed', fontSize: 13, fontWeight: '600' }}>{exercise.target}</Text>
                            </View>
                          )}
                        </View>
                        {Array.isArray(exercise?.secondaryMuscles) && exercise.secondaryMuscles.length > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Ionicons name="git-branch-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>
                              Secondary: {exercise.secondaryMuscles.join(', ')}
                            </Text>
                          </View>
                        )}
                        {Array.isArray(exercise?.idealFor) && exercise.idealFor.length > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Ionicons name="people-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: '#2563eb' }} numberOfLines={1}>
                              Ideal For: <Text style={{ color: '#1e293b', fontWeight: '400' }}>{exercise.idealFor.join(', ')}</Text>
                            </Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          {typeof exercise?.caloriesBurnedPerSet === 'number' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                              <Ionicons name="flame-outline" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '600' }}>
                                {exercise.caloriesBurnedPerSet} <Text style={{ color: '#b91c1c', fontWeight: '400' }}>cal</Text>
                              </Text>
                            </View>
                          )}
                          {typeof exercise?.duration === 'number' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="time-outline" size={14} color="#0891b2" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 13, color: '#0891b2', fontWeight: '600' }}>
                                {exercise.duration} <Text style={{ color: '#0e7490', fontWeight: '400' }}>sec</Text>
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Favorites;

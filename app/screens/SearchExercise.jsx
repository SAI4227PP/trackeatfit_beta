import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "https://trackeatfit.onrender.com";

function SearchExercise() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.length > 1) {
      const timeout = setTimeout(() => {
        searchExercises(query);
      }, 400);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchExercises = async (searchText) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/v3/v3_exercises/search?query=${encodeURIComponent(searchText)}&limit=30`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.data || []);
    } catch (e) {
      setError('Failed to fetch exercises');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const capitalize = str => str && str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate('screens/Exercise', { exerciseId: item._id })}
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
    >
      <LinearGradient
        colors={["#f8fafc", "#e0e7ef", "#f3e8ff"]}
        style={{ borderRadius: 24, overflow: 'hidden' }}
      >
        <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 16, paddingRight: 8, justifyContent: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text
              style={{ fontSize: 20, fontWeight: 'bold', color: '#312e81', flex: 1 }}
              numberOfLines={2}
            >
              {capitalize(item.exerciseName || item.name)}
            </Text>
            {typeof item.rating !== 'undefined' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                <Ionicons name="star" size={18} color="#fbbf24" style={{ marginRight: 2 }} />
                <Text style={{ color: '#f59e42', fontWeight: 'bold', fontSize: 15 }}>{item.rating}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {(item.mainImage || item.image) ? (
              <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Image
                  source={{ uri: item.mainImage || item.image }}
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
                {item.category && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="grid-outline" size={14} color="#b45309" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#b45309', fontSize: 13, fontWeight: '600' }}>{capitalize(item.category)}</Text>
                  </View>
                )}
                {item.bodyPart && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="body-outline" size={14} color="#166534" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#166534', fontSize: 13, fontWeight: '600' }}>{capitalize(item.bodyPart)}</Text>
                  </View>
                )}
                {item.equipment && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="construct-outline" size={14} color="#a16207" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#a16207', fontSize: 13, fontWeight: '600' }}>{capitalize(item.equipment)}</Text>
                  </View>
                )}
                {item.target && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9d5ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="locate-outline" size={14} color="#7c3aed" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#7c3aed', fontSize: 13, fontWeight: '600' }}>{capitalize(item.target)}</Text>
                  </View>
                )}
              </View>
              {item.secondaryMuscles && item.secondaryMuscles.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="git-branch-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>
                    Secondary: {item.secondaryMuscles.map(capitalize).join(', ')}
                  </Text>
                </View>
              )}
              {item.idealFor && item.idealFor.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1 }}>
                  <Ionicons name="people-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }} numberOfLines={1}>
                    Ideal For: <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: 'normal' }}>{item.idealFor.map(capitalize).join(', ')}</Text>
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                {typeof item.caloriesBurnedPerSet !== 'undefined' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                    <Ionicons name="flame-outline" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '600' }}>
                      {item.caloriesBurnedPerSet} <Text style={{ color: '#b91c1c', fontWeight: '400' }}>cal</Text>
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={14} color="#0891b2" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 13, color: '#0891b2', fontWeight: '600' }}>
                    {item.duration || 30} <Text style={{ color: '#0e7490', fontWeight: '400' }}>sec</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back-outline" size={26} color="#374151" />
        </TouchableOpacity>
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: 16
        }}>
          <TextInput
            autoFocus
            placeholder="Search exercises..."
            style={{
              flex: 1,
              fontSize: 18,
              color: '#111827',
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: 'transparent'
            }}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={text => setQuery(text.toLowerCase())}
          />
          <Ionicons name="search" size={23} color="#6B7280" style={{ marginRight: 12 }} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ marginRight: 8 }}>
              <Ionicons name="close-circle" size={23} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {error && (
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      )}
      {loading ? (
        <View style={{ padding: 24 }}>
          {[...Array(6)].map((_, idx) => (
            <View key={idx} style={{
              marginBottom: 16,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
              padding: 0,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  backgroundColor: '#e5e7eb',
                  marginRight: 18
                }} />
                <View style={{ flex: 1 }}>
                  <View style={{
                    width: '60%',
                    height: 18,
                    backgroundColor: '#e5e7eb',
                    borderRadius: 8,
                    marginBottom: 10
                  }} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{
                      width: 60,
                      height: 18,
                      backgroundColor: '#eff6ff',
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 4
                    }} />
                    <View style={{
                      width: 50,
                      height: 18,
                      backgroundColor: '#fef9c3',
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 4
                    }} />
                    <View style={{
                      width: 40,
                      height: 18,
                      backgroundColor: '#f3e8ff',
                      borderRadius: 12,
                      marginRight: 6,
                      marginBottom: 4
                    }} />
                  </View>
                  <View style={{
                    width: '40%',
                    height: 14,
                    backgroundColor: '#e5e7eb',
                    borderRadius: 8,
                    marginTop: 6
                  }} />
                </View>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#e5e7eb',
                  marginLeft: 8
                }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={() => (
            query.length > 1 && !loading ? (
              <View style={{ alignItems: 'center', marginTop: 48 }}>
                <Ionicons name="search" size={48} color="#9CA3AF" />
                <Text style={{ color: '#64748b', fontSize: 18, marginTop: 12 }}>No exercises found</Text>
                <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 4, textAlign: 'center' }}>Try a different search term</Text>
              </View>
            ) : null
          )}
        />
      )}
    </SafeAreaView>
  );
}


export default SearchExercise;
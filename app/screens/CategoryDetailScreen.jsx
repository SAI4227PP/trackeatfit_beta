import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = "https://trackeatfit.onrender.com";

export default function CategoryDetailScreen() {
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const navigation = useNavigation();
    const route = useRoute();

    // Add capitalize helper function
    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Convert all string properties of category to lower case for consistency
    let { category } = route.params;
    category = {
        ...category,
        name: category.name && category.name.toLowerCase(),
        type: category.type && category.type.toLowerCase(),
        icon: category.icon && category.icon.toLowerCase(),
        color: category.color,
        bgGradient: category.bgGradient
    };

    const fetchExercises = async (pageNum = 1) => {
        try {
            setIsLoading(true);
            let endpoint = '';
            if (category.type === 'bodypart') {
                endpoint = `${API_URL}/api/v3/v3_exercises/bodypart/${category.name}?page=${pageNum}&limit=10`;
            } else if (category.type === 'equipment') {
                endpoint = `${API_URL}/api/v3/v3_exercises/equipment/${category.name}?page=${pageNum}&limit=10`;
            } else if (category.type === 'exercisetype') {
                endpoint = `${API_URL}/api/v3/v3_exercises/exercisetype/${category.name}?page=${pageNum}&limit=10`;
            } else {
                endpoint = `${API_URL}/api/v3/v3_exercises/muscle/${category.name}?page=${pageNum}&limit=10`;
            }
            const res = await fetch(endpoint);
            const data = await res.json();
            
            if (pageNum === 1) {
                setExercises(data.data || []);
            } else {
                setExercises(prev => [...prev, ...(data.data || [])]);
            }
            
            setTotal(data.total || 0);
            setPage(data.page || 1);
            setHasMore(data.pagination?.hasMore || false);
        } catch (err) {
            console.error(err);
            setExercises([]);
            setTotal(0);
            setError('Failed to fetch exercises');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExercises();
    }, []);

    const loadMore = () => {
        if (!isLoading && hasMore) {
            setPage(prev => prev + 1);
            fetchExercises(page + 1);
        }
    };

    const renderExerciseCard = ({ item }) => {
        const handlePress = () => {
            if (item._id) {
                navigation.navigate('screens/Exercise', { exerciseId: item._id });
            }
        };
        return (
            <TouchableOpacity
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
            >
                <LinearGradient
                    colors={["#f8fafc", "#e0e7ef", "#f3e8ff"]}
                    style={{ borderRadius: 24, overflow: 'hidden' }}
                >
                    {/* Content section with name above image */}
                    <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 16, paddingRight: 8, justifyContent: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text
                                style={{ fontSize: 20, fontWeight: 'bold', color: '#312e81', flex: 1 }}
                                numberOfLines={2}
                            >
                                {capitalize(item.exerciseName)}
                            </Text>
                            {typeof item.rating !== 'undefined' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                    <Ionicons name="star" size={18} color="#fbbf24" style={{ marginRight: 2 }} />
                                    <Text style={{ color: '#f59e42', fontWeight: 'bold', fontSize: 15 }}>{item.rating}</Text>
                                </View>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* Image section */}
                            {item.mainImage ? (
                                <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Image
                                        source={{ uri: item.mainImage }}
                                        style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e0e7ef' }}
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : (
                                <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Ionicons name="image-outline" size={36} color="#cbd5e1" />
                                </View>
                            )}
                            {/* Details section */}
                            <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: 6,
                gap: 4,
            }}>
                {/* Category */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="grid-outline" size={14} color="#b45309" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#b45309', fontSize: 13, fontWeight: '600' }}>{capitalize(item.category)}</Text>
                </View>
                {/* Body Part */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="body-outline" size={14} color="#166534" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#166534', fontSize: 13, fontWeight: '600' }}>{capitalize(item.bodyPart)}</Text>
                </View>
                {/* Equipment */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="construct-outline" size={14} color="#a16207" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#a16207', fontSize: 13, fontWeight: '600' }}>{capitalize(item.equipment)}</Text>
                </View>
                {/* Target */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9d5ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 }}>
                    <Ionicons name="locate-outline" size={14} color="#7c3aed" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#7c3aed', fontSize: 13, fontWeight: '600' }}>{capitalize(item.target)}</Text>
                </View>
            </View>
            {/* Secondary Muscles */}
            {item.secondaryMuscles && item.secondaryMuscles.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="git-branch-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>
                        Secondary: {item.secondaryMuscles.map(capitalize).join(', ')}
                    </Text>
                </View>
            )}
            {/* Ideal For */}
            {item.idealFor && item.idealFor.length > 0 && (
                <View className="flex-row items-center mb-1  rounded px-2 py-1 mr-2">
                    <Ionicons name="people-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text className="text-xs text-blue-600 font-semibold" numberOfLines={1}>
                        Ideal For: <Text className="text-xs text-blue-900 font-normal">{item.idealFor.map(capitalize).join(', ')}</Text>
                    </Text>
                </View>
            )}
            {/* Calories/Set and Duration */}
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
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {/* Header */}
            <View style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb', // gray-200
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 16 }}
                    >
                        <Ionicons name="chevron-back-outline" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#1f2937', // gray-900
                    }}>
                        {category.name}
                    </Text>
                </View>
            </View>

            {error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{
                        color: '#ef4444', // red-500
                        textAlign: 'center'
                    }}>
                        {error}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={exercises}
                    renderItem={renderExerciseCard}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={() => (
                        isLoading && hasMore ? (
                            <ActivityIndicator 
                                size="large" 
                                color="#3b82f6" 
                                style={{ marginVertical: 20 }} 
                            />
                        ) : null
                    )}
                />
            )}
            {/* Show a professional 'Not Found' message if no exercises and not loading or error */}
            {(!isLoading && exercises.length === 0 && !error) && (
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    zIndex: 10
                }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 160,
                            height: 160,
                            marginBottom: 24,
                            borderRadius: 80,
                            backgroundColor: '#f3f4f6',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: 0.7
                        }}>
                            <Ionicons name="alert-circle-outline" size={100} color="#94a3b8" />
                        </View>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: 'bold',
                            color: '#64748b',
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            No Exercises Found
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: '#94a3b8',
                            textAlign: 'center',
                            maxWidth: 260
                        }}>
                            Sorry, we couldn't find any exercises for this category. Please try another category or check back later.
                        </Text>
                        <Text style={{
                            color: '#3b82f6',
                            marginTop: 18,
                            fontSize: 16,
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

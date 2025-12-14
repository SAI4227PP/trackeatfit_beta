import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

export default function Home() {
    const [exerciseTypes, setExerciseTypes] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const navigation = useNavigation();

    // Recommendations State
    const [recommendations, setRecommendations] = React.useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = React.useState(true);

    // Active Program State
    const { user } = useGlobalContext();
    const userId = user?.id || user?._id;
    const [activeProgram, setActiveProgram] = React.useState(null);
    const [loadingActive, setLoadingActive] = React.useState(true);
    // Fetch Active Program
    React.useEffect(() => {
        async function fetchActiveProgram() {
            try {
                setLoadingActive(true);
                const res = await fetch(`${API_URL}/api/v3/user-program-progress/progress/${userId}`);
                const json = await res.json();
                // Handle array response for data
                if (Array.isArray(json.data) && json.data.length > 0) {
                    setActiveProgram(json.data[0]);
                } else {
                    setActiveProgram(null);
                }
            } catch (e) {
                setActiveProgram(null);
            } finally {
                setLoadingActive(false);
            }
        }
        if (userId) fetchActiveProgram();
    }, [userId]);

    React.useEffect(() => {
        const fetchExerciseTypes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/api/v2/exercisetypes`);
                if (!res.ok) throw new Error('Failed to fetch exercise types');
                const data = await res.json();
                setExerciseTypes(data);
            
                console.log('exerciseTypes:', data);
            } catch (err) {
                setError('Failed to fetch exercise types');
                setExerciseTypes([]);
                console.error('Error fetching exercise types:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExerciseTypes();
    }, []);

    // Fetch Recommendations
    React.useEffect(() => {
        const fetchRecommendations = async () => {
            if (!userId) return;
            try {
                setLoadingRecommendations(true);
                const response = await fetch(`${API_URL}/api/v3/user-program-progress/recommendations/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch recommendations');
                const data = await response.json();
                if (data.success) {
                    setRecommendations(data.data.recommendations || []);
                } else {
                    console.error('Failed to fetch recommendations:', data.message);
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoadingRecommendations(false);
            }
        };

        fetchRecommendations();
    }, [userId]);

    // Recommended Exercises State
    const [exerciseRecs, setExerciseRecs] = React.useState({});
    const [loadingExerciseRecs, setLoadingExerciseRecs] = React.useState(true);

    // Fetch recommended exercises (grouped by muscle group)
    React.useEffect(() => {
        if (!userId) return;
        const fetchExerciseRecs = async () => {
            setLoadingExerciseRecs(true);
            try {
                const response = await fetch(`${API_URL}/api/v3/recommendation/exercise-recommendations/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch exercise recommendations');
                const data = await response.json();
                if (data.success && data.data && data.data.recommendations) {
                    setExerciseRecs(data.data.recommendations);
                } else {
                    setExerciseRecs({});
                }
            } catch (e) {
                setExerciseRecs({});
            } finally {
                setLoadingExerciseRecs(false);
            }
        };
        fetchExerciseRecs();
    }, [userId]);

    // Recent Workouts State
    const [recentWorkouts, setRecentWorkouts] = React.useState([]);
    const [loadingRecentWorkouts, setLoadingRecentWorkouts] = React.useState(true);

    // Fetch recent workouts from API
    React.useEffect(() => {
        async function fetchRecentWorkouts() {
            setLoadingRecentWorkouts(true);
            try {
                // Replace with your dynamic userId if needed
                const res = await fetch(`${API_URL}/api/v3/workouts/individual/user/${userId}`);
                if (!res.ok) throw new Error('Failed to fetch recent workouts');
                const data = await res.json();
                setRecentWorkouts(data);
            } catch (e) {
                setRecentWorkouts([]);
            } finally {
                setLoadingRecentWorkouts(false);
            }
        }
        fetchRecentWorkouts();
    }, []);

    const renderCategories = () => (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Categories</Text>
                <TouchableOpacity 
                    onPress={() => {
                        navigation.navigate('screens/CategoriesScreen');
                    }}
                >
                  <Ionicons name="chevron-forward-outline" size={24} color="#334155" />
                </TouchableOpacity>
            </View>
            {isLoading ? (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    {[1].map((_, index) => (
                        <View key={index} style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', width: 130, height: 160 }}>
                            <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                        </View>
                    ))}
                </ScrollView>
            ) : error ? (
                <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error}</Text>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    {exerciseTypes && exerciseTypes.length > 0 && exerciseTypes.map((type, idx) => (
                        <TouchableOpacity 
                            key={`ex-type-${idx}`}
                            style={{ marginRight: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, width: 130, height: 160 }}
                        >
                            <LinearGradient
                                colors={["#f1f5f9", "#e0e7ef"]}
                                style={{ width: '100%', height: '100%', borderRadius: 16, padding: 0 }}
                            >
                                {type.image && (
                                    <View style={{ width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                                        <Image 
                                            source={{ uri: type.image }} 
                                            style={{ width: '100%', height: 120, borderTopLeftRadius: 16, borderTopRightRadius: 16, resizeMode: 'cover' }} 
                                        />
                                        <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingVertical: 6, alignItems: 'center' }}>
                                            <Text style={{ color: '#1e293b', fontWeight: '600', fontSize: 16 }} numberOfLines={1}>
                                                {type.name}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderRecommendations = () => (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Recommended For You</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('screens/Recommended/AllRecommendedPrograms')}
                >
                  <Ionicons name="chevron-forward-outline" size={24} color="#334155" />
                </TouchableOpacity>
            </View>
            {loadingRecommendations ? (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    {[1,2,3].map((_, index) => (
                        <View key={index} style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', width: 280, height: 180 }}>
                            <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                        </View>
                    ))}
                </ScrollView>
            ) : recommendations && recommendations.length > 0 ? (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    {recommendations.map((program, idx) => (
                        <TouchableOpacity 
                            key={`program-${idx}`}
                            onPress={() => {
                                console.log('LOG  Navigating to program details:', { programId: program._id });
                                navigation.navigate('screens/Programs/ProgramDetails', { id: program._id });
                            }}
                            style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, width: 290, height: 180 }}
                        >
                            <ImageBackground
                                source={{ uri: program.thumbnail || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                                style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
                                imageStyle={{ borderRadius: 16 }}
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={{ padding: 16, justifyContent: 'flex-end', height: 180 }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <View style={{ backgroundColor: '#3b82f6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 }}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                                                {program.difficulty}
                                            </Text>
                                        </View>
                                        <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12 }}>
                                            {program.totalWorkouts} workouts
                                        </Text>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }} numberOfLines={2}>
                                        {program.programName}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="star" size={16} color="#fbbf24" />
                                        <Text style={{ color: '#fff', fontWeight: '500', marginLeft: 4 }}>
                                            {program.rating?.toFixed(1) || '4.5'}
                                        </Text>
                                        {program.isFeatured && (
                                            <View style={{ marginLeft: 8, backgroundColor: '#fbbf24', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1e293b' }}>Featured</Text>
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                            </ImageBackground>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
                    <View style={{ backgroundColor: '#dbeafe', borderRadius: 999, padding: 16, marginBottom: 16 }}>
                        <Ionicons name="bulb-outline" size={32} color="#3b82f6" />
                    </View>
                    <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                        No Recommendations Yet
                    </Text>
                    <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
                        Complete more workouts or update your preferences to get personalized program suggestions.
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#2563eb', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 }}
                        onPress={() => navigation.navigate('programs')}
                        activeOpacity={0.85}
                    >
                        <Text style={{ color: '#fff', fontWeight: '500' }}>Browse Programs</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderExerciseRecommendations = () => {
        // Flatten all recommended exercises into a single array
        const allExercises = exerciseRecs && typeof exerciseRecs === 'object'
            ? Object.values(exerciseRecs).flat()
            : [];

        return (
            <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Recommended Exercises</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('screens/Recommended/AllRecommendedExercises')}
                    >
                  <Ionicons name="chevron-forward-outline" size={24} color="#334155" />
                    </TouchableOpacity>
                </View>
                {loadingExerciseRecs ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[1,2,3].map((_, idx) => (
                            <View key={idx} style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', width: 270, height: 200 }}>
                                <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                            </View>
                        ))}
                    </ScrollView>
                ) : allExercises && allExercises.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 10 }}>
                        {allExercises.map((ex, idx) => (
                            <TouchableOpacity
                                key={ex._id || ex.exerciseName || idx}
                                style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, width: 290, height: 200 }}
                                onPress={() => navigation.navigate('screens/Exercise', { exerciseId: ex._id })}
                            >
                                <ImageBackground
                                    source={{ uri: ex.mainImage || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                                    style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
                                    imageStyle={{ borderRadius: 16 }}
                                >
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={{ padding: 12, justifyContent: 'flex-end', height: 200 }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }} numberOfLines={2}>
                                            {ex.exerciseName}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12, marginRight: 8 }}>{ex.category}</Text>
                                            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12, marginRight: 8 }}>•</Text>
                                            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12, marginRight: 8 }}>{ex.bodyPart}</Text>
                                            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12 }}>•</Text>
                                            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12 }}>{Array.isArray(ex.equipment) ? ex.equipment.join(', ') : ex.equipment}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <Ionicons name="star" size={12} color="#fbbf24" />
                                                <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '500', fontSize: 12 }}>
                                                    {ex.rating?.toFixed(1) || '4.0'}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 }}>
                                                <MaterialCommunityIcons name="timer" size={14} color="#22d3ee" />
                                                <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '500', fontSize: 12 }}>
                                                    {ex.duration || 30}s
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <MaterialCommunityIcons name="fire" size={14} color="#f87171" />
                                                <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '500', fontSize: 12 }}>
                                                    {ex.caloriesBurnedPerSet || 30}
                                                </Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={{ color: '#6b7280', textAlign: 'center' }}>No exercise recommendations yet. Complete more workouts to get personalized suggestions.</Text>
                )}
            </View>
        );
    };

    const [networkSlow, setNetworkSlow] = React.useState(false);

    // Helper to handle network slow detection
    function useNetworkSlow(loading) {
        React.useEffect(() => {
            if (!loading) {
                setNetworkSlow(false);
                return;
            }
            const timer = setTimeout(() => {
                if (loading) setNetworkSlow(true);
            }, 3000);
            return () => clearTimeout(timer);
        }, [loading]);
    }

    // Use network slow for each main loading state
    useNetworkSlow(isLoading);
    useNetworkSlow(loadingRecommendations);
    useNetworkSlow(loadingExerciseRecs);
    useNetworkSlow(loadingActive);
    useNetworkSlow(loadingRecentWorkouts);

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <LinearGradient
                    colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
                    style={{ flex: 1 }}
                >
                    {/* Show network slow indicator */}
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
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.08,
                                shadowRadius: 10,
                                elevation: 5,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>Workouts</Text>
                                    <TouchableOpacity>
                                        <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#dbeafe', borderRadius: 999 }}>
                                            <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '500' }}>Pro</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity style={{ padding: 8, backgroundColor: '#f9fafb', borderRadius: 999 }} onPress={() => navigation.navigate('screens/SearchExercise')}>
                                        <Ionicons name="search-outline" size={22} color="#374151" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('workout_pages/ActivityTracker')} 
                                        style={{ padding: 8, backgroundColor: '#f9fafb', borderRadius: 999 }}
                                    >
                                        <Ionicons name="fitness-outline" size={22} color="#374151" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={{ 
                            paddingBottom: 100 
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={{ paddingHorizontal: 16 }}>
                            {/* Featured Workout */}
                            <ImageBackground
                                source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1470' }}
                                style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}
                                imageStyle={{ borderRadius: 16 }}
                            >
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                    style={{ padding: 20 }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>Featured Workout</Text>
                                            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Full Body HIIT</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                                                    <Ionicons name="time-outline" size={14} color="#fff" />
                                                    <Text style={{ color: '#fff', marginLeft: 4, fontSize: 12 }}>45 min</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                                                    <Ionicons name="flame-outline" size={14} color="#fff" />
                                                    <Text style={{ color: '#fff', marginLeft: 4, fontSize: 12 }}>400 cal</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: 8 }}>
                                            <Ionicons name="play" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </ImageBackground>

                            {/* Active Program Card */}
                            <View style={{ marginBottom: 16 }}>
                                {loadingActive ? (
                                    <ScrollView 
                                        horizontal 
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingRight: 5 }}
                                    >
                                        {[1].map((_, index) => (
                                            <View key={index} style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', width: 330, height: 180 }}>
                                                <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : activeProgram ? (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('screens/Programs/ActiveProgram', { id: activeProgram.programDetails._id })}
                                        activeOpacity={0.9}
                                    >
                                         <ImageBackground
                                         source={{ uri: (activeProgram.programDetails?.thumbnail || activeProgram.thumbnail) || 'https://images.unsplash.com/photo-1517960419151-0c2b8c8e5a1c?q=80&w=1470' }}
                                         style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}
                                        imageStyle={{ borderRadius: 16 }}
                                    >
                                        <LinearGradient
                                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                            style={{ padding: 20 }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>Active Program</Text>
                                                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>{activeProgram.programName}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                                                            <Ionicons name="time-outline" size={14} color="#fff" />
                                                            <Text style={{ color: '#fff', marginLeft: 4, fontSize: 12 }}>
                                                                {activeProgram.totalMinutesTrained} min
                                                            </Text>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                                                            <Ionicons name="flame-outline" size={14} color="#fff" />
                                                            <Text style={{ color: '#fff', marginLeft: 4, fontSize: 12 }}>{activeProgram.totalSessionsCompleted} sessions</Text>
                                                        </View>
                                                    </View>
                                                    {/* Progress Bar */}
                                                    <View style={{ marginTop: 12 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                        <Ionicons name="flame" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                                                        <View style={{ flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                                                            <View style={{
                                                                width: `${activeProgram.progressPercentage || 0}%`,
                                                                height: '100%',
                                                                backgroundColor: '#3b82f6',
                                                                borderRadius: 4
                                                            }} />
                                                        </View>
                                                        <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '500', fontSize: 12, minWidth: 40, textAlign: 'right' }}>
                                                            {activeProgram.progressPercentage} %
                                                        </Text>
                                                    </View>
                                                    </View>
                                                </View>
                                                <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: 8 }}>
                                                    <Ionicons name="play" size={24} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </LinearGradient>
                                    </ImageBackground>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('programs')}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#f8fafc', '#f1f5f9']}
                                            style={{ borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}
                                        >
                                            <View style={{ alignItems: 'center' }}>
                                                <View style={{ backgroundColor: '#dbeafe', borderRadius: 999, padding: 12, marginBottom: 8 }}>
                                                    <FontAwesome5 name="dumbbell" size={24} color="#3b82f6" />
                                                </View>
                                                <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                                                    No Active Program
                                                </Text>
                                                <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
                                                    Start a fitness program to track your progress and achieve your goals.
                                                </Text>
                                                <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}>
                                                    <Text style={{ color: '#fff', fontWeight: '500' }}>Browse Programs</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Quick Start Section */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>Quick Start</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {[
                                        { 
                                            title: 'Start Workout', 
                                            icon: 'play-circle', 
                                            color: '#4A90E2', 
                                            bgImage: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?q=80&w=1470'
                                        },
                                        { 
                                            title: 'New Program', 
                                            icon: 'add-circle', 
                                            color: '#10b981',
                                            bgImage: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1470'
                                        }
                                    ].map((item, index) => (
                                        <TouchableOpacity key={index} style={{ width: '48%' }}>
                                            <ImageBackground
                                                source={{ uri: item.bgImage }}
                                                style={{ borderRadius: 12, overflow: 'hidden', height: 120 }}
                                                imageStyle={{ borderRadius: 12 }}
                                            >
                                                <LinearGradient
                                                    colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
                                                    style={{ padding: 16, alignItems: 'center', justifyContent: 'center', height: '100%' }}
                                                >
                                                    <Ionicons name={item.icon} size={32} color="#fff" />
                                                    <Text style={{ color: '#fff', fontWeight: '600', marginTop: 8 }}>{item.title}</Text>
                                                </LinearGradient>
                                            </ImageBackground>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Muscle Diagram Section */}
                            <TouchableOpacity 
                                style={{ marginBottom: 24 }}
                                onPress={() => navigation.navigate('workout_pages/MuscleDiagramPage')}
                            >
                                <ImageBackground
                                    source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop' }}
                                    style={{ borderRadius: 16, overflow: 'hidden', height: 180 }}
                                    imageStyle={{ borderRadius: 16 }}
                                    resizeMode="cover"
                                >
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                        style={{ borderRadius: 16, padding: 20, height: '100%', justifyContent: 'center' }}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: 8, borderRadius: 8, marginRight: 8, elevation: 2 }}>
                                                        <Ionicons name="body" size={24} color="#fff" />
                                                    </View>
                                                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Muscle Diagram</Text>
                                                </View>
                                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                                                    Explore Muscle Groups
                                                </Text>
                                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                                                    Tap a muscle to see related workouts
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999, padding: 8, elevation: 2 }}>
                                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </TouchableOpacity>

                            {/* Activity Tracker Section */}
                            <TouchableOpacity 
                                style={{ marginBottom: 24 }}
                                onPress={() => navigation.navigate('workout_pages/ActivityTracker')}
                            >
                                <ImageBackground
                                    source={{ uri: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?q=80&w=2000&auto=format&fit=crop' }}
                                    style={{ borderRadius: 16, overflow: 'hidden', height: 180 }}
                                    imageStyle={{ borderRadius: 16 }}
                                    resizeMode="cover"
                                >
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                        style={{ borderRadius: 16, padding: 20, height: '100%', justifyContent: 'center' }}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: 8, borderRadius: 8, marginRight: 8, elevation: 2 }}>
                                                        <Ionicons name="fitness" size={24} color="#fff" />
                                                    </View>
                                                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Activity Tracker</Text>
                                                </View>
                                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                                                    Track Your Workout
                                                </Text>
                                                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                                                    Record your runs, rides, and walks in real-time
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999, padding: 8, elevation: 2 }}>
                                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </TouchableOpacity>

                            {/* Recommendations */}
                            {renderRecommendations()}

                            {/* Recommended Exercises */}
                            {renderExerciseRecommendations()}

                            {/* Categories */}
                            {renderCategories()}

                            {/* Recent Workouts */}
                            <View style={{ marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Recent Workouts</Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('screens/Workout/AllWorkout')}
                                    >
                                        <Ionicons name="chevron-forward-outline" size={24} color="#334155" />
                                    </TouchableOpacity>
                                </View>
                                {loadingRecentWorkouts ? (
                                    <ScrollView 
                                        horizontal 
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingRight: 5 }}
                                    >
                                        {[1,2].map((_, index) => (
                                            <View key={index} style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', width: 330, height: 150 }}>
                                                <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : recentWorkouts && recentWorkouts.length > 0 ? (
                                    recentWorkouts.map((workout, index) => (
                                        <TouchableOpacity 
                                            key={workout.exerciseId || index}
                                            style={{ marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}
                                        >
                                            <ImageBackground
                                                source={{ uri: workout.exerciseImg || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                                                style={{ borderRadius: 16, overflow: 'hidden', height: 150, justifyContent: 'flex-end' }}
                                                imageStyle={{ borderRadius: 16 }}
                                                resizeMode="cover"
                                            >
                                                <LinearGradient
                                                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                                    style={{ borderRadius: 16, padding: 16, justifyContent: 'flex-end', height: '100%' }}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 0, y: 1 }}
                                                >
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8, marginRight: 8, elevation: 2 }}>
                                                                    <Ionicons name="barbell" size={20} color="#fff" />
                                                                </View>
                                                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                                                                    {workout.exerciseName}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                                    <Ionicons name="time-outline" size={14} color="#fff" />
                                                                    <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '500', fontSize: 12 }}>
                                                                        {workout.durationInMinutes > 0 ? `${workout.durationInMinutes} min` : 'N/A'}
                                                                    </Text>
                                                                </View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                                    <Ionicons name="flame-outline" size={14} color="#fff" />
                                                                    <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '500', fontSize: 12 }}>
                                                                        {workout.caloriesBurned} cal
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
                                                                {workout.sessionDate ? new Date(workout.sessionDate).toLocaleDateString() : ''}
                                                            </Text>
                                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999, padding: 8, elevation: 2 }}>
                                                                <Ionicons name="play" size={16} color="#fff" />
                                                            </View>
                                                        </View>
                                                    </View>
                                                </LinearGradient>
                                            </ImageBackground>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    // Nice empty state for no recent workouts
                                    <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
                                        <View style={{ backgroundColor: '#dbeafe', borderRadius: 999, padding: 16, marginBottom: 16 }}>
                                            <Ionicons name="barbell-outline" size={32} color="#3b82f6" />
                                        </View>
                                        <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                                            No Recent Workouts
                                        </Text>
                                        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
                                            Start a workout to see your recent activity here.
                                        </Text>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#2563eb', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 }}
                                            onPress={() => navigation.navigate('exercises')}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '500' }}>Start Workout</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </SafeAreaView>
            <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }} />
        </>
    );
}


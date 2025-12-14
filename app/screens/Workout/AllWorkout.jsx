import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React from 'react';
import { ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

export default function AllWorkout() {
    const { user } = useGlobalContext();
    const userId = user?.id || user?._id;
    const [workouts, setWorkouts] = React.useState([]);
    const [loadingRecentWorkouts, setLoadingRecentWorkouts] = React.useState(true);
    const navigation = useNavigation();

    React.useEffect(() => {
        async function fetchRecentWorkouts() {
            setLoadingRecentWorkouts(true);
            try {
                const res = await fetch(`${API_URL}/api/v3/workouts/individual/user/${userId}`);
                if (!res.ok) throw new Error('Failed to fetch recent workouts');
                const data = await res.json();
                setWorkouts(data);
            } catch (e) {
                setWorkouts([]);
            } finally {
                setLoadingRecentWorkouts(false);
            }
        }
        if (userId) fetchRecentWorkouts();
    }, [userId]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                    <Ionicons name="chevron-back-outline" size={24} color="#334155" />
                </TouchableOpacity>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>Recent Workouts</Text>
            </View>
            {loadingRecentWorkouts ? (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 5 }}
                >
                    {[1,2,3].map((_, index) => (
                        <View key={index} style={{ marginRight: 16, borderRadius: 16, overflow: 'hidden', width: 330, height: 150 }}>
                            <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                        </View>
                    ))}
                </ScrollView>
            ) : workouts && workouts.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {workouts.map((workout, index) => (
                        <View key={workout.exerciseId || index} style={{ marginBottom: 20 }}>
                            <ImageBackground
                                source={{ uri: workout.exerciseImg || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                                style={{ borderRadius: 16, overflow: 'hidden', height: 150, justifyContent: 'flex-end' }}
                                imageStyle={{ borderRadius: 16 }}
                                resizeMode="cover"
                            >
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                    style={{ borderRadius: 16, padding: 16, flex: 1, justifyContent: 'flex-end' }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8, marginRight: 8 }}>
                                                    <Ionicons name="barbell" size={20} color="#fff" />
                                                </View>
                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                                                    {workout.exerciseName}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                                                    <Ionicons name="time-outline" size={14} color="#fff" />
                                                    <Text style={{ color: '#fff', fontSize: 14, marginLeft: 4 }}>
                                                        {workout.durationInMinutes > 0 ? `${workout.durationInMinutes} min` : 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                                                    <Ionicons name="flame-outline" size={14} color="#fff" />
                                                    <Text style={{ color: '#fff', fontSize: 14, marginLeft: 4 }}>
                                                        {workout.caloriesBurned} cal
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 }}>
                                                {workout.sessionDate ? new Date(workout.sessionDate).toLocaleDateString() : ''}
                                            </Text>
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999, padding: 8 }}>
                                                <Ionicons name="play" size={16} color="#fff" />
                                            </View>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </ImageBackground>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={{ alignItems: 'center', marginTop: 64 }}>
                    <Ionicons name="barbell-outline" size={40} color="#3b82f6" style={{ marginBottom: 16 }} />
                    <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No Workouts Found</Text>
                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 12 }}>
                        Start a workout to see your activity here.
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}


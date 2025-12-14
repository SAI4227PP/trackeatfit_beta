import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

export default function AllRecommendedExercises() {
    const navigation = useNavigation();
    const { user } = useGlobalContext();
    const [exercises, setExercises] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const userId = user?.id || user?._id;

    React.useEffect(() => {
        fetchRecommendedExercises();
    }, []);

    const fetchRecommendedExercises = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/v3/recommendation/exercise-recommendations/${userId}`);
            const data = await response.json();
            if (data.success && data.data && data.data.recommendations) {
                // Flatten all exercises from different muscle groups into a single array
                const allExercises = Object.values(data.data.recommendations).flat();
                setExercises(allExercises);
            }
        } catch (error) {
            console.error('Error fetching exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {/* Header */}
            <View style={{
                backgroundColor: '#fff',
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9'
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ padding: 8, marginLeft: -8 }}
                    >
                        <Ionicons name="chevron-back-outline" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginLeft: 8
                    }}>
                        Recommended Exercises
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1, backgroundColor: '#f9fafb' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                >
                    {exercises.map((exercise, index) => (
                        <TouchableOpacity
                            key={exercise._id || index}
                            style={{
                                marginBottom: 8,
                                borderRadius: 12,
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOpacity: 0.05,
                                shadowRadius: 2
                            }}
                            onPress={() => navigation.navigate('screens/Exercise', { exerciseId: exercise._id })}
                        >
                            <ImageBackground
                                source={{ uri: exercise.mainImage || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                                style={{ width: '100%', height: 192 }}
                                imageStyle={{ borderRadius: 12 }}
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        padding: 16,
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        marginBottom: 4
                                    }}>
                                        {exercise.exerciseName}
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            borderRadius: 999,
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                            marginRight: 8,
                                            marginBottom: 4
                                        }}>
                                            <Text style={{
                                                color: '#fff',
                                                fontWeight: '500',
                                                fontSize: 12
                                            }}>
                                                {exercise.category}
                                            </Text>
                                        </View>
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            borderRadius: 999,
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                            marginRight: 8,
                                            marginBottom: 4
                                        }}>
                                            <Text style={{
                                                color: '#fff',
                                                fontWeight: '500',
                                                fontSize: 12
                                            }}>
                                                {exercise.bodyPart}
                                            </Text>
                                        </View>
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            borderRadius: 999,
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                            marginRight: 8,
                                            marginBottom: 4
                                        }}>
                                            <Text style={{
                                                color: '#fff',
                                                fontWeight: '500',
                                                fontSize: 12
                                            }}>
                                                {Array.isArray(exercise.equipment)
                                                    ? exercise.equipment.join(', ')
                                                    : exercise.equipment}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginTop: 4
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                borderRadius: 999,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4
                                            }}>
                                                <Ionicons name="star" size={12} color="#fbbf24" />
                                                <Text style={{
                                                    color: '#fff',
                                                    marginLeft: 4,
                                                    fontWeight: '500',
                                                    fontSize: 12
                                                }}>
                                                    {exercise.rating?.toFixed(1) || '4.0'}
                                                </Text>
                                            </View>
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                borderRadius: 999,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                marginRight: 8,
                                                marginLeft: 8
                                            }}>
                                                <MaterialCommunityIcons name="timer" size={14} color="#22d3ee" />
                                                <Text style={{
                                                    color: '#fff',
                                                    marginLeft: 4,
                                                    fontWeight: '500',
                                                    fontSize: 12
                                                }}>
                                                    {exercise.duration || 30}s
                                                </Text>
                                            </View>
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                borderRadius: 999,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4
                                            }}>
                                                <MaterialCommunityIcons name="fire" size={14} color="#f87171" />
                                                <Text style={{
                                                    color: '#fff',
                                                    marginLeft: 4,
                                                    fontWeight: '500',
                                                    fontSize: 12
                                                }}>
                                                    {exercise.caloriesBurnedPerSet || 30}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </ImageBackground>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

export default function AllRecommendedPrograms() {
    const [recommendations, setRecommendations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const { user } = useGlobalContext();
    const navigation = useNavigation();
    const userId = user?.id || user?._id;

    React.useEffect(() => {
        const fetchRecommendations = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/v3/user-program-progress/recommendations/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch recommendations');
                const data = await response.json();
                if (data.success) {
                    setRecommendations(data.data.recommendations || []);
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [userId]);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            onPress={() => navigation.navigate('screens/Programs/ProgramDetails', { programId: item._id })}
            style={{
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 2,
                height: 200
            }}
        >
            <ImageBackground
                source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
                imageStyle={{ borderRadius: 16 }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={{ padding: 16, justifyContent: 'flex-end', height: 200 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{
                            backgroundColor: '#3b82f6',
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginRight: 8
                        }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                                {item.difficulty}
                            </Text>
                        </View>
                        <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12 }}>
                            {item.totalWorkouts} workouts
                        </Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }} numberOfLines={2}>
                        {item.programName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Text style={{ color: '#fff', fontWeight: '500', marginLeft: 4 }}>
                            {item.rating?.toFixed(1) || '4.5'}
                        </Text>
                        {item.isFeatured && (
                            <View style={{
                                marginLeft: 8,
                                backgroundColor: '#facc15',
                                borderRadius: 999,
                                paddingHorizontal: 8,
                                paddingVertical: 2
                            }}>
                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1e293b' }}>Featured</Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );

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
                        Recommended Programs
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={{ paddingHorizontal: 16 }}>
                    {[1,2,3,4].map((_, index) => (
                        <View 
                            key={index}
                            style={{
                                marginBottom: 16,
                                borderRadius: 16,
                                overflow: 'hidden',
                                width: '100%',
                                height: 200,
                                backgroundColor: '#e5e7eb'
                            }}
                        >
                            {/* Skeleton loader */}
                        </View>
                    ))}
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1, backgroundColor: '#f9fafb' }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                >
                    {recommendations.length > 0 ? (
                        recommendations.map((item, index) => (
                            <TouchableOpacity 
                                key={item._id || index}
                                onPress={() => navigation.navigate('screens/Programs/ProgramDetails', { id: item._id })}
                                style={{
                                    marginBottom: 16,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    height: 200
                                }}
                            >
                                <ImageBackground
                                    source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
                                    style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
                                    imageStyle={{ borderRadius: 16 }}
                                >
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={{ padding: 16, justifyContent: 'flex-end', height: 200 }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <View style={{
                                                backgroundColor: '#3b82f6',
                                                borderRadius: 999,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                marginRight: 8
                                            }}>
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                                                    {item.difficulty}
                                                </Text>
                                            </View>
                                            <Text style={{ color: '#fff', fontWeight: '500', fontSize: 12 }}>
                                                {item.totalWorkouts} workouts
                                            </Text>
                                        </View>
                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }} numberOfLines={2}>
                                            {item.programName}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="star" size={16} color="#fbbf24" />
                                            <Text style={{ color: '#fff', fontWeight: '500', marginLeft: 4 }}>
                                                {item.rating?.toFixed(1) || '4.5'}
                                            </Text>
                                            {item.isFeatured && (
                                                <View style={{
                                                    marginLeft: 8,
                                                    backgroundColor: '#facc15',
                                                    borderRadius: 999,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2
                                                }}>
                                                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#1e293b' }}>Featured</Text>
                                                </View>
                                            )}
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 16
                        }}>
                            <View style={{
                                backgroundColor: '#dbeafe',
                                borderRadius: 999,
                                padding: 16,
                                marginBottom: 12
                            }}>
                                <Ionicons name="bulb-outline" size={32} color="#3b82f6" />
                            </View>
                            <Text style={{
                                color: '#1e293b',
                                fontSize: 18,
                                fontWeight: '600',
                                marginBottom: 4,
                                textAlign: 'center'
                            }}>
                                No Recommendations Yet
                            </Text>
                            <Text style={{
                                color: '#64748b',
                                textAlign: 'center',
                                marginBottom: 16
                            }}>
                                Complete more workouts or update your preferences to get personalized program suggestions.
                            </Text>
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    backgroundColor: '#2563eb',
                                    borderRadius: 999
                                }}
                                onPress={() => navigation.navigate('programs')}
                                activeOpacity={0.85}
                            >
                                <Text style={{ color: '#fff', fontWeight: '500' }}>Browse Programs</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

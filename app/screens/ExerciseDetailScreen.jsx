import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const API_URL = "https://trackeatfit.onrender.com";

export default function ExerciseDetailScreen() {
    const [exerciseDetails, setExerciseDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    const route = useRoute();
    const { exercise } = route.params;

    useEffect(() => {
        fetchExerciseDetails();
    }, []);

    const fetchExerciseDetails = async () => {
        try {
            setIsLoading(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            // Use the new backend API for V2 exercises
            const response = await fetch(
                `${API_URL}/api/v2/v2_exercises/${exercise._id || exercise.id}`
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Failed to fetch exercise details');
            }

            const data = await response.json();
            setExerciseDetails(data);
        } catch (err) {
            if (err.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else {
                setError('Failed to fetch exercise details');
                console.error(err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Add cleanup on unmount
    useEffect(() => {
        return () => {
            // Cleanup logic here if needed
        };
    }, []);

    const renderWorkoutPlan = (plan) => (
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="dumbbell" size={24} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-2">Workout Plan</Text>
            </View>
            <View className="grid grid-cols-2 gap-4">
                <View className="bg-blue-50 p-3 rounded-lg">
                    <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="repeat" size={20} color="#3b82f6" />
                        <Text className="text-sm font-medium text-gray-600 ml-2">Reps per Set</Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-900 ml-7">
                        {plan.recommendedRepsPerSet}
                    </Text>
                </View>

                <View className="bg-blue-50 p-3 rounded-lg">
                    <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="format-list-numbered" size={20} color="#3b82f6" />
                        <Text className="text-sm font-medium text-gray-600 ml-2">Sets</Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-900 ml-7">
                        {plan.recommendedSets}
                    </Text>
                </View>

                <View className="bg-blue-50 p-3 rounded-lg">
                    <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#3b82f6" />
                        <Text className="text-sm font-medium text-gray-600 ml-2">Rest Time</Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-900 ml-7">
                        {plan.restTimeBetweenSets}
                    </Text>
                </View>

                <View className="bg-blue-50 p-3 rounded-lg">
                    <View className="flex-row items-center mb-1">
                        <MaterialCommunityIcons name="timer-outline" size={20} color="#3b82f6" />
                        <Text className="text-sm font-medium text-gray-600 ml-2">Duration</Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-900 ml-7">
                        {plan.durationPerSet}
                    </Text>
                </View>
            </View>
        </View>
    );

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner':
                return { bg: 'bg-green-50', text: 'text-green-600', icon: 'seedling' };
            case 'intermediate':
                return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'running' };
            case 'advanced':
                return { bg: 'bg-red-50', text: 'text-red-600', icon: 'fire-alt' };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'dot-circle' };
        }
    };

    const renderProgressionLevel = (level, data) => {
        const { bg, text, icon } = getLevelColor(level);
        return (
            <View className={`${bg} p-4 rounded-lg mb-3 border border-gray-100`}>
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <FontAwesome5 name={icon} size={18} color={text.replace('text-', '')} />
                        <Text className={`${text} font-bold text-lg capitalize ml-2`}>{level}</Text>
                    </View>
                    <View className={`${text} px-3 py-1 rounded-full ${bg.replace('50', '100')}`}>
                        <Text className={text}>{data.repsPerSet} reps</Text>
                    </View>
                </View>
                <View className="border-t border-gray-200 pt-3">
                    <Text className="text-gray-700 font-medium mb-1">Exercise Variation:</Text>
                    <Text className="text-gray-600">{data.name}</Text>
                </View>
            </View>
        );
    };

    const renderCategories = () => (
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="tag-multiple" size={24} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-2">Categories</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
                {exerciseDetails?.category && (
                    <TouchableOpacity
                        className="bg-blue-50 px-4 py-2 rounded-full flex-row items-center"
                        onPress={() => navigation.navigate('screens/CategoryDetailScreen', {
                            category: {
                                name: exerciseDetails.category,
                                type: 'exercisetype',
                                icon: 'folder',
                                color: '#3b82f6',
                                bgGradient: ['#dbeafe', '#f0f9ff']
                            }
                        })}
                    >
                        <MaterialCommunityIcons name="folder" size={16} color="#3b82f6" />
                        <Text className="text-blue-600 ml-1">{exerciseDetails.category}</Text>
                    </TouchableOpacity>
                )}
                {exerciseDetails?.bodyPart && (
                    <TouchableOpacity
                        className="bg-yellow-50 px-4 py-2 rounded-full flex-row items-center"
                        onPress={() => navigation.navigate('screens/CategoryDetailScreen', {
                            category: {
                                name: exerciseDetails.bodyPart,
                                type: 'bodypart',
                                icon: 'arm-flex',
                                color: '#eab308',
                                bgGradient: ['#fef9c3', '#fefce8']
                            }
                        })}
                    >
                        <MaterialCommunityIcons name="arm-flex" size={16} color="#eab308" />
                        <Text className="text-yellow-600 ml-1">{exerciseDetails.bodyPart}</Text>
                    </TouchableOpacity>
                )}
                {exerciseDetails?.target && (
                    <TouchableOpacity
                        className="bg-green-50 px-4 py-2 rounded-full flex-row items-center"
                        onPress={() => navigation.navigate('screens/CategoryDetailScreen', {
                            category: {
                                name: exerciseDetails.target,
                                type: 'muscle',
                                icon: 'bullseye',
                                color: '#16a34a',
                                bgGradient: ['#bbf7d0', '#f0fdf4']
                            }
                        })}
                    >
                        <FontAwesome5 name="bullseye" size={14} color="#16a34a" />
                        <Text className="text-green-600 ml-1">{exerciseDetails.target}</Text>
                    </TouchableOpacity>
                )}
                {exerciseDetails?.secondaryMuscles?.map((muscle, index) => (
                    <TouchableOpacity
                        key={index}
                        className="bg-purple-50 px-4 py-2 rounded-full flex-row items-center"
                        onPress={() => navigation.navigate('screens/CategoryDetailScreen', {
                            category: {
                                name: muscle,
                                type: 'muscle',
                                icon: 'dumbbell',
                                color: '#9333ea',
                                bgGradient: ['#e9d5ff', '#faf5ff']
                            }
                        })}
                    >
                        <FontAwesome5 name="dumbbell" size={14} color="#93333ea" />
                        <Text className="text-purple-600 ml-1">{muscle}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderEquipment = () => (
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="weight" size={24} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-2">Equipment Needed</Text>
            </View>
            <View className="bg-gray-50 p-3 rounded-lg flex-row items-center">
                <MaterialCommunityIcons 
                    name={exerciseDetails?.equipment && exerciseDetails.equipment !== 'body weight' ? "weight-lifter" : "hand-back-left-outline"}
                    size={20} 
                    color="#4b5563"
                />
                <Text className="text-gray-600 ml-2 flex-1">
                    {exerciseDetails?.equipment || 'No equipment needed'}
                </Text>
            </View>
        </View>
    );

    const renderInstructions = () => (
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="clipboard-list" size={24} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-2">Instructions</Text>
            </View>
            <View className="space-y-3">
                {exerciseDetails?.instructions?.map((instruction, index) => (
                    <View key={index} className="bg-gray-50 p-3 rounded-lg flex-row">
                        <View className="bg-blue-100 h-6 w-6 rounded-full items-center justify-center mr-3">
                            <Text className="text-blue-600 font-medium">{index + 1}</Text>
                        </View>
                        <Text className="text-gray-600 flex-1">{instruction}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500">{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {/* Header */}
            <View className="px-4 py-4 border-b border-gray-200">
                <View className="flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">
                        {exerciseDetails?.name || 'Exercise Details'}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {/* Exercise Name
                <Text className="text-2xl font-bold text-gray-900 mb-4">
                    {exerciseDetails?.name}
                </Text> */}

                {/* Media */}
                {exerciseDetails?.image && (
                    <Image
                        source={{ uri: exerciseDetails.image }}
                        className="w-full h-48 rounded-xl mb-4"
                        resizeMode="cover"
                    />
                )}

                {/* Quick Info Tags */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                    <View className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-blue-600">{exerciseDetails?.difficulty}</Text>
                    </View>
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-600">{exerciseDetails?.intensity} Intensity</Text>
                    </View>
                    <View className="bg-orange-100 px-3 py-1 rounded-full">
                        <Text className="text-orange-600">{exerciseDetails?.caloriesBurnedPerMinute} cal/min</Text>
                    </View>
                </View>

                {/* Updated Sections */}
                {renderCategories()}
                {renderEquipment()}
                {renderInstructions()}
                {/* Description */}
                {exerciseDetails?.description && (
                    <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center mb-2">
                            <MaterialCommunityIcons name="text" size={22} color="#3b82f6" />
                            <Text className="text-lg font-bold text-gray-900 ml-2">Description</Text>
                        </View>
                        <Text className="text-gray-700 text-base">{exerciseDetails.description}</Text>
                    </View>
                )}
                {/* Workout Plan and Progression Levels are not available in this API response */}
                {/* Video Link is not available in this API response */}
            </ScrollView>
        </SafeAreaView>
    );
}

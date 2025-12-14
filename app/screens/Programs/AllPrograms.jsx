import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

const API_URL = "https://trackeatfit.onrender.com";

export default function AllPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch(`${API_URL}/api/v3/programs/`);
        const json = await res.json();
        setPrograms(json.data || []);
      } catch (e) {
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-3 py-3 bg-white/80 z-20">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1 rounded-full active:bg-slate-100">
          <Ionicons name="chevron-back-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">All Programs</Text>
      </View>
      {loading ? (
        <View className="px-4">
          {[1,2,3,4].map((_, index) => (
            <View 
              key={index} 
              className="mb-4 rounded-2xl overflow-hidden" 
              style={{ height: 200 }}
            >
              <View className="w-full h-full bg-gray-200 animate-pulse" />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {programs.length === 0 ? (
            <View className="flex-1 justify-center items-center mt-12">
              <Text className="text-gray-400 text-base">No programs found.</Text>
            </View>
          ) : (
            programs.map((program, index) => (
              <TouchableOpacity
                key={program._id || index}
                activeOpacity={0.92}
                className="mb-3 w-full rounded-2xl border border-blue-100 bg-white shadow-lg"
                onPress={() => {
                  if (program._id) {
                    navigation.navigate('screens/Programs/ProgramDetails', { id: program._id });
                  }
                }}
              >
                <ImageBackground
                  source={{ uri: program.thumbnail || 'https://images.unsplash.com/photo-1517960419151-0c2b8c8e5a1c?q=80&w=1470' }}
                  imageStyle={{ borderRadius: 18 }}
                  resizeMode="cover"
                  className="w-full h-[220px] justify-end"
                >
                  {/* Show isFeatured badge at top right */}
                  {program.isFeatured && (
                    <View className="absolute top-3 right-3 bg-yellow-300 rounded-full py-1 px-3 z-10">
                      <Text className="text-yellow-900 font-bold text-xs">
                        Featured
                      </Text>
                    </View>
                  )}
                  {/* Overlay for details at the bottom */}
                  <View
                    className="px-2 py-2 bg-white rounded-2xl ml-1 mb-1 mr-1 mt-0 "
                  >
                    <View>
                      <View className="flex-row items-center justify-between mb-0.5">
                        <Text className="text-lg font-bold text-black">
                          {program.programName}
                        </Text>
                        <View className="flex-row items-center ml-2">
                          <Ionicons name="star" size={16} color="#fbbf24" style={{ marginRight: 2 }} />
                          <Text className="text-amber-400 font-bold text-base">
                            {program.rating ? program.rating.toFixed(1) : 'N/A'}
                          </Text>
                        </View>
                      </View>
                     <View className="flex-row flex-wrap items-center mb-0.5 ">
                        <Text className="text-black font-bold text-xs bg-white/20 rounded-full px-1 py-1">{program.category}</Text>
                        <Text className="text-black text-lg font-bold mx-1">•</Text>
                        <Text className="text-black font-bold text-xs bg-white/20 rounded-full px-1 py-1">{program.goal}</Text>
                        <Text className="text-black text-lg font-bold mx-1">•</Text>
                        <Text className="text-black font-bold text-xs bg-white/20 rounded-full px-1 py-1">{program.difficulty}</Text>
                      </View>
                      <View className="flex-row flex-wrap items-center mb-0.5 ">
                        <Text className="text-blue-500 font-bold text-xs mr-2 bg-white/20 rounded-full px-1 py-1">
                          {program.duration && program.duration.weeks ? `${program.duration.weeks} week${program.duration.weeks > 1 ? 's' : ''}` : ''}
                        </Text>
                        <Text className="text-amber-500 font-bold text-xs mr-2 bg-white/20 rounded-full px-1 py-1">
                          {program.duration && program.duration.sessionsPerWeek ? `${program.duration.sessionsPerWeek} sessions/week` : ''}
                        </Text>
                        <Text className="text-emerald-500 font-bold text-xs mr-2 bg-white/20 rounded-full px-1 py-1">
                          {program.totalWorkouts ? `${program.totalWorkouts} workouts` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


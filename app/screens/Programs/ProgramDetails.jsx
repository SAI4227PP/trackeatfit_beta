import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";


export default function ProgramDetails() {
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(0); // Show first day by default
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const router = useRouter();

  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id; // Adjust according to your user object structure
 
 useEffect(() => {
    async function fetchProgram() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_URL}/api/v3/programs/${id}?userId=${userId}`
        );
        const json = await res.json();
        setProgram(json.data || null);
      } catch (e) {
        setError('Failed to load program details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProgram();
  }, [id]);

  const handleStartProgram = async () => {
    setStarting(true);
    setStartError(null);
    try {
      if (!userId) throw new Error('User not logged in');
      const programId = program && (program._id || program.id);
      if (!programId) {
        setStartError('Program ID is missing. Please try again later.');
        setStarting(false);
        return;
      }
      const res = await fetch(
        `${API_URL}/api/v3/user-program-progress/progress/${userId}/${programId}/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programName: program.name || program.programName }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to start program');
      // Set local status so "Current Program" is shown
      setProgram(prev => prev ? { ...prev, userProgramStatus: 'in_progress' } : prev);
      // Optionally: navigate or update UI
      // router.push('/screens/ActiveProgram');
    } catch (err) {
      setStartError(err.message || 'Failed to start program');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading program...</Text>
      </View>
    );
  }

  if (error || !program) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#ef4444', fontSize: 16 }}>{error || 'Program not found.'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header with back navigation */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: 'rgba(255,255,255,0.8)',
          zIndex: 20
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginRight: 8,
              padding: 4,
              borderRadius: 999,
              // active:bg-slate-100 not directly supported, so skip
            }}
          >
            <Ionicons name="chevron-back-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Program Overview</Text>
        </View>
        <ImageBackground
          source={{ uri: program.thumbnail || 'https://images.unsplash.com/photo-1517960419151-0c2b8c8e5a1c?q=80&w=1470' }}
          style={{ width: '100%', height: 400 }}
          imageStyle={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
          resizeMode="cover"
        />
        <View style={{ padding: 20 }}>
          {/* Program Name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>
              {program.name || program.programName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
              <Ionicons name="star" size={20} color="#fbbf24" style={{ marginRight: 2 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fbbf24' }}>
                {program.rating ? program.rating.toFixed(1) : 'N/A'}
              </Text>
            </View>
          </View>
          {/* Category, Goal, Difficulty */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6', marginRight: 12 }}>{program.category}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#10b981', marginRight: 12 }}>{program.goal}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#f59e42', marginRight: 12, textTransform: 'capitalize' }}>{program.difficulty}</Text>
          </View>
          {/* Target Muscle Groups */}
          {program.targetMuscleGroups && program.targetMuscleGroups.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155', marginRight: 8 }}>Target:</Text>
              {program.targetMuscleGroups.map((muscle, idx) => (
                <Text key={idx} style={{
                  fontSize: 12,
                  backgroundColor: '#dbeafe',
                  color: '#2563eb',
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginRight: 8,
                  marginBottom: 4
                }}>
                  {muscle}
                </Text>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text style={{ marginLeft: 8, color: '#3b82f6', fontWeight: 'bold' }}>
              {program.duration && program.duration.weeks ? `${program.duration.weeks} week${program.duration.weeks > 1 ? 's' : ''}` : ''}
            </Text>
            <Text style={{ marginLeft: 16, color: '#fbbf24', fontWeight: 'bold' }}>
              {program.duration && program.duration.sessionsPerWeek ? `${program.duration.sessionsPerWeek} sessions/week` : ''}
            </Text>
            <Text style={{ marginLeft: 16, color: '#10b981', fontWeight: 'bold' }}>
              {program.totalWorkouts ? `${program.totalWorkouts} workouts` : ''}
            </Text>
          </View>
          {/* Additional Program Details */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash-outline" size={16} color="#f59e42" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#f59e42' }}>
                  <Text style={{ color: '#334155' }}>Training Style : {program.trainingStyle}</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="earth-outline" size={16} color="#22d3ee" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#0891b2' }}>
                  <Text style={{ color: '#334155' }}>Environment : {program.environment}</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="male-female-outline" size={16} color="#a21caf" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#a21caf' }}>
                  <Text style={{ color: '#334155' }}>Gender : {program.genderSuitability}</Text>
                </Text>
              </View>
            </View>
            {/* Recommended Equipment */}
            {program.recommendedEquipment && program.recommendedEquipment.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
                <Ionicons name="construct-outline" size={16} color="#3b82f6" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563eb', marginRight: 8 }}>Equipment:</Text>
                {program.recommendedEquipment.map((eq, idx) => (
                  <Text key={idx} style={{
                    fontSize: 12,
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginRight: 8,
                    marginBottom: 4
                  }}>
                    {eq}
                  </Text>
                ))}
              </View>
            )}
            {/* Tags */}
            {program.tags && program.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="pricetags-outline" size={16} color="#f59e42" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#f59e42', marginRight: 8 }}>Tags:</Text>
                {program.tags.map((tag, idx) => (
                  <Text key={idx} style={{
                    fontSize: 12,
                    backgroundColor: '#ffedd5',
                    color: '#f59e42',
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginRight: 8,
                    marginBottom: 4
                  }}>
                    {tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <Text style={{ fontSize: 16, color: '#334155', marginBottom: 16 }}>
            {program.description || 'No description available.'}
          </Text>
          {/* Start Program Button */}
          {program.userProgramStatus === 'in_progress' ? (
            <View style={{
              backgroundColor: '#d1fae5',
              borderRadius: 16,
              paddingVertical: 12,
              marginBottom: 16,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#047857' }}>
                Your Active Program
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: '#3b82f6',
                borderRadius: 16,
                paddingVertical: 12,
                marginBottom: 16,
                alignItems: 'center'
              }}
              activeOpacity={0.85}
              onPress={handleStartProgram}
              disabled={starting}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                {starting ? 'Starting...' : 'Start Program'}
              </Text>
            </TouchableOpacity>
          )}
          {startError && (
            <Text style={{ color: '#ef4444', marginBottom: 8, textAlign: 'center' }}>{startError}</Text>
          )}
          {/* Program Schedule */}
          {program.schedule && program.schedule.length > 0 && (
            <View style={{ marginTop: 24 }}>
              {/* Sticky header for Program Schedule */}
              <View style={{ backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 10, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="calendar-outline" size={22} color="#3b82f6" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3b82f6' }}>
                    Program Schedule
                  </Text>
                </View>
                <View style={{ height: 2, backgroundColor: '#dbeafe', borderRadius: 999 }} />
              </View>
              {program.schedule.map((day, idx) => (
                <View key={day.day} style={{ marginBottom: 24 }}>
                  {/* Day header with expand/collapse icon */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}
                    onPress={() => setExpandedDay(expandedDay === idx ? -1 : idx)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        shadowOffset: { width: 0, height: 1 }
                      }}>
                        <View style={{
                          backgroundColor: '#fff',
                          borderRadius: 999,
                          padding: 8,
                          marginRight: 12,
                          borderWidth: 1,
                          borderColor: '#dbeafe',
                          shadowColor: '#000',
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          shadowOffset: { width: 0, height: 1 }
                        }}>
                          <Ionicons name="sunny-outline" size={20} color="#fbbf24" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#3b82f6',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 2
                          }}>
                            Day {day.day}
                          </Text>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 }}>
                            {day.title}
                          </Text>
                          {day.description && (
                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>{day.description}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={expandedDay === idx ? "chevron-up-outline" : "chevron-down-outline"}
                      size={22}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                  {/* Show details only if expanded */}
                  {expandedDay === idx && (
                    <View style={{
                      backgroundColor: '#fff',
                      borderRadius: 24,
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 1 },
                      borderWidth: 1,
                      borderColor: '#f1f5f9',
                      padding: 8,
                      marginTop: 4
                    }}>
                      {day.exercises && day.exercises.length > 0 ? (
                        day.exercises.map((ex, exIdx) => (
                          <TouchableOpacity
                            key={ex.id || exIdx}
                            style={{ marginBottom: 16, width: '100%' }}
                            activeOpacity={0.85}
                            onPress={() => {
                              if (ex.id) {
                                router.push(`screens/Exercise?exerciseId=${ex.id}`);
                              }
                            }}
                          >
                            <View style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 24,
                              shadowColor: '#000',
                              shadowOpacity: 0.08,
                              shadowRadius: 2,
                              shadowOffset: { width: 0, height: 1 },
                              borderWidth: 1,
                              borderColor: '#f1f5f9',
                              paddingHorizontal: 8,
                              paddingVertical: 8,
                              width: '98%',
                              alignSelf: 'center'
                            }}>
                              {/* Exercise name and subtitle */}
                              <Text style={{ fontWeight: 'bold', fontSize: 24, color: '#1e293b', marginBottom: 4 }}>{ex.name}</Text>
                              {ex.subtitle && (
                                <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{ex.subtitle}</Text>
                              )}
                              {ex.notes && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                  <Ionicons name="document-text-outline" size={14} color="#f59e42" style={{ marginRight: 4 }} />
                                  <Text style={{ fontSize: 14, fontWeight: '400', color: '#f59e42', fontStyle: 'italic' }}>{ex.notes}</Text>
                                </View>
                              )}
                              {/* Equipment icon and label */}
                              {ex.equipment && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                  <Ionicons name="construct-outline" size={14} color="#3b82f6" style={{ marginRight: 4 }} />
                                  <Text style={{ fontSize: 14, fontWeight: '400', color: '#2563eb' }}>{ex.equipment}</Text>
                                </View>
                              )}
                              {/* Exercise details grid */}
                              <View style={{
                                backgroundColor: '#fff',
                                borderRadius: 24,
                                padding: 16,
                                marginBottom: 8,
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                                shadowColor: '#000',
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                shadowOffset: { width: 0, height: 1 }
                              }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                  {/* Tempo */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
                                    <View style={{
                                      height: 32,
                                      width: 32,
                                      borderRadius: 8,
                                      backgroundColor: '#dbeafe',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 8
                                    }}>
                                      <Ionicons name="speedometer-outline" size={20} color="#3b82f6" />
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>Tempo</Text>
                                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#1e293b' }}>{ex.tempo}</Text>
                                    </View>
                                  </View>
                                  {/* Reps */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
                                    <View style={{
                                      height: 32,
                                      width: 32,
                                      borderRadius: 8,
                                      backgroundColor: '#dbeafe',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 8
                                    }}>
                                      <Ionicons name="list-outline" size={20} color="#3b82f6" />
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>Reps</Text>
                                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#1e293b' }}>{ex.reps}</Text>
                                    </View>
                                  </View>
                                  {/* Sets */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
                                    <View style={{
                                      height: 32,
                                      width: 32,
                                      borderRadius: 8,
                                      backgroundColor: '#dbeafe',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 8
                                    }}>
                                      <Ionicons name="repeat-outline" size={20} color="#3b82f6" />
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>Sets</Text>
                                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#1e293b' }}>{ex.sets}</Text>
                                    </View>
                                  </View>
                                  {/* Rest */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
                                    <View style={{
                                      height: 32,
                                      width: 32,
                                      borderRadius: 8,
                                      backgroundColor: '#dbeafe',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 8
                                    }}>
                                      <Ionicons name="pause-circle-outline" size={20} color="#3b82f6" />
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>Rest</Text>
                                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#1e293b' }}>{ex.rest}</Text>
                                    </View>
                                  </View>
                                  {/* Calories */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
                                    <View style={{
                                      height: 32,
                                      width: 32,
                                      borderRadius: 8,
                                      backgroundColor: '#dbeafe',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 8
                                    }}>
                                      <Ionicons name="flame-outline" size={20} color="#f87171" />
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>Calories/Set</Text>
                                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#1e293b' }}>{ex.calories}</Text>
                                    </View>
                                  </View>
                                  {/* Duration */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '48%' }}>
                                    <View style={{
                                      height: 32,
                                      width: 32,
                                      borderRadius: 8,
                                      backgroundColor: '#dbeafe',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: 8
                                    }}>
                                      <Ionicons name="timer-outline" size={20} color="#10b981" />
                                    </View>
                                    <View>
                                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>Duration/Set</Text>
                                      <Text style={{ fontWeight: '600', fontSize: 16, color: '#1e293b' }}>{ex.duration} sec</Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                              {/* ...existing code for any additional details... */}
                            </View>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={{ color: '#ef4444', marginTop: 4 }}>No exercises listed.</Text>
                      )}
                    </View>
                  )}
                  {/* Divider between days, except after last */}
                  {idx < program.schedule.length - 1 && (
                    <View style={{ marginVertical: 16, height: 2, backgroundColor: '#e2e8f0', borderRadius: 999 }} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



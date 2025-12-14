import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ImageBackground, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

export default function ActiveProgram() {
  const [data, setData] = useState(null);
  const [upcomingSchedule, setUpcomingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id;
  const { id: programId } = route.params || {};

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!programId || !userId) {
          setError('Missing program or user ID');
          setLoading(false);
          return;
        }

        // Fetch program progress which includes all program details
        const progressRes = await fetch(`${API_URL}/api/v3/user-program-progress/progress/${userId}/${programId}`);
        const progressJson = await progressRes.json();

        if (progressJson.success) {
          const schedule = progressJson.data.programDetails?.schedule || [];
          setData(progressJson.data);
          setUpcomingSchedule(schedule);
        } else {
          setError('Failed to load program');
        }
      } catch (e) {
        setError('Failed to load program');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [programId, userId]);

  const toggleSession = (idx) => {
    setExpandedSessions(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      } else {
        return [...prev, idx];
      }
    });
  };

  // Utility functions for session status
  const getSessionStatus = (dayIndex) => {
    if (!data) return 'pending';
    if (!data.sessionLogs) return 'upcoming';

    // Convert to 1-based day number to match backend
    const dayNum = dayIndex + 1;
    
    // Find session log for this day
    const sessionLog = data.sessionLogs.find(log => log.day === dayNum);
    
    if (sessionLog) {
      if (sessionLog.isMissed) return 'missed';
      if (sessionLog.isRestDay) return 'rest';
      if (sessionLog.isRecoveryDay) return 'recovery';
      
      // Check if all exercises were skipped
      const allExercisesSkipped = sessionLog.completedExercises?.every(ex => ex.skipped);
      if (allExercisesSkipped) return 'skipped';
      if (sessionLog.completedAt) return 'completed';
    }

    // If no session log found, check other status arrays
    if (data.completedDays?.includes(dayNum)) return 'completed';
    if (data.skippedDays?.includes(dayNum)) return 'skipped';
    if (data.restDays?.includes(dayNum)) return 'rest';
    if (data.missedDays?.includes(dayNum)) return 'missed';
    
    // Check if the day should be marked as missed based on current date
    const startDate = new Date(data.startedAt);
    startDate.setHours(0, 0, 0, 0);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Calculate the date for this session
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + dayIndex);
    sessionDate.setHours(0, 0, 0, 0);
    
    // If today's date, mark as upcoming (day isn't over yet)
    if (sessionDate.getTime() === currentDate.getTime()) {
      return 'upcoming';
    }
    
    // If the session date has passed (before today) and it's not completed or rest
    if (sessionDate < currentDate && 
        !data.restDays?.includes(dayNum) && 
        !data.completedDays?.includes(dayNum)) {
      return 'missed';
    }
    
    return 'upcoming';
  };

  const isDayInteractive = (dayIndex) => {
    if (!data) return false;
    const todayIndex = getTodaySessionIndex();
    return dayIndex === todayIndex;
  };

  const getTodaySessionIndex = () => {
    if (!data?.startedAt) return -1;
    const startDate = new Date(data.startedAt);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : -1;
  };

  // Add this helper function after getTodaySessionIndex
  const getSessionUnlockDate = (dayIndex) => {
    if (!data?.startedAt) return '';
    const startDate = new Date(data.startedAt);
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + dayIndex);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (sessionDate.getTime() === today.getTime()) return 'Today';
    if (sessionDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return sessionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Session status styles
  const getSessionStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-500';
      case 'missed':
        return 'bg-red-100 border-red-500';
      case 'rest':
        return 'bg-blue-100 border-blue-500';
      case 'recovery':
        return 'bg-purple-100 border-purple-500';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Session status icon
  const getSessionStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'missed':
        return 'alert-circle';
      case 'rest':
        return 'bed';
      case 'recovery':
        return 'fitness';
      default:
        return 'time';
    }
  };

  // Session status color
  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'missed':
        return '#ef4444';
      case 'rest':
        return '#3b82f6';
      case 'recovery':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-400 mt-2">Loading program...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" style={{ marginBottom: 8 }} />
          <Text className="text-red-500 text-center text-base font-semibold">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { programName, status, startedAt, progressPercentage, totalSessionsCompleted, totalMinutesTrained, programDetails, sessionLogs } = data;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-3 py-3 bg-white/80 z-20">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1 rounded-full active:bg-slate-100">
            <Ionicons name="arrow-back" size={24} color="#334155" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Active Program</Text>
        </View>
        {/* Program Thumbnail as ImageBackground */}
        <ImageBackground
          source={{
            uri:
              programDetails?.thumbnail ||
              'https://images.unsplash.com/photo-1517960419151-0c2b8c8e5a1c?q=80&w=1470'
          }}
          style={{ width: '100%', height: 320 }}
          imageStyle={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
          resizeMode="cover"
        />
        <View className="p-5">
          {/* Program Name & Status */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-bold text-slate-900 flex-1" numberOfLines={2}>
              {programName}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${
                status === 'completed'
                  ? 'bg-green-100'
                  : status === 'in_progress'
                  ? 'bg-blue-100'
                  : 'bg-slate-200'
              }`}
              style={{ minWidth: 90, alignItems: 'center' }}
            >
              <Text
                className={`text-xs font-semibold ${
                  status === 'completed'
                    ? 'text-green-700'
                    : status === 'in_progress'
                    ? 'text-blue-700'
                    : 'text-slate-500'
                }`}
              >
                {status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          {/* Category, Goal, Difficulty */}
          <View className="flex-row flex-wrap items-center mb-2">
            <Text className="text-xs font-semibold text-blue-500 mr-3">{programDetails?.category}</Text>
            <Text className="text-xs font-semibold text-emerald-500 mr-3">{programDetails?.goal}</Text>
            <Text className="text-xs font-semibold text-orange-500 mr-3 capitalize">{programDetails?.difficulty}</Text>
          </View>
          {/* Target Muscle Groups */}
          {programDetails?.targetMuscleGroups && programDetails.targetMuscleGroups.length > 0 && (
            <View className="flex-row flex-wrap items-center mb-3">
              <Text className="text-xs font-semibold text-slate-700 mr-2">Target:</Text>
              {programDetails.targetMuscleGroups.map((muscle, idx) => (
                <Text key={idx} className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 mr-2 mb-1">
                  {muscle}
                </Text>
              ))}
            </View>
          )}
          {/* Duration, Sessions, Workouts */}
          <View className="flex-row mb-3">
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text className="ml-2 text-blue-500 font-bold">
              {programDetails?.duration?.weeks ? `${programDetails.duration.weeks} week${programDetails.duration.weeks > 1 ? 's' : ''}` : ''}
            </Text>
            <Text className="ml-4 text-amber-500 font-bold">
              {programDetails?.duration?.sessionsPerWeek ? `${programDetails.duration.sessionsPerWeek} sessions/week` : ''}
            </Text>
            <Text className="ml-4 text-emerald-500 font-bold">
              {programDetails?.totalWorkouts ? `${programDetails.totalWorkouts} workouts` : ''}
            </Text>
          </View>
          {/* Additional Program Details */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Ionicons name="flash-outline" size={16} color="#f59e42" style={{ marginRight: 4 }} />
                <Text className="text-xs font-semibold text-orange-600">
                  <Text className="text-slate-700">Training Style : {programDetails?.trainingStyle}</Text>
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="construct-outline" size={16} color="#3b82f6" style={{ marginRight: 4 }} />
                <Text className="text-xs font-semibold text-blue-700">
                  <Text className="text-slate-700">Equipment : {programDetails?.recommendedEquipment?.join(', ') || 'None'}</Text>
                </Text>
              </View>
            </View>
            {/* Tags */}
            {programDetails?.tags && programDetails.tags.length > 0 && (
              <View className="flex-row flex-wrap items-center mt-1">
                <Ionicons name="pricetags-outline" size={16} color="#f59e42" style={{ marginRight: 4 }} />
                <Text className="text-xs font-semibold text-orange-700 mr-2">Tags:</Text>
                {programDetails.tags.map((tag, idx) => (
                  <Text key={idx} className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 mr-2 mb-1">
                    {tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
          {/* Description */}
          <Text className="text-base text-slate-800 mb-4">
            {programDetails?.description || 'No description available.'}
          </Text>
          {/* Progress Bar */}
          <View className="mb-6">
            <View className="flex-row items-center mb-1">
              <Text className="text-gray-900 font-semibold tracking-wide">Progress</Text>
            </View>
            <View className="flex-row items-center mt-2">
              {/* Flame icon left of progress bar */}
              <Ionicons name="flame" size={20} color="#ef4444" style={{ marginRight: 10 }} />
              <View className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${progressPercentage || 0}%`,
                    height: '100%',
                    backgroundColor: progressPercentage > 0 ? '#3b82f6' : '#cbd5e1',
                    borderRadius: 8,
                    shadowColor: '#3b82f6',
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }}
                />
              </View>
              <Text
                className="text-gray-900 ml-3 font-bold text-base"
                style={{ minWidth: 48, textAlign: 'right' }}
              >
                {progressPercentage} %
              </Text>
            </View>
          </View>
          {/* Stats */}
          <View className="flex-row items-center justify-center space-x-4 mb-6">
            <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-2 shadow-sm border border-slate-100">
              <Ionicons name="time-outline" size={16} color="#3b82f6" />
              <Text className="text-gray-900 ml-2 text-sm font-medium">{totalMinutesTrained} min</Text>
            </View>
            <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-2 shadow-sm border border-slate-100">
              <Ionicons name="flame-outline" size={16} color="#ef4444" />
              <Text className="text-gray-900 ml-2 text-sm font-medium">{totalSessionsCompleted} sessions</Text>
            </View>
          </View>
          
          {/* Start Session Button */}
          {upcomingSchedule && upcomingSchedule.length > 0 && (
            <View className="mb-6">
              {(() => {
                const nextSession = upcomingSchedule.find(session => 
                  !sessionLogs?.some(log => log.day === session.day)
                );
                
                if (!nextSession) return null;
                
                return (
                  <TouchableOpacity
                    className="flex-row items-center justify-center space-x-2 px-8 py-4 bg-blue-600 rounded-2xl shadow-lg"
                    onPress={() => {
                      navigation.navigate('screens/Programs/StartSession', {
                        programId,
                        nextSession: nextSession.day,
                        schedule: nextSession
                      });
                    }}
                  >
                    <Ionicons name="play-circle" size={24} color="white" />
                    <Text className="text-white font-bold text-lg ml-1">
                      Start Session  {nextSession.day}
                    </Text>
                    {/* <Text className="text-white text-sm ml-1">
                      ({nextSession.day}/{programDetails?.schedule?.length || 0})
                    </Text> */}
                  </TouchableOpacity>
                );
              })()}
            </View>
          )}

          {/* Started At - Styled Version */}
          <View className="flex-row items-center justify-center bg-slate-50 py-2 px-4 rounded-full mb-2">
            <Ionicons name="calendar-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
            <Text className="text-sm text-slate-600 font-medium">
              Started on {new Date(startedAt).toLocaleDateString('en-US', { 
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Asia/Kolkata'
              })}
            </Text>
          </View>
        </View>
        {/* Session Logs Section */}
        <View className="bg-white rounded-2xl shadow p-5 border border-slate-100 mx-4 mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">Session Logs</Text>
          {/* Completed Sessions */}
          {sessionLogs && sessionLogs.map((log, idx) => (
            <View key={idx} className="mb-4 p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
              <TouchableOpacity 
                onPress={() => toggleSession(idx)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-blue-900">Session {log.day ? log.day : idx + 1}</Text>
                  <Text className="text-xs text-gray-400 ml-2">{log.date ? new Date(log.date).toLocaleDateString() : '-'}</Text>
                </View>
                <MaterialCommunityIcons 
                  name={expandedSessions.includes(idx) ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#64748b" 
                />
              </TouchableOpacity>
              
              {expandedSessions.includes(idx) && (
                <View className="mt-3">
                  <View className="flex-row flex-wrap mb-2">
                    <View className="mr-4 mb-1 flex-row items-center">
                      <MaterialCommunityIcons name="star-circle" size={16} color="#fbbf24" style={{ marginRight: 2 }} />
                      <Text className="text-xs text-gray-700 font-semibold">Rating: </Text>
                      <Text className="text-xs text-gray-700">{log.rating ?? '-'}</Text>
                    </View>
                    <View className="mr-4 mb-1 flex-row items-center">
                      <MaterialCommunityIcons name="battery" size={16} color="#38bdf8" style={{ marginRight: 2 }} />
                      <Text className="text-xs text-gray-700 font-semibold">Energy: </Text>
                      <Text className="text-xs text-gray-700">{log.energyLevel ?? '-'}</Text>
                    </View>
                    <View className="mr-4 mb-1 flex-row items-center">
                      <MaterialCommunityIcons name="weight-lifter" size={16} color="#f87171" style={{ marginRight: 2 }} />
                      <Text className="text-xs text-gray-700 font-semibold">Difficulty: </Text>
                      <Text className="text-xs text-gray-700">{log.difficultyRating ?? '-'}</Text>
                    </View>
                    <View className="mb-1 flex-row items-center">
                      <MaterialCommunityIcons name="tune-variant" size={16} color="#a78bfa" style={{ marginRight: 2 }} />
                      <Text className="text-xs text-gray-700 font-semibold">Adjustment: </Text>
                      <Text className="text-xs text-gray-700">{log.adjustmentSuggestion ?? '-'}</Text>
                    </View>
                  </View>
                  {Array.isArray(log.completedExercises) && log.completedExercises.length > 0 && (
                    <View className="mt-2">
                      <Text className="text-xs font-semibold text-blue-700 mb-1">Completed Exercises</Text>
                      {log.completedExercises.map((ex, exIdx) => (
                        <TouchableOpacity
                          key={ex._id || exIdx}
                          className="mb-2 ml-2"
                          activeOpacity={0.8}
                          onPress={() => {
                            navigation.navigate('screens/Exercise', {
                              exerciseId: ex.exerciseId,
                            });
                          }}
                        >
                          <View className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-xs font-bold text-gray-800">{ex.exerciseName}</Text>
                              {ex.skipped && <Text className="text-xs text-red-500 font-semibold">Skipped</Text>}
                            </View>
                            <View className="flex-row flex-wrap mb-1">
                              <Text className="text-xs text-gray-700 mr-4">Sets: <Text className="font-semibold">{ex.setsCompleted}</Text></Text>
                              <Text className="text-xs text-gray-700">Reps: <Text className="font-semibold">{ex.repsCompleted}</Text></Text>
                            </View>
                            {ex.notes && <Text className="text-xs text-gray-500 italic">"{ex.notes}"</Text>}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
          
          {/* Upcoming Sessions */}
          {programDetails?.schedule && (
            <>
              <Text className="text-base font-semibold text-gray-600 mt-6 mb-3">Upcoming Sessions</Text>
              {programDetails.schedule.map((session, idx) => {
                const sessionStatus = getSessionStatus(idx);
                const isInteractive = isDayInteractive(idx);
                const isCompleted = sessionLogs?.some(log => log.day === session.day);
                
                if (isCompleted) return null;
                
                return (
                  
                  <TouchableOpacity
                    key={`upcoming-${idx}`}
                    className={`mb-4 p-4 bg-white rounded-xl border ${
                      isInteractive ? 'border-blue-300' : 'border-slate-200'
                    } shadow-sm`}
                    onPress={() => {
                      if (isInteractive) {
                        navigation.navigate('screens/Programs/StartSession', {
                          programId,
                          nextSession: session.day,
                          schedule: session
                        });
                      }
                    }}
                    disabled={!isInteractive}
                  >
                    <View className="flex-col items-start mr-4 w-18">
                        <Text className="text-sm font-medium text-slate-400">{getSessionUnlockDate(idx)}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className={`rounded-lg p-2 mr-3 ${
                          sessionStatus === 'completed' ? 'bg-green-600' :
                          sessionStatus === 'skipped' ? 'bg-amber-500' :
                          sessionStatus === 'rest' ? 'bg-blue-400' :
                          sessionStatus === 'missed' ? 'bg-red-500' :
                          'bg-blue-600'
                        }`}>
                          <Text className="text-white font-bold">D{session.day}</Text>
                        </View>
                        <View>
                          <Text className="text-base font-bold text-blue-900">{session.title}</Text>
                          <Text className="text-sm text-gray-500">{session.exercises?.length || 0} exercises</Text>
                        </View>
                      </View>
                      {isInteractive && (
                        <View className="flex-row items-center">
                          <Ionicons name="play-circle" size={30} color="#2563eb" />
                        </View>
                      )}
                      {!isInteractive && (
                        <Ionicons name="lock-closed" size={20} color="#94a3b8" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          
          {/* Show empty state if no sessions */}
          {(!sessionLogs || sessionLogs.length === 0) && (
            <View className="items-center py-6">
              <MaterialCommunityIcons name="calendar-remove-outline" size={48} color="#cbd5e1" style={{ marginBottom: 8 }} />
              <Text className="text-gray-400 text-sm text-center">No session logs yet.{"\n"}Start your first session to see progress here!</Text>
              <TouchableOpacity
                className="mt-4 px-6 py-2 bg-blue-600 rounded-full"
                onPress={() => {
                  navigation.navigate('screens/Programs/StartSession', {
                    programId,
                    nextSession: 1
                  });
                }}
              >
                <Text className="text-white font-semibold text-base">Start Session 1</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

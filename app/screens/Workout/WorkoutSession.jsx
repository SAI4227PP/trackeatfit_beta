import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from '../../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

const WorkoutSession = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exercise } = route.params || {};
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id;

  // Default values if not provided
  const totalSets = Number(exercise?.sets) || 3;
  const reps = exercise?.reps || "10-12";
  const rest = exercise?.rest || "60s";
  const duration = Number(exercise?.duration) || 30;

  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSets, setCompletedSets] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  // Feedback modal state (from StartSession)
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [adjustmentSuggestion, setAdjustmentSuggestion] = useState('same');
  const [sessionNotes, setSessionNotes] = useState('');
  const timerRef = useRef(null);
  const totalTimerRef = useRef(null);
  const [startedAt, setStartedAt] = useState(null);

  // Standard time per set (in seconds) for analysis (e.g., 40s per set)
  const STANDARD_SET_TIME = 40;
  const standardTotalTime = totalSets * STANDARD_SET_TIME;

  // Track user set completion times
  const [setTimes, setSetTimes] = useState([]);
  const [setStartTime, setSetStartTime] = useState(null);

  useEffect(() => {
    if (isRunning && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      // Do NOT reset timer here; let it show 0 until user completes the set
      Alert.alert("Set Complete", "Time's up for this set!", [
        { text: "OK", onPress: () => {} }
      ]);
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timer]);

  useEffect(() => {
    totalTimerRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    return () => clearInterval(totalTimerRef.current);
  }, []);

  // Start set: record start time
  const handleStartSet = () => {
    if (!startedAt) setStartedAt(new Date().toISOString());
    setTimer(duration);
    setIsRunning(true);
    setSetStartTime(Date.now());
  };

  // Complete set: record time taken for this set
  const handleCompleteSet = () => {
    const nextCompletedSets = [...completedSets, currentSet];
    setCompletedSets(nextCompletedSets);
    setIsRunning(false);
    setTimer(duration);

    // Record set time
    if (setStartTime) {
      const timeTaken = Math.round((Date.now() - setStartTime) / 1000);
      setSetTimes([...setTimes, timeTaken]);
    }

    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setSetStartTime(Date.now());
    } else {
      setModalVisible(false);
      setSetStartTime(null);
    }
  };

  const handleSkipSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setIsRunning(false);
      setTimer(duration);
    } else {
      handleFinishWorkout();
    }
  };

  // Show feedback modal before logging session
  const handleFinishWorkout = () => {
    setShowFeedback(true);
  };

  // Actually log the session after feedback
  const submitSessionLog = async () => {
    setIsRunning(false);
    setLoading(true);
    setApiError(null);
    const analysis = getAnalysis();

    // Check for exerciseId
    if (!exercise?._id) {
      console.warn("Warning: exercise._id is missing. Exercise object:", exercise);
    }

    const performanceMetrics = {
      avgSetTime: setTimes.length > 0 ? Math.round(setTimes.reduce((a, b) => a + b, 0) / setTimes.length) : null,
      totalTime: setTimes.reduce((a, b) => a + b, 0),
      caloriesBurned: exercise?.caloriesBurnedPerSet ? exercise.caloriesBurnedPerSet * completedSets.length : null,
      perceivedExertion: difficultyRating,
    };

    // Log performanceMetrics for debugging
    console.log("Performance metrics:", performanceMetrics);

    const sessionData = {
      userId: userId || "demo-user-id",
      sessionDate: new Date().toISOString(),
      // For individual session, only include minimal fields
      startedAt: startedAt, // <-- use the recorded start time
      completedAt: new Date().toISOString(),
      durationInMinutes: Math.round(totalSeconds / 60),
      totalCaloriesBurned: exercise?.caloriesBurnedPerSet ? exercise.caloriesBurnedPerSet * completedSets.length : null,
      rating,
      energyLevel,
      difficultyRating,
      adjustmentSuggestion,
      notes: sessionNotes,
      feedback: "",
      exercises: [
        {
          exerciseId: exercise?._id || null,
          exerciseName: exercise?.name || "Unknown Exercise",
          repsCompleted: completedSets.length.toString(),
          skipped: completedSets.length < totalSets,
          performanceMetrics,
        }
      ],
      workoutAnalysis: analysis
        ? {
            userTotal: analysis.userTotal,
            standardTotalTime: analysis.standardTotalTime,
            diff: analysis.diff,
            faster: analysis.faster,
            setTimes: analysis.setTimes,
          }
        : null,
      status: completedSets.length === totalSets ? 'completed' : 'in_progress',
    };

    // Log session data with expanded objects
    console.log("Submitting session data:", JSON.stringify(sessionData, null, 2));

    try {
      // Call the individual workout session API endpoint using fetch
      const apiUrl = `${API_URL}/api/v3/workouts/individual`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save session');
      }
      setLoading(false);
      setShowFeedback(false);
      Alert.alert(
        "Workout Complete",
        `You completed ${completedSets.length} out of ${totalSets} sets.\nSession saved!`,
        [
          {
            text: "Done",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      setLoading(false);
      setShowFeedback(false);
      setApiError(err?.message || 'Failed to save session');
      Alert.alert(
        "Error",
        `Failed to save workout session.\n${err?.message}`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getAnalysis = () => {
    if (setTimes.length === 0) return null;
    const userTotal = setTimes.reduce((a, b) => a + b, 0);
    const diff = userTotal - standardTotalTime;
    const faster = diff < 0;
    return {
      userTotal,
      standardTotalTime,
      diff: Math.abs(diff),
      faster,
      setTimes,
    };
  };

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-700">No exercise data provided.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]">
       {/* Feedback Modal */}
              <Modal
                visible={showFeedback}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFeedback(false)}
              >
                <View className="flex-1 bg-black/50 justify-end">
                  <View className="bg-white rounded-t-3xl max-h-[90%]">
                    <View className="p-6 border-b border-slate-100">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-2xl font-bold text-slate-900">Session Feedback</Text>
                        <TouchableOpacity
                          onPress={() => setShowFeedback(false)}
                          className="p-2 -mr-2 rounded-full active:bg-slate-100"
                        >
                          <Ionicons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-slate-500">Help us improve your workout experience</Text>
                    </View>
      
                    <ScrollView className="px-6">
                      <View className="py-6">
                        <View className="mb-8">
                          <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                              <Ionicons name="star" size={24} color="#2563eb" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-slate-900">Rate Your Workout</Text>
                              <Text className="text-sm text-slate-500">How was your overall experience?</Text>
                            </View>
                          </View>
                          <View className="flex-row justify-between bg-slate-50 p-1 rounded-xl">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <TouchableOpacity
                                key={value}
                                onPress={() => setRating(value)}
                                className={`flex-1 py-3 rounded-lg ${rating === value ? 'bg-white shadow' : ''}`}
                              >
                                <Text className={`text-2xl text-center ${rating === value ? 'scale-110' : 'opacity-50'}`}>
                                  {['😞', '😕', '😐', '🙂', '🤩'][value - 1]}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
      
                        <View className="mb-8">
                          <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#16a34a" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-slate-900">Energy Level</Text>
                              <Text className="text-sm text-slate-500">How energetic did you feel?</Text>
                            </View>
                          </View>
                          <View className="flex-row space-x-2">
                            {['Very Low', 'Low', 'Normal', 'High', 'Very High'].map((label, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => setEnergyLevel(idx + 1)}
                                className={`flex-1 py-3 px-2 rounded-xl border ${
                                  energyLevel === idx + 1
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <Text className={`text-center font-medium ${
                                  energyLevel === idx + 1 ? 'text-green-600' : 'text-slate-600'
                                }`}>
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
      
                        <View className="mb-8">
                          <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                              <MaterialCommunityIcons name="weight-lifter" size={24} color="#ea580c" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-slate-900">Difficulty</Text>
                              <Text className="text-sm text-slate-500">How challenging was it?</Text>
                            </View>
                          </View>
                          <View className="flex-row space-x-2">
                            {['Too Easy', 'Easy', 'Just Right', 'Hard', 'Too Hard'].map((label, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => setDifficultyRating(idx + 1)}
                                className={`flex-1 py-3 px-2 rounded-xl border ${
                                  difficultyRating === idx + 1
                                    ? 'bg-orange-50 border-orange-500'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <Text className={`text-center font-medium ${
                                  difficultyRating === idx + 1 ? 'text-orange-600' : 'text-slate-600'
                                }`}>
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
      
                        <View className="mb-8">
                          <View className="flex-row items-center mb-6">
                            <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                              <Ionicons name="trending-up" size={24} color="#9333ea" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-slate-900">Next Session</Text>
                              <Text className="text-sm text-slate-500">Adjust difficulty for next time?</Text>
                            </View>
                          </View>
                          <View className="flex-row space-x-3">
                            {['easier', 'same', 'harder'].map(opt => (
                              <TouchableOpacity
                                key={opt}
                                onPress={() => setAdjustmentSuggestion(opt)}
                                className={`flex-1 py-4 rounded-xl border ${
                                  adjustmentSuggestion === opt
                                    ? 'bg-purple-50 border-purple-500'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <Text className={`text-center font-semibold ${
                                  adjustmentSuggestion === opt ? 'text-purple-600' : 'text-slate-600'
                                }`}>
                                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
      
                        <View className="mb-6">
                          <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center mr-4">
                              <Ionicons name="chatbox-outline" size={24} color="#475569" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-slate-900">Additional Notes</Text>
                              <Text className="text-sm text-slate-500">Any comments about your session?</Text>
                            </View>
                          </View>
                          <TextInput
                            value={sessionNotes}
                            onChangeText={setSessionNotes}
                            placeholder="Share your thoughts..."
                            multiline
                            className="bg-slate-50 rounded-xl p-4 min-h-[120] text-slate-700"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      </View>
                    </ScrollView>
      
                    <View className="p-6 border-t border-slate-100">
                      <TouchableOpacity
                        className="w-full py-4 bg-blue-600 rounded-xl active:bg-blue-700 shadow-sm"
                        onPress={submitSessionLog}
                        disabled={loading}
                      >
                        <Text className="text-white font-bold text-center text-lg">
                          {loading ? 'Saving Feedback...' : 'Submit Feedback'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
      {/* Loading indicator */}
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={{ marginTop: 10, color: '#6366f1', fontWeight: 'bold' }}>Saving session...</Text>
        </View>
      )}
      {/* API error message */}
      {apiError && (
        <View style={{ position: 'absolute', top: 60, left: 0, right: 0, zIndex: 101, alignItems: 'center' }}>
          <Text style={{ color: 'red', backgroundColor: '#fff0f0', padding: 8, borderRadius: 8 }}>{apiError}</Text>
        </View>
      )}
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#222] flex-1 text-center">
          Workout Session
        </Text>
        {/* Total Duration on right (live clock) */}
        <View style={{ flexDirection: "row", alignItems: "center", minWidth: 80, justifyContent: "flex-end" }}>
          <MaterialCommunityIcons name="timer-outline" size={20} color="#6366f1" style={{ marginRight: 3 }} />
          <Text style={{ color: "#6366f1", fontWeight: "bold", fontSize: 15 }}>
            {formatTime(totalSeconds)}
          </Text>
        </View>
      </View>
      <ScrollView className="flex-1 p-2" contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* Exercise Card */}
        <View className="bg-white rounded-2xl p-2 mb-4 shadow-lg">
          <View className="relative">
            <Image
              source={{ uri: exercise.image }}
              className="w-full h-48 rounded-xl mb-1"
              resizeMode="cover"
            />
            <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent rounded-b-xl"/>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">{exercise.name}</Text>
          <View className="flex-row justify-between bg-gray-50 rounded-xl p-2 mb-2">
            <View className="items-center flex-1 border-r border-gray-200">
              <MaterialCommunityIcons name="repeat" size={24} color="#2563eb" />
              <Text className="text-sm text-gray-600 mt-1">Sets</Text>
              <Text className="text-sm font-bold text-blue-700">{totalSets}</Text>
            </View>
            <View className="items-center flex-1 border-r border-gray-200">
              <MaterialCommunityIcons name="numeric" size={24} color="#16a34a" />
              <Text className="text-sm text-gray-600 mt-1">Reps</Text>
              <Text className="text-sm font-bold text-green-700">{reps}</Text>
            </View>
            <View className="items-center flex-1 border-r border-gray-200">
              <MaterialCommunityIcons name="clock-outline" size={24} color="#eab308" />
              <Text className="text-sm text-gray-600 mt-1">Rest</Text>
              <Text className="text-sm font-bold text-yellow-700">{rest}</Text>
            </View>
            <View className="items-center flex-1">
              <MaterialCommunityIcons name="timer" size={24} color="#0891b2" />
              <Text className="text-sm text-gray-600 mt-1">Duration</Text>
              <Text className="text-sm font-bold text-cyan-700">{duration}s</Text>
            </View>
          </View>
          {/* Analysis Section */}
          {setTimes.length === totalSets && (
            <View className="mb-4 px-4 py-5 bg-white rounded-2xl border border-green-200 shadow-md">
              {(() => {
                const analysis = getAnalysis();
                if (!analysis) return null;
                return (
                  <View>
                    <View className="flex-row items-center justify-center mb-2">
                      <MaterialCommunityIcons name="chart-bar" size={22} color="#22c55e" />
                      <Text className="ml-2 text-green-700 font-bold text-lg tracking-wide">
                        Workout Analysis
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1 items-center">
                        <Text className="text-xs text-gray-500">Standard Time</Text>
                        <Text className="text-green-700 font-bold text-lg">{analysis.standardTotalTime}s</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className="text-xs text-gray-500">Your Time</Text>
                        <Text className="text-blue-700 font-bold text-lg">{analysis.userTotal}s</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className="text-xs text-gray-500">Difference</Text>
                        <Text className={`font-bold text-lg ${analysis.faster ? "text-green-600" : "text-red-600"}`}>
                          {analysis.diff}s
                        </Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className={`text-center font-semibold ${analysis.faster ? "text-green-700" : "text-red-600"}`}>
                        {analysis.faster
                          ? `🚀 Excellent! You finished ${analysis.diff}s faster than standard.`
                          : `⏱️ Keep going! You took ${analysis.diff}s longer than standard.`}
                      </Text>
                    </View>
                    <View className="mt-2">
                      <Text className="text-xs text-gray-500 text-center mb-1">Per Set Breakdown</Text>
                      <View className="flex-row flex-wrap justify-center">
                        {analysis.setTimes.map((t, i) => (
                          <View
                            key={i}
                            className="mx-1 my-1 px-2 py-1 rounded-lg"
                            style={{
                              backgroundColor: t <= STANDARD_SET_TIME ? "#bbf7d0" : "#fee2e2",
                            }}
                          >
                            <Text className={`text-xs font-semibold ${t <= STANDARD_SET_TIME ? "text-green-800" : "text-red-700"}`}>
                              Set {i + 1}: {t}s
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
          {/* Professional Note and Start Workout Button */}
          {setTimes.length !== totalSets && (
            <>
              <View className="mb-3 px-2 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <Text className="text-indigo-700 text-base font-medium text-center">
                  Start workout to analyze your progress and track each set in real time.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="mt-2 bg-indigo-600 rounded-xl py-4 items-center"
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-lg tracking-wide">Start Workout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {/* Remove Set Progress from here */}
      </ScrollView>
      {/* Modal for Set Progress */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.97)",
              borderRadius: 32,
              paddingVertical: 24,
              paddingHorizontal: 10,
              alignItems: "center",
              shadowColor: "#6366f1",
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 8,
              borderWidth: 1,
              borderColor: "#e0e7eb",
              minWidth: 340,
              minHeight: 360,
              maxWidth: 380,
            }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 20,
                zIndex: 10,
                backgroundColor: "#f1f5f9",
                borderRadius: 20,
                padding: 6,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={28} color="#6366f1" />
            </TouchableOpacity>
            {/* Premium Circular Progress */}
            <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 10, marginTop: 18 }}>
              <View style={{ position: "relative", width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
                {/* Outer Gradient Circle */}
                <View
                  className="absolute"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    borderWidth: 12,
                    borderColor: "#e0e7ef",
                    borderStyle: "solid",
                    borderTopColor: "#6366f1",
                    borderRightColor: "#3b82f6",
                    borderBottomColor: "#06b6d4",
                    borderLeftColor: "#e0e7ef",
                    transform: [{ rotate: `${(360 * (currentSet - 1) / totalSets) - 90}deg` }],
                    zIndex: 1,
                    shadowColor: "#6366f1",
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    elevation: 4,
                  }}
                />
                {/* Time Progress Arc */}
                <View
                  className="absolute"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    borderWidth: 12,
                    borderColor: "transparent",
                    borderTopColor: "#22d3ee",
                    transform: [
                      { rotate: `${((360 / totalSets) * (currentSet - 1)) - 90}deg` },
                      { rotateZ: `${(360 * (duration - timer) / duration) / totalSets}deg` }
                    ],
                    zIndex: 2,
                    opacity: timer < duration ? 1 : 0.15,
                  }}
                />
                {/* Inner Glass Circle */}
                <View
                  className="items-center justify-center"
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    backgroundColor: "rgba(255,255,255,0.7)",
                    zIndex: 3,
                    borderWidth: 2,
                    borderColor: "#f1f5f9",
                    shadowColor: "#6366f1",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text style={{
                    fontSize: 54,
                    fontWeight: "bold",
                    color: "#6366f1",
                    textShadowColor: "#a5b4fc",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                  }}>{timer}</Text>
                  <Text style={{ fontSize: 16, color: "#a1a1aa", marginTop: -4, fontWeight: "600" }}>sec</Text>
                  <Text style={{
                    fontSize: 19,
                    color: "#6366f1",
                    fontWeight: "700",
                    marginTop: 2,
                    letterSpacing: 0.5,
                    textShadowColor: "#e0e7ef",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}>
                    Set {currentSet} / {totalSets}
                  </Text>
                </View>
                {/* Glowing Set Dots */}
                {Array.from({ length: totalSets }).map((_, idx) => {
                  const angle = (2 * Math.PI * idx) / totalSets - Math.PI / 2;
                  const r = 90;
                  const x = r * Math.cos(angle) + 100 - 10;
                  const y = r * Math.sin(angle) + 100 - 10;
                  const isActive = idx + 1 === currentSet;
                  const isDone = completedSets.includes(idx + 1);
                  return (
                    <View
                      key={idx}
                      style={{
                        position: "absolute",
                        left: x,
                        top: y,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: isDone
                          ? "#22d3ee"
                          : isActive
                          ? "#6366f1"
                          : "#e0e7ef",
                        borderWidth: isActive ? 3 : 0,
                        borderColor: "#6366f1",
                        shadowColor: isActive ? "#6366f1" : isDone ? "#22d3ee" : undefined,
                        shadowOpacity: isActive || isDone ? 0.5 : 0,
                        shadowRadius: isActive ? 8 : isDone ? 5 : 0,
                        elevation: isActive || isDone ? 4 : 0,
                        zIndex: 4,
                      }}
                    />
                  );
                })}
              </View>
            </View>
            {/* Timer Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
              {/* Show Start Set if not running and timer is at duration or timer is 0 */}
              {!isRunning && (timer === duration || timer === 0) && (
                <TouchableOpacity
                  onPress={handleStartSet}
                  style={{
                    backgroundColor: "#6366f1",
                    paddingHorizontal: 40,
                    paddingVertical: 16,
                    borderRadius: 18,
                    shadowColor: "#6366f1",
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 20,
                    letterSpacing: 0.5,
                    textShadowColor: "#3b82f6",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}>
                    Start Set
                  </Text>
                </TouchableOpacity>
              )}
              {isRunning && (
                <TouchableOpacity
                  onPress={() => {
                    const nextCompletedSets = [...completedSets, currentSet];
                    setIsRunning(false);
                    setCompletedSets(nextCompletedSets);
                    setTimer(duration);

                    // Record set time
                    if (setStartTime) {
                      const timeTaken = Math.round((Date.now() - setStartTime) / 1000);
                      setSetTimes([...setTimes, timeTaken]);
                    }

                    if (currentSet < totalSets) {
                      setCurrentSet(currentSet + 1);
                      setSetStartTime(Date.now());
                    } else {
                      setModalVisible(false);
                      setSetStartTime(null);
                    }
                  }}
                  style={{
                    backgroundColor: "#22d3ee",
                    paddingHorizontal: 40,
                    paddingVertical: 16,
                    borderRadius: 18,
                    marginLeft: 10,
                    shadowColor: "#22d3ee",
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 20, letterSpacing: 0.5 }}>
                    Complete Set
                  </Text>
                </TouchableOpacity>
              )}
              {!isRunning && timer < duration && timer > 0 && (
                <TouchableOpacity
                  onPress={() => setIsRunning(true)}
                  style={{
                    backgroundColor: "#6366f1",
                    paddingHorizontal: 40,
                    paddingVertical: 16,
                    borderRadius: 18,
                    marginLeft: 10,
                    shadowColor: "#6366f1",
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 20, letterSpacing: 0.5 }}>
                    Resume
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
      {/* Fixed Finish Workout Button */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderTopWidth: 1,
          borderColor: "#e5e7eb",
          shadowColor: "#6366f1",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          onPress={handleFinishWorkout}
          style={{
            backgroundColor: "#6366f1",
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#6366f1",
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={28} color="#fff" style={{ marginRight: 12 }} />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 20, letterSpacing: 0.5 }}>Finish Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};



export default WorkoutSession;

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGlobalContext } from '../../../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://trackeatfit.onrender.com";

// Constants for AsyncStorage keys
const STORAGE_KEY_PREFIX = '@workout_session:';

export default function StartSession() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id;
  const { programId } = route.params || {};

  const [program, setProgram] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logging, setLogging] = useState(false);
  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [adjustmentSuggestion, setAdjustmentSuggestion] = useState('same');
  const [sessionNotes, setSessionNotes] = useState('');
  // For completedExercises input
  const [exerciseInputs, setExerciseInputs] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  // Add new state for showing exercise list
  const [showExerciseList, setShowExerciseList] = useState(true);
  const [currentSet, setCurrentSet] = useState(0);
  const [isSetActive, setIsSetActive] = useState(false);
  const [setTimer, setSetTimer] = useState(0);
  const [repTimer, setRepTimer] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [tempoPhase, setTempoPhase] = useState(0); // 0: down, 1: pause1, 2: up, 3: pause2
  const [sessionDuration, setSessionDuration] = useState(0); // Track duration in seconds
  const [showingNextExercise, setShowingNextExercise] = useState(false); // Rename to be more clear
  const [exerciseSetsCompleted, setExerciseSetsCompleted] = useState(false);
  const [showExerciseSummary, setShowExerciseSummary] = useState(false); // New state for exercise summary modal

  // Fetch program details and user progress
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!programId || !userId) {
          setError('Missing program or user ID');
          setLoading(false);
          return;
        }
        // Fetch program details
        const progRes = await fetch(`${API_URL}/api/v3/programs/${programId}`);
        const progJson = await progRes.json();
        if (!progJson.success) throw new Error('Failed to fetch program');
        setProgram(progJson.data);
        // Fetch user progress
        const progRes2 = await fetch(`${API_URL}/api/v3/user-program-progress/progress/${userId}/${programId}`);
        const progJson2 = await progRes2.json();
        if (!progJson2.success) throw new Error('Failed to fetch progress');
        setProgress(progJson2.data);
      } catch (e) {
        setError(e.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [programId, userId]);

  // When session changes, initialize exerciseInputs
  useEffect(() => {
    const session = getSessionData();
    if (session && session.exercises) {
      setExerciseInputs(
        session.exercises.map(ex => ({
          exerciseId: ex.id || ex.exerciseId || '',
          exerciseName: ex.name || '',
          setsCompleted: ex.sets ? String(ex.sets) : '',
          repsCompleted: ex.reps ? String(ex.reps) : '',
          notes: ex.notes || '',
          skipped: false,
        }))
      );
    } else {
      setExerciseInputs([]);
    }
    // eslint-disable-next-line
  }, [program, progress]);

  // Find the next session index
  const getNextSessionIndex = () => {
    if (!progress || !progress.sessionLogs) return 0;
    return progress.sessionLogs.length;
  };

  // Get session data for the next session
  const getSessionData = () => {
    if (!program || !program.schedule) return null;
    const idx = getNextSessionIndex();
    
    // Check if there are completed sessions
    if (progress?.sessionLogs?.length > 0) {
      const lastSession = progress.sessionLogs[progress.sessionLogs.length - 1];
      const lastSessionDate = new Date(lastSession.date);
      const today = new Date();
      
      // If the last session was completed today, don't allow access to next session
      if (lastSessionDate.toDateString() === today.toDateString()) {
        setError('You have already completed today\'s session. Please wait until tomorrow to start the next session.');
        return null;
      }
    }
    
    return program.schedule[idx] || null;
  };

  // Show feedback modal before logging session
  const handleCompleteSession = () => {
    setShowExerciseSummary(true); // Show exercise summary first
  };

  // Actually log the session after feedback
  // Allow user to review and edit exercise completion fields (pre-filled with API data)
  const handleExerciseInputChange = (idx, field, value) => {
    setExerciseInputs(inputs =>
      inputs.map((item, i) =>
        i === idx ? { ...item, [field]: field === 'skipped' ? value : value } : item
      )
    );
  };

  // Add this function to post to /api/v3/workouts/
  const submitWorkoutSessionToBackend = async (sessionData) => {
    try {
      // Build exercises array for backend schema
      const exercises = (sessionData.completedExercises || []).map((ex, idx) => {
        // Find the original exercise definition to get caloriesBurnedPerSet
        const sessionObj = getSessionData();
        const exercise = sessionObj && sessionObj.exercises
          ? sessionObj.exercises.find(e =>
              (e.id || e.exerciseId) === ex.exerciseId ||
              (e.name || '') === (ex.exerciseName || '')
            )
          : null;
        // Use 'calories' from program API as caloriesBurnedPerSet
        const caloriesBurnedPerSet = exercise?.calories
          ? Number(exercise.calories)
          : 0;
        // Calculate completed sets (if setsCompleted is a number/string)
        // For skipped exercises, still use planned sets if setsCompleted is "0" or empty
        let setsNum = parseInt(ex.setsCompleted, 10);
        if ((isNaN(setsNum) || setsNum <= 0) && exercise?.sets) {
          // Use planned sets from program definition if skipped or not filled
          setsNum = parseInt(exercise.sets, 10);
        }
        const completedSets = !isNaN(setsNum) && setsNum > 0 ? setsNum : 0;
        // Calculate totalCaloriesBurned for this exercise (even if skipped)
        const totalCaloriesBurned = caloriesBurnedPerSet * completedSets;

        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          setsCompleted: ex.setsCompleted,
          repsCompleted: ex.repsCompleted,
          weightUsed: ex.weightUsed || '',
          notes: ex.notes || '',
          skipped: ex.skipped || false,
          performanceMetrics: {
            caloriesBurned: totalCaloriesBurned
          }
        };
      });

      // Calculate totalCaloriesBurned for the session
      let totalCaloriesBurned = exercises.reduce((sum, ex) => {
        if (ex.performanceMetrics && typeof ex.performanceMetrics.caloriesBurned === 'number') {
          return sum + ex.performanceMetrics.caloriesBurned;
        }
        return sum;
      }, 0);

      // If not available in performanceMetrics, fallback to sessionData.totalCaloriesBurned if present
      if (!totalCaloriesBurned && sessionData.totalCaloriesBurned) {
        totalCaloriesBurned = sessionData.totalCaloriesBurned;
      }

      // Build payload for WorkoutSession model
      const payload = {
        userId,
        programId,
        programName: program?.name || '', // <-- Add program name here
        day: sessionData.day,
        sessionDate: new Date().toISOString(),
        title: session?.title || '',
        description: session?.description || '',
        exercises,
        status: 'completed',
        durationInMinutes: sessionData.durationInMinutes,
        rating: sessionData.rating,
        energyLevel: sessionData.energyLevel,
        difficultyRating: sessionData.difficultyRating,
        adjustmentSuggestion: sessionData.adjustmentSuggestion,
        notes: sessionData.notes,
        isRecoveryDay: sessionData.isRecoveryDay,
        isMissed: sessionData.isMissed,
        isRestDay: sessionData.isRestDay,
        totalCaloriesBurned,
        // Optionally add feedback, etc.
      };

      // POST to backend
      const res = await fetch(`${API_URL}/api/v3/workouts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to save workout session');
      }
      return await res.json();
    } catch (err) {
      console.error('Error posting workout session:', err);
    }
  };

  const submitSessionLog = async () => {
    const sessionIdx = getNextSessionIndex();
    const session = getSessionData();
    if (!session) {
      setLogging(false);
      return;
      Alert.alert('No more sessions', 'You have completed all sessions in this program.');
      setShowFeedback(false);
      return;
    }
    setLogging(true);
    try {
      // Calculate if any sessions were missed
      const now = new Date();
      const startDate = new Date(progress.startedAt);
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      // Current session data
      const sessionData = {
        day: session.day,
        date: new Date(),
        completedExercises: exerciseInputs,
        rating,
        energyLevel,
        difficultyRating,
        adjustmentSuggestion,
        notes: sessionNotes,
        durationInMinutes: Math.round(sessionDuration / 60),
        isRecoveryDay: false,
        isMissed: false,
        isRestDay: false
      };

      // POST to user-program-progress (existing)
      const response = await fetch(`${API_URL}/api/v3/user-program-progress/progress/${userId}/${programId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to log session');
      }

      // POST to workout_sessions (new, for analytics)
      await submitWorkoutSessionToBackend(sessionData);

      const result = await response.json();
      
      // Clear saved progress after successful submission
      await clearSavedProgress();
      
      // Show success message
      navigation.navigate('screens/Programs/ActiveProgram', {
        id: programId,
        showSuccessMessage: true,
        sessionCompleted: true
      });
    } catch (e) {
      console.error('Error logging session:', e);
      Alert.alert(
        'Error',
        'Failed to log session. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLogging(false);
      setShowFeedback(false);
    }
  };

  // Get current exercise data
  const getCurrentExercise = () => {
    const session = getSessionData();
    if (!session || currentExerciseIndex < 0) {
      return null;
    }
    return session.exercises[currentExerciseIndex];
  };

  // Start set timer with modified logic
  const startSetTimer = () => {
    const exercise = getCurrentExercise();
    if (!exercise) return;

    // Reset the timer state
    setIsSetActive(true);
    setTimerActive(true);
    setCurrentRep(0);
    setTempoPhase(0);
    
    // Parse tempo safely with fallback values
    const tempo = (exercise.tempo || '2-0-2-0').split('-')
      .map(t => {
        const parsed = parseInt(t);
        return isNaN(parsed) ? 2 : parsed;
      });
    
    // Ensure we have a valid initial timer value
    const initialTime = tempo[0] || 2;
    console.log('Starting timer with:', { tempo, initialTime });
    setRepTimer(initialTime);
  };

  // Timer logic
  useEffect(() => {
    let interval;
    if (timerActive) {
      const exercise = getCurrentExercise();
      
      interval = setInterval(() => {
        if (isResting) {
          setTimeLeft(time => {
            if (time <= 1) {
              setIsResting(false);
              setTimerActive(false);
              // If showing next exercise preview, proceed to next exercise
              if (showingNextExercise) {
                startNextExercise();
              }
              return 0;
            }
            return time - 1;
          });
        } else if (isSetActive && exercise) {
          setRepTimer(time => {
            // Ensure time is a number
            const currentTime = isNaN(time) ? 0 : time;
            
            if (currentTime <= 1) {
              const tempo = (exercise.tempo || '2-0-2-0').split('-')
                .map(t => {
                  const parsed = parseInt(t);
                  return isNaN(parsed) ? 2 : parsed;
                });

              setTempoPhase(phase => {
                const nextPhase = (phase + 1) % 4;
                if (nextPhase === 0) {
                  setCurrentRep(rep => {
                    const nextRep = rep + 1;
                    if (nextRep >= (exercise.reps || 10)) {
                      setTimerActive(false);
                      setIsSetActive(false);
                      handleSetComplete();
                    }
                    return nextRep;
                  });
                }
                return nextPhase;
              });
              
              return tempo[tempoPhase] || 2;
            }
            return currentTime - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isSetActive, isResting, showingNextExercise, currentRep, tempoPhase, currentExerciseIndex]);

  const startExercise = () => {
    if (currentExerciseIndex === -1) {
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      startSetTimer();
    }
  };

  // Update handleSetComplete function
  const handleSetComplete = () => {
    const exercise = getCurrentExercise();
    if (!exercise) return;

    setIsSetActive(false);
    setTimerActive(false);
    setCurrentRep(0);
    setTempoPhase(0);

    if (currentSet < exercise.sets) {
      setIsResting(true);
      setTimeLeft(parseInt(exercise.rest) || 60);
      setTimerActive(true);
      setCurrentSet(prev => prev + 1);
    } else {
      setCurrentSet(exercise.sets); // Keep at max sets
      setExerciseSetsCompleted(true); // Mark sets as completed
    }
  };

  // Update handleExerciseComplete function
  const handleExerciseComplete = () => {
    const session = getSessionData();
    if (!session) return;

    if (currentExerciseIndex < session.exercises.length - 1) {
      setShowingNextExercise(true);
      setIsResting(true);
      setTimeLeft(60); // Default NextExercise(60 seconds rest)
      setTimerActive(true);
    } else {
      handleCompleteSession();
    }
  };

  // Add this function to handle starting the next exercise
  const startNextExercise = () => {
    setCurrentExerciseIndex(prev => prev + 1);
    setCurrentSet(1);
    setIsSetActive(false);
    setTimerActive(false);
    setCurrentRep(0);
    setTempoPhase(0);
    setShowingNextExercise(false);
    setIsResting(false);
    setExerciseSetsCompleted(false);
  };

  const getTempoPhaseText = () => {
    const phases = ['DOWN', 'HOLD', 'UP', 'REST'];
    return phases[tempoPhase];
  };

  // Add session duration timer effect
  useEffect(() => {
    let durationTimer;
    if (!showExerciseList && !showFeedback) {
      durationTimer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(durationTimer);
  }, [showExerciseList, showFeedback]);

  // Helper function to format duration in mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add new function after getSessionData
  const handleSkipExercise = (index) => {
    const session = getSessionData();
    if (!session) return;

    // Always mark exercise as skipped in exerciseInputs
    setExerciseInputs(inputs =>
      inputs.map((item, i) =>
        i === index ? { ...item, skipped: true, setsCompleted: '0', repsCompleted: '0' } : item
      )
    );
    
    // If there are more exercises
    if (index < session.exercises.length - 1) {
      // If we're skipping from first exercise preview
      if (currentExerciseIndex === -1) {
        setCurrentExerciseIndex(0); // Set to first exercise index
      } else {
        setCurrentExerciseIndex(index);
      }
      setShowingNextExercise(true);
      setIsResting(true);
      setTimeLeft(10); // 10 seconds rest
      setTimerActive(true);
      setIsSetActive(false);
    } else {
      // If this was the last exercise
      handleCompleteSession();
    }
  };

  // Load saved progress when component mounts
  useEffect(() => {
    async function loadSavedProgress() {
      try {
        const key = `${STORAGE_KEY_PREFIX}${userId}_${programId}`;
        const savedProgress = await AsyncStorage.getItem(key);
        
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          // Only restore if the saved progress is less than 24 hours old
          const lastUpdated = new Date(progress.lastUpdated);
          const now = new Date();
          const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            // First set the basic state
            setCurrentExerciseIndex(progress.currentExerciseIndex ?? -1);
            setCurrentSet(progress.currentSet ?? 0);
            setExerciseInputs(progress.exerciseInputs ?? []);
            setSessionDuration(progress.sessionDuration ?? 0);
            setExerciseSetsCompleted(progress.exerciseSetsCompleted ?? false);
            setShowExerciseList(progress.showExerciseList ?? true);
            setCurrentRep(progress.currentRep ?? 0);
            setTempoPhase(progress.tempoPhase ?? 0);

            // If we were in the middle of an exercise
            if (progress.currentExerciseIndex >= 0) {
              setShowExerciseList(false);
              
              // Handle rest state restoration
              if (progress.isResting) {
                setIsResting(true);
                setTimeLeft(progress.timeLeft ?? 0);
                if (progress.timeLeft > 0) {
                  setTimerActive(true);
                }
              } 
              // Handle active set restoration
              else if (progress.isSetActive) {
                const exercise = getCurrentExercise();
                if (exercise) {
                  setIsSetActive(true);
                  // Parse tempo for the current exercise
                  const tempo = (exercise.tempo || '2-0-2-0').split('-')
                    .map(t => {
                      const parsed = parseInt(t);
                      return isNaN(parsed) ? 2 : parsed;
                    });
                  
                  // Calculate the correct timer value based on tempo phase
                  const phase = progress.tempoPhase ?? 0;
                  setRepTimer(tempo[phase] || 2);
                  setTimerActive(true);
                }
              }
            }
          } else {
            // Clear old progress
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
    
    loadSavedProgress();
  }, [userId, programId]);

  // Save progress when it changes
  useEffect(() => {
    async function saveProgress() {
      try {
        const key = `${STORAGE_KEY_PREFIX}${userId}_${programId}`;
        const progressData = {
          currentExerciseIndex,
          currentSet,
          exerciseInputs,
          sessionDuration,
          exerciseSetsCompleted,
          isSetActive,
          repTimer,
          currentRep,
          tempoPhase,
          isResting,
          timeLeft,
          timerActive,
          showExerciseList,
          lastUpdated: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(key, JSON.stringify(progressData));
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
    
    if (userId && programId) {
      saveProgress();
    }
  }, [
    userId, 
    programId, 
    currentExerciseIndex, 
    currentSet, 
    exerciseInputs, 
    sessionDuration, 
    exerciseSetsCompleted,
    isSetActive,
    repTimer,
    currentRep,
    tempoPhase,
    isResting,
    timeLeft,
    timerActive,
    showExerciseList
  ]);

  // Clear saved progress after successful completion
  const clearSavedProgress = async () => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${userId}_${programId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing saved progress:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-400 mt-2">Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" style={{ marginBottom: 8 }} />
          <Text className="text-red-500 text-center text-base font-semibold">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const session = getSessionData();
  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="checkmark-done-circle-outline" size={48} color="#22c55e" style={{ marginBottom: 8 }} />
          <Text className="text-green-600 text-center text-base font-semibold">All sessions completed!</Text>
          <TouchableOpacity className="mt-4 px-6 py-2 bg-blue-600 rounded-full" onPress={() => navigation.goBack()}>
            <Text className="text-white font-semibold text-base">Back to Program</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Replace the return statement for active session with this new UI
  if (session) {
    const currentExercise = currentExerciseIndex >= 0 ? session.exercises[currentExerciseIndex] : null;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3.5 bg-white/90 border-b border-slate-100 shadow-sm z-20">
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className="p-2 -ml-1 rounded-full active:bg-slate-100"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#334155" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900 tracking-tight">
              Session {getNextSessionIndex() + 1}
            </Text>
          </View>
          
          {!showExerciseList && (
            <View className="flex-row items-center px-3 py-1.5 bg-slate-100/80 rounded-full">
              <Ionicons name="time-outline" size={18} color="#475569" style={{ marginRight: 4 }} />
              <Text className="text-base font-medium text-slate-700">
                {formatDuration(sessionDuration)}
              </Text>
            </View>
          )}
        </View>

        <ScrollView className="flex-1">
          <View className="p-5">
            {showExerciseList ? (
              <>
                <Text className="text-2xl font-bold text-slate-900 mb-4">{session.title || `Session ${getNextSessionIndex() + 1}`}</Text>
                <Text className="text-lg font-semibold text-slate-700 mb-3">Exercise List:</Text>
                {session.exercises.map((ex, idx) => (
                  <View key={idx} className="bg-white p-4 rounded-xl mb-4 border border-slate-100 shadow-sm">
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                        <Text className="text-blue-600 font-bold">{idx + 1}</Text>
                      </View>
                      <Text className="text-lg font-bold text-slate-900 flex-1">{ex.name}</Text>
                    </View>
                    
                    <View className="space-y-2 ml-13">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="dumbbell" size={20} color="#64748b" />
                        <Text className="text-base text-slate-700 ml-2">
                          {ex.sets} sets × {ex.reps} reps 
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="timer-outline" size={20} color="#64748b" />
                        <Text className="text-base text-slate-700 ml-2">
                          Rest: {ex.rest || 60}s
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#64748b" />
                        <Text className="text-base text-slate-700 ml-2">
                          Tempo: {ex.tempo || '2-0-2-0'}
                          <Text className="text-sm text-slate-500"> (down-pause-up-pause)</Text>
                        </Text>
                      </View>

                      {ex.notes && (
                        <View className="flex-row items-center">
                          <Ionicons name="information-circle-outline" size={20} color="#64748b" />
                          <Text className="text-sm text-slate-600 ml-2 flex-1">{ex.notes}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  className="mt-4 px-6 py-3 bg-blue-600 rounded-full"
                  onPress={() => setShowExerciseList(false)}
                >
                  <Text className="text-white font-semibold text-base text-center">Start Session</Text>
                </TouchableOpacity>
              </>
            ) : currentExerciseIndex === -1 ? (
              <>
                <Text className="text-2xl font-bold text-slate-900 mb-4">{session.title || `Session ${getNextSessionIndex() + 1}`}</Text>
                <View className="bg-white p-6 rounded-xl mb-4 border border-blue-100 shadow-sm">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                        <MaterialCommunityIcons name="dumbbell" size={24} color="#2563eb" />
                      </View>
                      <View>
                        <Text className="text-lg font-semibold text-blue-600 mb-1">First Exercise</Text>
                        <Text className="text-xl font-bold text-slate-900">{session.exercises[0].name}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleSkipExercise(0)}
                      className="px-3 py-1.5 bg-red-50 rounded-full"
                    >
                      <Text className="text-red-600 font-medium">Skip</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View className="space-y-3 border-t border-slate-100 pt-4">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="target" size={20} color="#64748b" />
                      <Text className="text-base text-slate-700 ml-2">
                        {session.exercises[0].sets} sets × {session.exercises[0].reps} reps
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Ionicons name="timer-outline" size={20} color="#64748b" />
                      <Text className="text-base text-slate-700 ml-2">
                        Rest: {session.exercises[0].rest || 60}s
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#64748b" />
                      <Text className="text-base text-slate-700 ml-2">
                        Tempo: {session.exercises[0].tempo || '2-0-2-0'}
                        <Text className="text-sm text-slate-500"> (down-pause-up-pause)</Text>
                      </Text>
                    </View>

                    {session.exercises[0].notes && (
                      <View className="flex-row items-start mt-2">
                        <Ionicons name="information-circle-outline" size={20} color="#64748b" style={{ marginTop: 2 }} />
                        <Text className="text-sm text-slate-600 ml-2 flex-1">{session.exercises[0].notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity
                  className="mt-6 px-6 py-4 bg-blue-600 rounded-xl shadow-sm active:bg-blue-700"
                  onPress={startExercise}
                >
                  <Text className="text-white font-semibold text-base text-center">Start First Exercise</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center w-full">
                {!showingNextExercise ? (
                  <>
                    <Text className="text-2xl font-bold text-slate-900 mb-4">
                      {currentExercise.name}
                    </Text>
                    
                    <View className="w-full bg-white p-6 rounded-xl border border-blue-100 shadow-sm mb-4">
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-semibold text-blue-600">Set {currentSet} of {currentExercise.sets}</Text>
                        {!isSetActive && !isResting && (
                          <TouchableOpacity
                            onPress={() => handleSkipExercise(currentExerciseIndex)}
                            className="px-3 py-1.5 bg-red-50 rounded-full"
                          >
                            <Text className="text-red-600 font-medium">Skip</Text>
                          </TouchableOpacity>
                        )}
                        {isSetActive ? (
                          <View className="items-center">
                            <Text className="text-4xl font-bold text-slate-900">{repTimer}s</Text>
                            <Text className="text-xl text-blue-600 mt-2">{getTempoPhaseText()}</Text>
                            <Text className="text-base text-slate-600 mt-1">
                              Rep {currentRep + 1} of {currentExercise.reps}
                            </Text>
                          </View>
                        ) : isResting ? (
                          <Text className="text-2xl font-bold text-green-600">{timeLeft}s rest</Text>
                        ) : null}
                      </View>

                      <View className="space-y-3 border-t border-slate-100 pt-4">
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="target" size={20} color="#64748b" />
                          <Text className="text-base text-slate-700 ml-2">
                            {currentExercise.sets} sets × {currentExercise.reps} reps 
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Ionicons name="timer-outline" size={20} color="#64748b" />
                          <Text className="text-base text-slate-700 ml-2">
                            Rest: {currentExercise.rest || 60}s
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#64748b" />
                          <Text className="text-base text-slate-700 ml-2">
                            Tempo: {currentExercise.tempo || '2-0-2-0'}
                            <Text className="text-sm text-slate-500"> (down-pause-up-pause)</Text>
                          </Text>
                        </View>

                        {currentExercise.notes && (
                          <View className="flex-row items-start mt-2">
                            <Ionicons name="information-circle-outline" size={20} color="#64748b" style={{ marginTop: 2 }} />
                            <Text className="text-sm text-slate-600 ml-2 flex-1">{currentExercise.notes}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {!isSetActive && !isResting && exerciseSetsCompleted ? (
                      <TouchableOpacity
                        className="mt-2 px-6 py-3 bg-blue-600 rounded-full"
                        onPress={handleExerciseComplete}
                      >
                        <Text className="text-white font-semibold text-base">
                          Exercise Completed
                        </Text>
                      </TouchableOpacity>
                    ) : !isSetActive && !isResting ? (
                      <TouchableOpacity
                        className="mt-2 px-6 py-3 bg-green-600 rounded-full"
                        onPress={startSetTimer}
                      >
                        <Text className="text-white font-semibold text-base">
                          Start Set {currentSet}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : (
                  <View className="w-full">
                    <View className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm w-full">
                      <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                            <MaterialCommunityIcons name="dumbbell" size={24} color="#2563eb" />
                          </View>
                          <View>
                            <Text className="text-lg font-semibold text-blue-600 mb-1">Next Exercise</Text>
                            <Text className="text-xl font-bold text-slate-900">
                              {session.exercises[currentExerciseIndex + 1].name}
                            </Text>
                          </View>
                        </View>
                        {!isResting && (
                          <TouchableOpacity
                            onPress={() => handleSkipExercise(currentExerciseIndex + 1)}
                            className="px-3 py-1.5 bg-red-50 rounded-full"
                          >
                            <Text className="text-red-600 font-medium">Skip</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {isResting ? (
                        <View className="items-center py-4 border-t border-slate-100">
                          <Text className="text-lg font-semibold text-blue-600 mb-2">Rest Period</Text>
                          <Text className="text-3xl font-bold text-green-600">{timeLeft}s</Text>
                        </View>
                      ) : (
                        <View className="space-y-3 border-t border-slate-100 pt-4">
                          <View className="flex-row items-center">
                            <MaterialCommunityIcons name="target" size={20} color="#64748b" />
                            <Text className="text-base text-slate-700 ml-2">
                              {session.exercises[currentExerciseIndex + 1].sets} sets × {session.exercises[currentExerciseIndex + 1].reps} reps
                            </Text>
                          </View>
                          
                          <View className="flex-row items-center">
                            <Ionicons name="timer-outline" size={20} color="#64748b" />
                            <Text className="text-base text-slate-700 ml-2">
                              Rest: {session.exercises[currentExerciseIndex + 1].rest || 60}s
                            </Text>
                          </View>

                          <View className="flex-row items-center">
                            <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#64748b" />
                            <Text className="text-base text-slate-700 ml-2">
                              Tempo: {session.exercises[currentExerciseIndex + 1].tempo || '2-0-2-0'}
                              <Text className="text-sm text-slate-500"> (down-pause-up-pause)</Text>
                            </Text>
                          </View>

                          {session.exercises[currentExerciseIndex + 1].notes && (
                            <View className="flex-row items-start mt-2">
                              <Ionicons name="information-circle-outline" size={20} color="#64748b" style={{ marginTop: 2 }} />
                              <Text className="text-sm text-slate-600 ml-2 flex-1">
                                {session.exercises[currentExerciseIndex + 1].notes}
                              </Text>
                            </View>
                          )}
                          
                          <TouchableOpacity
                            className="mt-4 px-6 py-3 bg-blue-600 rounded-full"
                            onPress={startNextExercise}
                          >
                            <Text className="text-white font-semibold text-base text-center">
                              Start Exercise
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <Text className="mt-8 text-slate-500">
                  Exercise {currentExerciseIndex + 1} of {session.exercises.length}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Exercise Summary Modal */}
        <Modal
          visible={showExerciseSummary}
          transparent
          animationType="slide"
          onRequestClose={() => setShowExerciseSummary(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[90%]">
              <View className="p-4 border-b border-slate-100 flex-row justify-between items-center">
                <Text className="text-xl font-bold text-slate-900">Exercise Summary</Text>
                <TouchableOpacity
                  onPress={() => setShowExerciseSummary(false)}
                  className="p-2 -mr-2 rounded-full active:bg-slate-100"
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView className="px-4">
                <View className="py-4">
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-slate-900 mb-3">Completed Exercises</Text>
                    {exerciseInputs.map((ex, idx) => (
                      <View key={idx} className="bg-slate-50 rounded-xl p-4 mb-3">
                        <Text className="font-bold text-slate-900 mb-2">{ex.exerciseName}</Text>
                        <View className="flex-row items-center mb-2">
                          <Text className="text-slate-600 w-24">Sets Done:</Text>
                          <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <TextInput
                              value={ex.setsCompleted}
                              onChangeText={v => handleExerciseInputChange(idx, 'setsCompleted', v)}
                              keyboardType="numeric"
                              className="flex-1 px-4 py-3 text-base text-slate-900"
                              placeholderTextColor="#94a3b8"
                              placeholder="0"
                            />
                            <View className="px-3 py-2 bg-slate-50 border-l border-slate-200">
                              <Text className="text-sm text-slate-500 font-medium">sets</Text>
                            </View>
                          </View>
                        </View>
                        <View className="flex-row items-center mb-3">
                          <Text className="text-slate-600 w-24">Reps Done:</Text>
                          <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <TextInput
                              value={ex.repsCompleted}
                              onChangeText={v => handleExerciseInputChange(idx, 'repsCompleted', v)}
                              keyboardType="numeric"
                              className="flex-1 px-4 py-3 text-base text-slate-900"
                              placeholderTextColor="#94a3b8"
                              placeholder="0"
                            />
                            <View className="px-3 py-2 bg-slate-50 border-l border-slate-200">
                              <Text className="text-sm text-slate-500 font-medium">reps</Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleExerciseInputChange(idx, 'skipped', !ex.skipped)}
                          className={`flex-row items-center justify-between p-3 rounded-xl ${
                            ex.skipped ? 'bg-red-50' : 'bg-slate-50'
                          }`}
                        >
                          <View className="flex-row items-center">
                            <View className={`w-5 h-5 rounded-md border mr-2 items-center justify-center ${
                              ex.skipped ? 'bg-red-500 border-red-500' : 'border-slate-300'
                            }`}>
                              {ex.skipped && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <Text className={`font-medium ${ex.skipped ? 'text-red-600' : 'text-slate-700'}`}>
                              Skip this exercise
                            </Text>
                          </View>
                          {ex.skipped && (
                            <Text className="text-red-600 text-sm">Exercise skipped</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View className="p-4 border-t border-slate-100">
                <TouchableOpacity
                  className="w-full py-4 bg-blue-600 rounded-xl active:bg-blue-700"
                  onPress={() => setShowFeedback(true)} // Directly show feedback modal
                >
                  <Text className="text-white font-bold text-center">
                    Continue to Feedback
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                  disabled={logging}
                >
                  <Text className="text-white font-bold text-center text-lg">
                    {logging ? 'Saving Feedback...' : 'Submit Feedback'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
}

// Add new rating components near the top of the file
const RatingButton = ({ value, selected, onPress, children }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 py-3 px-4 rounded-xl border ${
      selected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'
    }`}
  >
    <Text className={`text-center font-semibold ${
      selected ? 'text-blue-600' : 'text-slate-600'
    }`}>
      {children}
    </Text>
  </TouchableOpacity>
);

const RatingSection = ({ title, description, value, options, onChange }) => (
  <View className="mb-6">
    <Text className="text-base font-bold text-slate-900 mb-1">{title}</Text>
    <Text className="text-sm text-slate-500 mb-3">{description}</Text>
    <View className="flex-row space-x-2">
      {options.map((opt) => (
        <RatingButton
          key={opt.value}
          value={opt.value}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
        >
          {opt.label}
        </RatingButton>
      ))}
    </View>
  </View>
);

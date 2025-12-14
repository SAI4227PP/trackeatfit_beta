import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ImageBackground, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgramCalendar from '../../components/ProgramCalendar';
import { useGlobalContext } from '../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";

export default function Programs() {
  const featuredPrograms = [
    {
      title: '30-Day Transform',
      description: 'Full body transformation program',
      duration: '4 weeks',
      level: 'Intermediate',
      color: ['#3b82f6', '#2563eb'],
      progress: 65,
      bgImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470',
      bgGradient: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
    },
    {
      title: 'Summer Shred',
      description: 'Get beach ready',
      duration: '6 weeks',
      level: 'Advanced',
      color: ['#ef4444', '#dc2626'],
      progress: 0,
      bgImage: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=1470',
      bgGradient: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
    }
  ];

  const [programCategories, setProgramCategories] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [networkSlow, setNetworkSlow] = useState(false);

  // Active Program State
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id;
  const [activeProgram, setActiveProgram] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [activeProgramDetails, setActiveProgramDetails] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [sessionInProgress, setSessionInProgress] = useState(false);

  const navigation = useNavigation();

  // Network slow effect for loadingPrograms and loadingActive
  useEffect(() => {
    if (!loadingPrograms && !loadingActive) {
      setNetworkSlow(false);
      return;
    }
    const timer = setTimeout(() => {
      if (loadingPrograms || loadingActive) setNetworkSlow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loadingPrograms, loadingActive]);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch(`${API_URL}/api/v3/programs/`);
        const json = await res.json();
        // Use the 'data' array from the API response
        setProgramCategories(json.data || []);
      } catch (e) {
        setProgramCategories([]);
      } finally {
        setLoadingPrograms(false);
      }
    }
    fetchPrograms();
  }, []);

  useEffect(() => {
    async function fetchActiveProgram() {
      try {
        setLoadingActive(true);
        // First get the active program ID
        const activeRes = await fetch(`${API_URL}/api/v3/user-program-progress/progress/${userId}`);
        const activeJson = await activeRes.json();
        
        if (Array.isArray(activeJson.data) && activeJson.data.length > 0) {
          const activeProgramId = activeJson.data[0].programDetails._id;
          
          // Then fetch detailed progress with program ID
          const detailRes = await fetch(`${API_URL}/api/v3/user-program-progress/progress/${userId}/${activeProgramId}`);
          const detailJson = await detailRes.json();
          
          if (detailJson.success) {
            setActiveProgram(detailJson.data);
            // Also set program details to avoid additional fetch
            setActiveProgramDetails({
              ...detailJson.data.programDetails,
              schedule: activeProgramDetails?.schedule // Keep existing schedule if any
            });
          } else {
            setActiveProgram(null);
          }
        } else {
          setActiveProgram(null);
        }
      } catch (e) {
        console.error('Error fetching active program:', e);
        setActiveProgram(null);
      } finally {
        setLoadingActive(false);
      }
    }
    if (userId) fetchActiveProgram();
  }, [userId]);

  // Set program details directly from the active program response
  useEffect(() => {
    if (activeProgram?.programDetails) {
      setActiveProgramDetails(activeProgram.programDetails);
    }
  }, [activeProgram]);

  // Utility to get label for schedule date (Today, Tomorrow, or date)
  function getScheduleDayLabel(startedAt, dayIdx) {
    if (!startedAt) return '';
    const startDate = new Date(startedAt);
    const thisDay = new Date(startDate);
    thisDay.setDate(startDate.getDate() + dayIdx);

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const compareDay = new Date(thisDay);
    compareDay.setHours(0,0,0,0);

    if (compareDay.getTime() === today.getTime()) return 'Today';
    if (compareDay.getTime() === tomorrow.getTime()) return 'Tomorrow';

    // Format as e.g. "Wed, Jul 10"
    return thisDay.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Replace the old checkSessionStatus function with a simplified version
  const handleStartWorkout = (dayIndex) => {
    if (!userId || !activeProgram?.programDetails?._id) {
      Alert.alert('Error', 'Unable to start workout. Please try again.');
      return;
    }

    // Navigate directly to StartSession with required parameters
    navigation.navigate('screens/Programs/StartSession', {
      programId: activeProgram.programDetails._id,
      dayIndex,
      schedule: activeProgramDetails?.schedule?.[dayIndex]
    });
  };

  // Update helper function to check session completion status with complete API data
  const getSessionStatus = (dayIndex) => {
    if (!activeProgram) return 'pending';
    const dayNum = dayIndex + 1;

    // Check if there's a session log for this day
    const sessionLog = activeProgram.sessionLogs?.find(log => log.day === dayNum);
    
    if (sessionLog) {
      // If the session is marked as missed in the logs
      if (sessionLog.isMissed) return 'missed';
      
      // Check if all exercises were skipped
      const allExercisesSkipped = sessionLog.completedExercises?.every(ex => ex.skipped);
      if (allExercisesSkipped) return 'skipped';
      
      // If there's a completed session
      if (sessionLog.completedAt) return 'completed';
    }
    
    // Check various day statuses from the root level arrays
    if (activeProgram.completedDays?.includes(dayNum)) return 'completed';
    if (activeProgram.skippedDays?.includes(dayNum)) return 'skipped';
    if (activeProgram.restDays?.includes(dayNum)) return 'rest';
    if (activeProgram.missedDays?.includes(dayNum)) return 'missed';
    
    // Check if the day is in the past and not completed/skipped
    const startDate = new Date(activeProgram.startedAt);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayIndex);
    dayDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dayDate < today && !sessionLog?.completedAt && !activeProgram.skippedDays?.includes(dayNum)) {
      return 'missed';
    }
    
    // If no specific status is found
    return 'pending';
  };

  // Add helper to get session details
  const getSessionDetails = (dayIndex) => {
    const dayNum = dayIndex + 1;
    return activeProgram?.sessionLogs?.find(log => log.day === dayNum);
  };

  // Add new helper function to determine if a day is interactive
  const isDayInteractive = (dayIndex) => {
    if (!activeProgram) return false;
    const todayIndex = getTodaySessionIndex();
    return dayIndex === todayIndex;
  };

  // Add new function to find today's session index
  const getTodaySessionIndex = () => {
    if (!activeProgram?.startedAt) return -1;
    const startDate = new Date(activeProgram.startedAt);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : -1;
  };

  // Add scrollToToday function
  const scrollToToday = (scrollViewRef) => {
    const todayIndex = getTodaySessionIndex();
    if (todayIndex >= 0) {
      scrollViewRef?.current?.scrollTo({
        x: todayIndex * 316, // card width (300) + margin (16)
        animated: true
      });
    }
  };

  // Update the card rendering to include session details
  const renderSessionCard = (day, idx) => {
    const sessionStatus = getSessionStatus(idx);
    const sessionDetails = getSessionDetails(idx);
    const isInteractive = isDayInteractive(idx);
    const isActive = !['completed', 'skipped', 'missed'].includes(sessionStatus);

    return (
      <TouchableOpacity
        key={day.day || idx}
        activeOpacity={0.95}
        style={{
          marginRight: 16,
          width: 310,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isInteractive ? '#dbeafe' : '#e2e8f0',
          shadowColor: isInteractive ? '#93c5fd' : '#e2e8f0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
          backgroundColor: isInteractive ? '#f8fafc' : '#f1f5f9',
          overflow: 'hidden',
        }}
        onPress={() => isInteractive ? handleStartWorkout(idx) : null}
        disabled={!isInteractive}
      >
        <LinearGradient
          colors={isInteractive ? ['#f8fafc', '#fff'] : ['#f1f5f9', '#f8fafc']}
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isInteractive ? '#dbeafe' : '#e2e8f0',
            padding: 0,
          }}
        >
          {!isInteractive && (
            <View style={{
              position: 'absolute',
              left: 0, right: 0, top: 0, bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.4)',
              borderRadius: 16,
              zIndex: 10,
            }} />
          )}
          <View style={{ padding: 16 }}>
            {/* Date Header with Status */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  borderRadius: 8,
                  padding: 8,
                  marginRight: 12,
                  backgroundColor:
                    sessionStatus === 'completed' ? '#16a34a' :
                    sessionStatus === 'skipped' ? '#f59e0b' :
                    sessionStatus === 'rest' ? '#3b82f6' :
                    sessionStatus === 'missed' ? '#ef4444' :
                    '#3b82f6'
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>D{idx + 1}</Text>
                </View>
                <View>
                  <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>
                    {getScheduleDayLabel(activeProgram.startedAt, idx)}
                  </Text>
                  <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 18 }}>
                    {day.title}
                  </Text>
                  {/* Only show session details for active or rest days */}
                  {sessionDetails && isActive && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons name="time-outline" size={12} color="#64748b" />
                        <Text style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>
                          {sessionDetails.durationInMinutes}min
                        </Text>
                      </View>
                      {sessionDetails.rating && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="star" size={12} color="#f59e0b" />
                          <Text style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>
                            {sessionDetails.rating}/5
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
              {/* Status Icon */}
              <View style={{
                height: 32,
                width: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  sessionStatus === 'completed' ? '#dcfce7' :
                  sessionStatus === 'skipped' ? '#fef3c7' :
                  sessionStatus === 'rest' ? '#dbeafe' :
                  sessionStatus === 'missed' ? '#fee2e2' :
                  '#dbeafe'
              }}>
                <Ionicons
                  name={
                    sessionStatus === 'completed' ? 'checkmark' :
                    sessionStatus === 'skipped' ? 'arrow-forward' :
                    sessionStatus === 'rest' ? 'bed' :
                    sessionStatus === 'missed' ? 'close' :
                    'chevron-forward'
                  }
                  size={20}
                  color={
                    sessionStatus === 'completed' ? '#16a34a' :
                    sessionStatus === 'skipped' ? '#f59e0b' :
                    sessionStatus === 'rest' ? '#3b82f6' :
                    sessionStatus === 'missed' ? '#ef4444' :
                    '#3b82f6'
                  }
                />
              </View>
            </View>

            {/* Workout Stats */}
            <View style={{
              flexDirection: 'row',
              marginBottom: 16,
              backgroundColor: '#dbeafe',
              borderRadius: 12,
              padding: 12,
            }}>
              <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#dbeafe', alignItems: 'center' }}>
                <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 18 }}>
                  {day.exercises?.length || 0}
                </Text>
                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '500' }}>Exercises</Text>
              </View>
              <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#dbeafe', alignItems: 'center' }}>
                <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 18 }}>
                  {day.exercises?.reduce((total, ex) => total + (ex.duration || 0), 0) || '45'}
                </Text>
                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '500' }}>Minutes</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {['beginner', 'intermediate', 'advanced'].map((level, i) => (
                    <View
                      key={level}
                      style={{
                        height: 8,
                        width: 8,
                        borderRadius: 4,
                        marginHorizontal: 1,
                        backgroundColor:
                          (day.difficulty || 'beginner').toLowerCase() === level
                            ? '#3b82f6'
                            : '#bfdbfe'
                      }}
                    />
                  ))}
                </View>
                <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '500', marginTop: 4, textTransform: 'capitalize' }}>
                  {day.difficulty || 'Beginner'}
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={{
                backgroundColor:
                  sessionStatus === 'completed' ? '#16a34a' :
                  sessionStatus === 'skipped' ? '#f59e0b' :
                  sessionStatus === 'rest' ? '#3b82f6' :
                  sessionStatus === 'missed' ? '#ef4444' :
                  isInteractive ? '#3b82f6' : '#94a3b8',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                shadowColor: isInteractive ? '#3b82f6' : '#94a3b8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => isInteractive ? handleStartWorkout(idx) : null}
              disabled={!isInteractive}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {!isInteractive && sessionStatus === 'pending' && (
                  <Ionicons name="lock-closed" size={16} color="#fff" />
                )}
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
                  {sessionStatus === 'completed' ? 'Completed' :
                   sessionStatus === 'skipped' ? 'Skipped' :
                   sessionStatus === 'rest' ? 'Rest Day' :
                   sessionStatus === 'missed' ? 'Missed' :
                   isInteractive ? 'Start Workout' : 'Locked'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const scrollViewRef = React.useRef(null);

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
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Programs</Text>
                <TouchableOpacity style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 999 }}>
                  <Ionicons name="options-outline" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingHorizontal: 16 }}>
              {/* Continue Training Section */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Continue Training</Text>
                {loadingActive ? (
                  <View style={{ borderRadius: 16, overflow: 'hidden', height: 180 }}>
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#e2e8f0', animation: 'pulse 1.5s infinite' }} />
                  </View>
                ) : activeProgram ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('screens/Programs/ActiveProgram', { id: activeProgram.programDetails._id })}
                    activeOpacity={0.9}
                  >
                    <ImageBackground
                      source={{ uri: activeProgram.programDetails?.thumbnail || 'https://images.unsplash.com/photo-1517960419151-0c2b8c8e5a1c?q=80&w=1470' }}
                      style={{ borderRadius: 16, overflow: 'hidden' }}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                        style={{ padding: 20 }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', opacity: 0.9, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                              In Progress ({activeProgram.progressPercentage || 0}%)
                            </Text>
                            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>
                              {activeProgram.programName}
                            </Text>
                            <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', height: 6, borderRadius: 12 }}>
                              <View style={{ backgroundColor: '#ffffff', height: 6, borderRadius: 12, width: `${activeProgram.progressPercentage || 0}%` }} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, marginRight: 12 }}>
                                <MaterialCommunityIcons name="timer" size={16} color="#22d3ee" />
                                <Text style={{ color: '#ffffff', marginLeft: 4, fontSize: 12 }}>
                                  {activeProgram.totalSessionsCompleted || 0}
                                  {activeProgram.programDetails?.duration?.sessionsPerWeek
                                    ? ` / ${activeProgram.programDetails.duration.sessionsPerWeek} sessions`
                                    : ' sessions'}
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, marginRight: 12 }}>
                                <MaterialCommunityIcons name="fire" size={16} color="#f87171" />
                                <Text style={{ color: '#ffffff', marginLeft: 4, fontSize: 12 }}>
                                  {activeProgram.totalMinutesTrained || 0} min
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
                                <Ionicons name="barbell-outline" size={14} color="#fff" />
                                <Text style={{ color: '#ffffff', marginLeft: 4, fontSize: 12, textTransform: 'capitalize' }}>
                                  {activeProgram.programDetails?.difficulty}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 999, padding: 12 }}>
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
                      style={{
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        backgroundColor: '#ffffff',
                        shadowColor: '#e2e8f0',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 4,
                      }}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#eff6ff', borderRadius: 999, padding: 12, marginBottom: 8 }}>
                          <Ionicons name="barbell-outline" size={24} color="#3b82f6" />
                        </View>
                        <Text style={{ color: '#111827', fontSize: 18, fontWeight: 'semibold', marginBottom: 8 }}>
                          No Active Program
                        </Text>
                        <Text style={{ color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
                          Start a fitness program to track your progress and achieve your goals.
                        </Text>
                        <View style={{ backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }}>
                          <Text style={{ color: '#ffffff', fontWeight: 'medium' }}>Browse Programs</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* Active Program Schedule */}
              {activeProgram && (
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Your Week</Text>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => setShowCalendar(true)}
                    >
                      <Text style={{ color: '#3b82f6', fontWeight: 'semibold', marginRight: 4 }}>View Calendar</Text>
                      <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                    </TouchableOpacity>
                  </View>

                  {/* Calendar Modal */}
                  <ProgramCalendar
                    visible={showCalendar}
                    onClose={() => setShowCalendar(false)}
                    schedule={activeProgramDetails?.schedule}
                    startDate={activeProgram?.startedAt}
                  />
                  
                  {loadingSchedule ? (
                    <View style={{ spaceY: 12 }}>
                      {[1, 2].map(i => (
                        <View key={i} style={{ height: 128, backgroundColor: '#e2e8f0', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
                      ))}
                    </View>
                  ) : activeProgramDetails && Array.isArray(activeProgramDetails.schedule) ? (
                    <ScrollView
                      ref={scrollViewRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingRight: 20 }}
                      style={{ marginTop: 8 }}
                      onLayout={() => scrollToToday(scrollViewRef)}
                    >
                      {activeProgramDetails.schedule.map((day, idx) => renderSessionCard(day, idx))}
                    </ScrollView>
                  ) : (
                    <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
                      <Ionicons name="calendar-clear-outline" size={32} color="#3b82f6" />
                      <Text style={{ color: '#3b82f6', fontWeight: 'semibold', marginTop: 8 }}>No workouts scheduled</Text>
                      <Text style={{ color: '#3b82f6', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                        Your workout schedule will appear here once you start a program
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Featured Programs */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Featured Programs</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {featuredPrograms.map((program, index) => (
                    <TouchableOpacity key={index} style={{ marginRight: 16, width: 300 }}>
                      <ImageBackground
                        source={{ uri: program.bgImage }}
                        style={{ borderRadius: 16, overflow: 'hidden' }}
                        imageStyle={{ borderRadius: 16 }}
                      >
                        <LinearGradient
                          colors={program.bgGradient}
                          style={{ padding: 20 }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#ffffff', opacity: 0.9, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                                Featured
                              </Text>
                              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>
                                {program.title}
                              </Text>
                              
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                                <Text style={{ color: '#ffffff', opacity: 0.9, fontSize: 12, marginBottom: 8 }}>{program.description}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                    <Ionicons name="time-outline" size={14} color="#fff" />
                                    <Text style={{ color: '#ffffff', marginLeft: 4, fontSize: 12 }}>
                                      {program.duration}
                                    </Text>
                                  </View>
                                  <View style={{ width: 4, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginHorizontal: 8 }} />
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="barbell-outline" size={14} color="#fff" />
                                    <Text style={{ color: '#ffffff', marginLeft: 4, fontSize: 12 }}>
                                      {program.level}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Program Categories */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>All Programs</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('screens/Programs/AllPrograms')}
                  style={{ padding: 8 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-forward-outline" size={24} color="#334155" />
                </TouchableOpacity>
              </View>
              {loadingPrograms ? (
                <View style={{ paddingHorizontal: 16 }}>
                  {[1,2,3].map((_, index) => (
                    <View 
                      key={index} 
                      style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', height: 200, backgroundColor: '#e2e8f0', animation: 'pulse 1.5s infinite' }}
                    />
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                  style={{ marginBottom: 24 }}
                >
                  {programCategories.map((program, index) => (
                    <TouchableOpacity
                      key={program._id || index}
                      activeOpacity={0.92}
                      style={{
                        marginBottom: 12,
                        width: 320,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: '#dbeafe',
                        backgroundColor: '#ffffff',
                        shadowColor: '#e2e8f0',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 4,
                      }}
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
                        style={{ width: '100%', height: 220, justifyContent: 'flex-end' }}
                      >
                        {program.isFeatured && (
                          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#fbbf24', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12, zIndex: 10 }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 12 }}>
                              Featured
                            </Text>
                          </View>
                        )}
                        <View style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.8)', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 18 }}>
                              {program.programName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="star" size={16} color="#fbbf24" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 16 }}>
                                {program.rating ? program.rating.toFixed(1) : 'N/A'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(17,24,39,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, marginRight: 8 }}>
                              {program.category}
                            </Text>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(17,24,39,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, marginRight: 8 }}>
                              {program.goal}
                            </Text>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(17,24,39,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
                              {program.difficulty}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', flexWrap: 'align-items-center', marginBottom: 8 }}>
                            <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 12, marginRight: 8, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
                              {program.duration && program.duration.weeks ? `${program.duration.weeks} week${program.duration.weeks > 1 ? 's' : ''}` : ''}
                            </Text>
                            <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 12, marginRight: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
                              {program.duration && program.duration.sessionsPerWeek ? `${program.duration.sessionsPerWeek} sessions/week` : ''}
                            </Text>
                            <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(22,163,74,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
                              {program.totalWorkouts ? `${program.totalWorkouts} workouts` : ''}
                            </Text>
                          </View>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#ffffff' }} />
    </>
  );
}



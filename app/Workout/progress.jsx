import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';

const API_URL = "https://trackeatfit.onrender.com";


export default function Progress() {
  const { user } = useGlobalContext();
  const userId = user?.id || user?._id; // Default to a sample user ID if not available
  const monthlyGoals = [
    { title: 'Workouts', target: 20, current: 12, color: '#3b82f6' },
    { title: 'Running', target: 40, current: 25, unit: 'km', color: '#ef4444' },
    { title: 'Weight', target: 75, current: 78, unit: 'kg', color: '#10b981' }
  ];

  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  // Add state for today, week, month
  const [todayStats, setTodayStats] = useState({ workouts: 0, duration: 0, cal: 0 });
  const [weekStats, setWeekStats] = useState({ workouts: 0, duration: 0, cal: 0 });
  const [monthStats, setMonthStats] = useState({ workouts: 0, duration: 0, cal: 0 });
  // Add state for previous day, week, month
  const [prevDayStats, setPrevDayStats] = useState({ workouts: 0, duration: 0, cal: 0 });
  const [prevWeekStats, setPrevWeekStats] = useState({ workouts: 0, duration: 0, cal: 0 });
  const [prevMonthStats, setPrevMonthStats] = useState({ workouts: 0, duration: 0, cal: 0 });
  // Track selected period
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [weeklyActivity, setWeeklyActivity] = useState([
    { day: 'Mon', workouts: 0, duration: 0 },
    { day: 'Tue', workouts: 0, duration: 0 },
    { day: 'Wed', workouts: 0, duration: 0 },
    { day: 'Thu', workouts: 0, duration: 0 },
    { day: 'Fri', workouts: 0, duration: 0 },
    { day: 'Sat', workouts: 0, duration: 0 },
    { day: 'Sun', workouts: 0, duration: 0 }
  ]);
  // Add monthlyActivity state
  const [monthlyActivity, setMonthlyActivity] = useState([
    { week: 1, workouts: 0, duration: 0, cal: 0 },
    { week: 2, workouts: 0, duration: 0, cal: 0 },
    { week: 3, workouts: 0, duration: 0, cal: 0 },
    { week: 4, workouts: 0, duration: 0, cal: 0 }
  ]);
  const [personalRecords, setPersonalRecords] = useState([]);
  // Add state for PRs by period
  const [personalRecordsToday, setPersonalRecordsToday] = useState([]);
  const [personalRecordsWeekly, setPersonalRecordsWeekly] = useState([]);
  const [personalRecordsMonthly, setPersonalRecordsMonthly] = useState([]);
  // Add loading state
  const [loadingPR, setLoadingPR] = useState(true);
  // Add state for workout history and loading
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loadingWorkoutHistory, setLoadingWorkoutHistory] = useState(true);
  const [networkSlow, setNetworkSlow] = useState(false);

  // Network slow effect for loadingPR and loadingWorkoutHistory
  useEffect(() => {
    if (!loadingPR && !loadingWorkoutHistory) {
      setNetworkSlow(false);
      return;
    }
    const timer = setTimeout(() => {
      if (loadingPR || loadingWorkoutHistory) setNetworkSlow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loadingPR, loadingWorkoutHistory]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v3/workouts/analytics/user/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setTotalWorkouts(data.totalWorkouts || 0);
        setTotalHours(data.totalHours || 0);
        setTotalCalories(data.totalCalories || 0);
        setWeeklyActivity(data.weeklyActivity || [
          { day: 'Mon', workouts: 0, duration: 0 },
          { day: 'Tue', workouts: 0, duration: 0 },
          { day: 'Wed', workouts: 0, duration: 0 },
          { day: 'Thu', workouts: 0, duration: 0 },
          { day: 'Fri', workouts: 0, duration: 0 },
          { day: 'Sat', workouts: 0, duration: 0 },
          { day: 'Sun', workouts: 0, duration: 0 }
        ]);
        // Set monthlyActivity from API if present
        setMonthlyActivity(data.monthly || [
          { week: 1, workouts: 0, duration: 0, cal: 0 },
          { week: 2, workouts: 0, duration: 0, cal: 0 },
          { week: 3, workouts: 0, duration: 0, cal: 0 },
          { week: 4, workouts: 0, duration: 0, cal: 0 }
        ]);
        setTodayStats(data.today || { workouts: 0, duration: 0, cal: 0 });
        // Set previous day/week/month stats if present
        setPrevDayStats(data.prevDay || { workouts: 0, duration: 0, cal: 0 });
        setPrevWeekStats(data.prevWeek || { workouts: 0, duration: 0, cal: 0 });
        setPrevMonthStats(data.prevMonth || { workouts: 0, duration: 0, cal: 0 });
        // Calculate week stats from weeklyActivity if not present
        if (data.weeklyActivity) {
          const weekWorkouts = data.weeklyActivity.reduce((sum, d) => sum + (d.workouts || 0), 0);
          const weekDuration = data.weeklyActivity.reduce((sum, d) => sum + (d.duration || 0), 0);
          setWeekStats({
            workouts: weekWorkouts,
            duration: weekDuration,
            cal: data.totalCalories || 0 // fallback
          });
        } else {
          setWeekStats({ workouts: 0, duration: 0, cal: 0 });
        }
        // Calculate month stats from monthly if present
        if (data.monthly && Array.isArray(data.monthly)) {
          const monthWorkouts = data.monthly.reduce((sum, w) => sum + (w.workouts || 0), 0);
          const monthDuration = data.monthly.reduce((sum, w) => sum + (w.duration || 0), 0);
          const monthCal = data.monthly.reduce((sum, w) => sum + (w.cal || 0), 0);
          setMonthStats({ workouts: monthWorkouts, duration: monthDuration, cal: monthCal });
        } else {
          setMonthStats({ workouts: 0, duration: 0, cal: 0 });
        }
        // Transform personalRecords object to array for rendering
        if (data.personalRecords) {
          const prArr = Object.entries(data.personalRecords).map(([title, rec]) => ({
            title,
            value: rec.reps + ' reps',
            date: new Date(rec.date).toLocaleDateString()
          }));
          setPersonalRecords(prArr);
        } else {
          setPersonalRecords([]);
        }
        // Transform PRs for today, week, month
        if (data.personalRecordsToday) {
          setPersonalRecordsToday(
            Object.entries(data.personalRecordsToday).map(([title, rec]) => ({
              title,
              value: rec.reps + ' reps',
              date: new Date(rec.date).toLocaleDateString()
            }))
          );
        } else {
          setPersonalRecordsToday([]);
        }
        if (data.personalRecordsWeekly) {
          setPersonalRecordsWeekly(
            Object.entries(data.personalRecordsWeekly).map(([title, rec]) => ({
              title,
              value: rec.reps + ' reps',
              date: new Date(rec.date).toLocaleDateString()
            }))
          );
        } else {
          setPersonalRecordsWeekly([]);
        }
        if (data.personalRecordsMonthly) {
          setPersonalRecordsMonthly(
            Object.entries(data.personalRecordsMonthly).map(([title, rec]) => ({
              title,
              value: rec.reps + ' reps',
              date: new Date(rec.date).toLocaleDateString()
            }))
          );
        } else {
          setPersonalRecordsMonthly([]);
        }
        setLoadingPR(false);
      } catch (err) {
        setTotalWorkouts(0);
        setTotalHours(0);
        setTotalCalories(0);
        setWeeklyActivity([
          { day: 'Mon', workouts: 0, duration: 0 },
          { day: 'Tue', workouts: 0, duration: 0 },
          { day: 'Wed', workouts: 0, duration: 0 },
          { day: 'Thu', workouts: 0, duration: 0 },
          { day: 'Fri', workouts: 0, duration: 0 },
          { day: 'Sat', workouts: 0, duration: 0 },
          { day: 'Sun', workouts: 0, duration: 0 }
        ]);
        setTodayStats({ workouts: 0, duration: 0, cal: 0 });
        setWeekStats({ workouts: 0, duration: 0, cal: 0 });
        setMonthStats({ workouts: 0, duration: 0, cal: 0 });
        setPersonalRecords([]);
        setPersonalRecordsToday([]);
        setPersonalRecordsWeekly([]);
        setPersonalRecordsMonthly([]);
        setLoadingPR(false);
      }
    };
    // Fetch analytics as before
    fetchAnalytics();

    // Fetch workout history from new endpoint
    const fetchWorkoutHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v3/workouts/user/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch workout history');
        const data = await res.json();
        setWorkoutHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setWorkoutHistory([]);
      } finally {
        setLoadingWorkoutHistory(false);
      }
    };
    fetchWorkoutHistory();
  }, []);

  const minDuration = Math.min(...weeklyActivity.map(d => d.duration));
  const maxDuration = Math.max(...weeklyActivity.map(d => d.duration));

  // Helper to get stats for selected period
  const getStatsForPeriod = () => {
    if (selectedPeriod === 'today') return todayStats;
    if (selectedPeriod === 'week') return weekStats;
    if (selectedPeriod === 'month') return monthStats;
    // fallback to all time
    return { workouts: totalWorkouts, duration: totalHours * 60, cal: totalCalories };
  };

  // Helper for activity chart data
  const getActivityData = () => {
    if (selectedPeriod === 'month') return monthlyActivity;
    return weeklyActivity;
  };

  // Helper for min/max duration for chart
  const getMinMaxDuration = () => {
    const data = getActivityData();
    if (!data.length) return { min: 0, max: 0 };
    const durations = data.map(d => d.duration || 0);
    return { min: Math.min(...durations), max: Math.max(...durations) };
  };

  // Helper to get PRs for selected period
  const getPRsForPeriod = () => {
    if (selectedPeriod === 'today') return personalRecordsToday;
    if (selectedPeriod === 'week') return personalRecordsWeekly;
    if (selectedPeriod === 'month') return personalRecordsMonthly;
    return personalRecords;
  };

  const renderWorkoutHistory = () => (
  <View style={{ marginBottom: 32 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', letterSpacing: -0.5 }}>Workout History</Text>
  <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="chevron-forward-outline" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>
      {loadingWorkoutHistory ? (
        // Loading skeleton
        <View>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ backgroundColor: '#f3f4f6', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, opacity: 0.6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <View style={{ backgroundColor: '#e5e7eb', borderRadius: 8, width: 96, height: 16, marginBottom: 8 }} />
                  <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, width: 64, height: 12 }} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ backgroundColor: '#e5e7eb', borderRadius: 8, width: 40, height: 16, marginBottom: 8 }} />
                  <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, width: 48, height: 12 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : workoutHistory.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Ionicons name="barbell-outline" size={32} color="#94a3b8" style={{ opacity: 0.5 }} />
          <Text style={{ color: '#94a3b8', marginTop: 8, fontSize: 16, fontWeight: '500' }}>No workout history yet.</Text>
          <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
            Complete workouts to see your history here!
          </Text>
        </View>
      ) : (
        <ScrollView>
          {workoutHistory.map((workout, index) => (
            <View key={index} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>
                    {new Date(workout.date).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                    {workout.name}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>
                    {workout.type === 'Program' && workout.title
                      ? `Day ${workout.day}: ${workout.title}`
                      : workout.type === 'Workout'
                        ? 'Completed'
                        : workout.details || ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '600' }}>{workout.duration}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>{workout.calories} cal</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
  </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <LinearGradient
          colors={['#f8fafc', '#f1f5f9']}
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
          <View style={{ marginBottom: 12 }}>
            <LinearGradient
              colors={['#f8fafc', '#f1f5f9']}
              style={{ paddingHorizontal: 20, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>Progress</Text>
                <TouchableOpacity style={{ padding: 8, backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Ionicons name="calendar-outline" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingHorizontal: 20 }}>
              {/* Time Period Selector */}
              <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                {['today', 'week', 'month', 'all'].map((period, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selectedPeriod === period ? '#2563eb' : '#e5e7eb',
                      backgroundColor: selectedPeriod === period ? '#2563eb' : '#fff',
                      marginRight: index !== 3 ? 8 : 0,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={{ color: selectedPeriod === period ? '#fff' : '#374151', fontWeight: selectedPeriod === period ? '600' : '500' }}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Stats Cards */}
              <View style={{ marginBottom: 28 }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#f3f4f6' }}>
                  {loadingPR ? (
                    // Loading skeleton for stats
                    <>
                      {[1, 2, 3].map((i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: i === 3 ? 0 : 12, borderBottomWidth: i === 3 ? 0 : 1, borderBottomColor: i === 3 ? undefined : '#f3f4f6', opacity: 0.7 }}>
                          <View style={{ padding: 12, borderRadius: 999, backgroundColor: '#f3f4f6', marginRight: 16, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ backgroundColor: '#e5e7eb', borderRadius: 999, width: 24, height: 24 }} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View>
                                <View style={{ backgroundColor: '#e5e7eb', borderRadius: 8, width: 80, height: 16, marginBottom: 8 }} />
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ backgroundColor: '#e5e7eb', borderRadius: 8, width: 48, height: 24 }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                  <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, width: 32, height: 16 }} />
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    [
                      {
                        title: 'Workouts',
                        value: getStatsForPeriod().workouts?.toString() ?? '0',
                        icon: 'barbell-outline',
                        iconBg: 'bg-blue-100',
                        iconColor: '#3b82f6',
                        showProgress: false,
                        compare: (() => {
                          if (selectedPeriod === 'today') {
                            return todayStats.workouts - prevDayStats.workouts;
                          }
                          if (selectedPeriod === 'week') {
                            return weekStats.workouts - prevWeekStats.workouts;
                          }
                          if (selectedPeriod === 'month') {
                            return monthStats.workouts - prevMonthStats.workouts;
                          }
                          // For 'all', compare with 0
                          return 0;
                        })(),
                        prev: (() => {
                          if (selectedPeriod === 'today') return prevDayStats.workouts;
                          if (selectedPeriod === 'week') return prevWeekStats.workouts;
                          if (selectedPeriod === 'month') return prevMonthStats.workouts;
                          // For 'all', previous is 0
                          return 0;
                        })(),
                      },
                      {
                        title: 'Hours',
                        value: ((getStatsForPeriod().duration ?? 0) / 60).toFixed(1),
                        icon: 'time-outline',
                        iconBg: 'bg-green-100',
                        iconColor: '#10b981',
                        showProgress: false,
                        compare: (() => {
                          if (selectedPeriod === 'today') {
                            return (todayStats.duration / 60) - (prevDayStats.duration / 60);
                          }
                          if (selectedPeriod === 'week') {
                            return (weekStats.duration / 60) - (prevWeekStats.duration / 60);
                          }
                          if (selectedPeriod === 'month') {
                            return (monthStats.duration / 60) - (prevMonthStats.duration / 60);
                          }
                          // For 'all', compare with 0
                          return 0;
                        })(),
                        prev: (() => {
                          if (selectedPeriod === 'today') return prevDayStats.duration / 60;
                          if (selectedPeriod === 'week') return prevWeekStats.duration / 60;
                          if (selectedPeriod === 'month') return prevMonthStats.duration / 60;
                          // For 'all', previous is 0
                          return 0;
                        })(),
                      },
                      {
                        title: 'Calories',
                        value:
                          (getStatsForPeriod().cal ?? 0) >= 1000
                            ? ((getStatsForPeriod().cal ?? 0) / 1000).toFixed(1) + 'k'
                            : (getStatsForPeriod().cal ?? 0).toString(),
                        icon: 'flame-outline',
                        iconBg: 'bg-red-100',
                        iconColor: '#ef4444',
                        showProgress: false,
                        compare: (() => {
                          if (selectedPeriod === 'today') {
                            return todayStats.cal - prevDayStats.cal;
                          }
                          if (selectedPeriod === 'week') {
                            return weekStats.cal - prevWeekStats.cal;
                          }
                          if (selectedPeriod === 'month') {
                            return monthStats.cal - prevMonthStats.cal;
                          }
                          // For 'all', compare with 0
                          return 0;
                        })(),
                        prev: (() => {
                          if (selectedPeriod === 'today') return prevDayStats.cal;
                          if (selectedPeriod === 'week') return prevWeekStats.cal;
                          if (selectedPeriod === 'month') return prevMonthStats.cal;
                          // For 'all', previous is 0
                          return 0;
                        })(),
                      }
                    ].map((stat, index) => {
                      const isPositive = stat.compare > 0;
                      const isZero = stat.compare === 0;
                      const percent = stat.prev === 0
                        ? (stat.compare === 0 ? 0 : 100)
                        : (stat.compare / stat.prev) * 100;
                      return (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: index === 2 ? 0 : 12, borderBottomWidth: index === 2 ? 0 : 1, borderBottomColor: index === 2 ? undefined : '#f3f4f6' }}>
                          <View
                            style={{
                              padding: 12,
                              borderRadius: 999,
                              backgroundColor: stat.iconBg === 'bg-blue-100' ? '#dbeafe' : stat.iconBg === 'bg-green-100' ? '#d1fae5' : '#fee2e2',
                              marginRight: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name={stat.icon} size={24} color={stat.iconColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>{stat.title}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{stat.value}</Text>
                                {/* Comparison arrow and value */}
                                {selectedPeriod === 'all' ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                    <Ionicons
                                      name="remove"
                                      size={16}
                                      color="#64748b"
                                    />
                                    <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#94a3b8' }}>
                                      +0
                                      <Text style={{ color: '#94a3b8', fontWeight: '400' }}> (0%)</Text>
                                    </Text>
                                  </View>
                                ) : (
                                  !isZero && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                      <Ionicons
                                        name={isPositive ? "arrow-up" : "arrow-down"}
                                        size={16}
                                        color={isPositive ? "#10b981" : "#ef4444"}
                                      />
                                      <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '600', color: isPositive ? '#10b981' : '#ef4444' }}>
                                        {Math.abs(stat.compare).toFixed(1)}
                                        <Text style={{ color: '#94a3b8', fontWeight: '400' }}> ({Math.abs(percent).toFixed(0)}%)</Text>
                                      </Text>
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Personal Records */}
              <View style={{ marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', letterSpacing: -0.5 }}>Personal Records</Text>
                  <TouchableOpacity style={{ backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#dbeafe' }} onPress={() => alert('View All Records')}>
                    <Ionicons name="chevron-forward-outline" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?q=80&w=1469' }}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']}
                    style={{ padding: 16 }}
                  >
                    {loadingPR ? (
                      // Loading skeleton
                      <>
                        {[1, 2, 3].map(i => (
                          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', opacity: 0.7 }}>
                            <View>
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 96, height: 16, marginBottom: 8 }} />
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, width: 64, height: 12 }} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 40, height: 16, marginRight: 8 }} />
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 999, width: 22, height: 22 }} />
                            </View>
                          </View>
                        ))}
                      </>
                    ) : getPRsForPeriod().length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                        <Ionicons name="trophy-outline" size={36} color="#fff" style={{ opacity: 0.5 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: 16 }}>No personal records yet.</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                          Complete workouts to set your first personal record!
                        </Text>
                      </View>
                    ) : getPRsForPeriod().map((record, index) => (
                      <View 
                        key={index} 
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: index !== getPRsForPeriod().length - 1 ? 1 : 0, borderBottomColor: index !== getPRsForPeriod().length - 1 ? 'rgba(255,255,255,0.1)' : undefined }}
                      >
                        <View>
                          <Text style={{ color: '#fff', fontWeight: '500' }}>{record.title}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{record.date}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>{record.value}</Text>
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 999 }}>
                            <Ionicons name="trophy" size={16} color="#fff" />
                          </View>
                        </View>
                      </View>
                    ))}
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Monthly Goals Progress */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', letterSpacing: -0.5, marginBottom: 12 }}>Monthly Goals</Text>
                {monthlyGoals.map((goal, index) => (
                  <ImageBackground
                    key={index}
                    source={{ uri: `https://images.unsplash.com/photo-${
                      goal.title === 'Workouts' ? '1534438327276-14e5300c3a48' :
                      goal.title === 'Running' ? '1552674605-db6ffd4facb5' : '1571019613454-1cb2f99b2d8b'
                    }?q=80&w=1470` }}
                    style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}
                    imageStyle={{ borderRadius: 12 }}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      style={{ padding: 16 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, marginRight: 12 }}>
                            <Ionicons 
                              name={
                                goal.title === 'Workouts' ? 'barbell-outline' :
                                goal.title === 'Running' ? 'walk-outline' : 'scale-outline'
                              } 
                              size={20} 
                              color="#fff" 
                            />
                          </View>
                          <Text style={{ color: '#fff', fontWeight: '500' }}>{goal.title}</Text>
                        </View>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                          {goal.current}{goal.unit ? goal.unit : ''} / {goal.target}{goal.unit ? goal.unit : ''}
                        </Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' }}>
                        <View 
                          style={{
                            height: '100%',
                            borderRadius: 999,
                            backgroundColor: '#fff',
                            width: `${(goal.current / goal.target) * 100}%`,
                          }}
                        />
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                ))}
              </View>

              {/* Weekly/Monthly Activity Chart */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', letterSpacing: -0.5, marginBottom: 12 }}>
                  {selectedPeriod === 'month' ? 'Monthly Activity' : 'Weekly Activity'}
                </Text>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469' }}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={{ padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 150, alignItems: 'flex-end' }}>
                      {getActivityData().map((item, index) => {
                        // For week: item.day, for month: item.week
                        const label = selectedPeriod === 'month' ? `W${item.week}` : item.day;
                        const value = item.workouts || 0;
                        const duration = item.duration || 0;
                        const barHeight = (duration / 60) * 100;
                        const maxHeight = 110;
                        const minBarHeight = 10;
                        const actualHeight = duration > 0
                          ? Math.max((barHeight / 100) * maxHeight, minBarHeight)
                          : minBarHeight;

                        return (
                          <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                            <View style={{ width: '100%', paddingHorizontal: 4, alignItems: 'flex-end', justifyContent: 'flex-end', flex: 1 }}>
                              <View 
                                style={{ 
                                  height: actualHeight,
                                  maxHeight: maxHeight,
                                  width: 10,
                                  alignSelf: 'center',
                                  borderRadius: 999,
                                  backgroundColor: value > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
                                }} 
                              />
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>{label}</Text>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{value}</Text>
                          </View>
                        );
                      })}
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{getMinMaxDuration().min} min</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{getMinMaxDuration().max} min</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Body Measurements */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', letterSpacing: -0.5, marginBottom: 12 }}>Body Measurements</Text>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?q=80&w=1470' }}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={{ padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 16 }}>
                          <Ionicons name="trending-down" size={20} color="#fff" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ color: '#fff', fontWeight: '500' }}>Weight Trend</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Last updated today</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>78.5 kg</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                          <Ionicons name="arrow-down" size={14} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 4 }}>2.5 kg</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Add Measurement Button */}
              <TouchableOpacity style={{ backgroundColor: '#2563eb', borderRadius: 16, padding: 16, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }} activeOpacity={0.9}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Add New Measurement</Text>
                </View>
              </TouchableOpacity>

              {/* Workout History Section */}
              {renderWorkoutHistory()}
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
  <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }} />
    </>
  );
}


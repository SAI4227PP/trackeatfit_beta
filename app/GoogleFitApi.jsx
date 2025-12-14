import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import images from '../constants/images'; // Adjust path if needed
import { useGoogleFit } from '../context/GoogleFitContext';

// CustomButton component
const CustomButton = ({ title, onPress, color, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      width: '100%',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: color,
      opacity: disabled ? 0.5 : 1,
      marginVertical: 4
    }}
    activeOpacity={0.8}
  >
    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
  </TouchableOpacity>
);

const BarGraph = ({ data, label }) => {
  // data: [{ label: string, value: number }]
  // Fix: If data is empty, render nothing
  if (!data || data.length === 0) {
    return <View style={{ height: 130, justifyContent: 'center', alignItems: 'center' }} />;
  }

  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(18, Math.floor((Dimensions.get('window').width * 0.8) / (data.length || 1)) - 8);
  const barColor = '#1976d2';
  const gridColor = '#e0e0e0';
  const axisColor = '#bbb';

  // Fix: Use a stable Animated.Value for each bar
  const [animatedValues, setAnimatedValues] = useState(data.map(() => new Animated.Value(0)));

  useEffect(() => {
    // Reset animated values if data length changes
    if (animatedValues.length !== data.length) {
      setAnimatedValues(data.map(() => new Animated.Value(0)));
      return;
    }
    Animated.stagger(
      60,
      animatedValues.map((anim, i) =>
        Animated.timing(anim, {
          toValue: Math.max(10, (data[i]?.value / max) * 100),
          duration: 400,
          useNativeDriver: false,
        })
      )
    ).start();
    // eslint-disable-next-line
  }, [data.map(d => d.value).join(','), data.length]);

  // Y-axis grid lines (5 lines)
  const gridLines = [];
  for (let i = 0; i <= 5; i++) {
    gridLines.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: (i * 100) / 5,
          borderTopWidth: 1,
          borderTopColor: gridColor,
        }}
      >
        <Text style={{
          position: 'absolute',
          left: -36,
          top: -8,
          fontSize: 10,
          color: '#888',
          width: 32,
          textAlign: 'right',
        }}>
          {Math.round(max - (max * i) / 5)}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 130, marginLeft: 36 }}>
        {/* Y-axis grid and labels */}
        <View style={{ position: 'absolute', left: 0, right: 0, height: 100, top: 10 }}>
          {gridLines}
        </View>
        {/* Bars */}
        {data.map((d, idx) => (
          <View key={d.label} style={{ alignItems: 'center', marginHorizontal: 4, justifyContent: 'flex-end' }}>
            {/* Value label above bar */}
            <Text style={{
              fontSize: 11,
              color: '#1976d2',
              fontWeight: 'bold',
              marginBottom: 2,
              minHeight: 16,
            }}>
              {d.value > 0 ? d.value : ''}
            </Text>
            {/* Bar */}
            <Animated.View
              style={{
                width: barWidth,
                height: animatedValues[idx],
                backgroundColor: barColor,
                borderRadius: 8,
                shadowColor: '#1976d2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 4,
                elevation: 3,
                marginBottom: 4,
                justifyContent: 'flex-end',
                alignItems: 'center',
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            />
            {/* X-axis label */}
            <Text style={{
              fontSize: 10,
              color: '#888',
              maxWidth: barWidth + 8,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
      {/* X-axis line */}
      <View style={{
        height: 1,
        backgroundColor: axisColor,
        width: '100%',
        marginTop: 2,
        marginLeft: 36,
      }} />
    </View>
  );
};


// Utility: Assign steps to 4-hour slots considering both start and end date
function aggregateStepsBy4HourSlot(rawSteps) {
  // 6 slots: 0-4, 4-8, ..., 20-24
  const slots = Array(6).fill(0);
  const slotLabels = [
    '0-4',
    '4-8',
    '8-12',
    '12-16',
    '16-20',
    '20-24'
  ];

  rawSteps.forEach(rs => {
    if (typeof rs.startDate === 'number' && typeof rs.endDate === 'number' && typeof rs.steps === 'number') {
      const start = new Date(rs.startDate);
      const end = new Date(rs.endDate);
      const totalDuration = end - start;
      if (totalDuration <= 0) return;

      // Distribute steps proportionally to each slot the interval overlaps
      let curr = new Date(start);
      while (curr < end) {
        const slotIdx = Math.floor(curr.getHours() / 4);
        if (slotIdx < 0 || slotIdx >= slots.length) break; // Prevent out-of-bounds
        // End of current slot
        const slotEnd = new Date(curr);
        slotEnd.setHours((Math.floor(curr.getHours() / 4) + 1) * 4, 0, 0, 0);
        const overlapEnd = slotEnd < end ? slotEnd : end;
        const overlapDuration = overlapEnd - curr;
        const stepsForSlot = rs.steps * (overlapDuration / totalDuration);
        slots[slotIdx] += stepsForSlot;
        curr = overlapEnd;
      }
    }
  });

  // Round steps for display
  return slots.map((value, idx) => ({
    label: slotLabels[idx],
    value: Math.round(value)
  }));
}

const GoogleFitApi = () => {
  const {
    authorized,
    isLoading,
    fitnessData,
    stepsSummary,
    authorizeGoogleFit,
    disconnectGoogleFit,
    fetchFitnessSummary,
  } = useGoogleFit();

  const [activityLog, setActivityLog] = useState([]);
  const [weeklyLog, setWeeklyLog] = useState([]);
  const [monthlyLog, setMonthlyLog] = useState([]);
  const [activityTab, setActivityTab] = useState('day'); // 'day' | 'week' | 'month'
  const [intradayLog, setIntradayLog] = useState([]);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  // Fetch intraday steps for selected day
  useEffect(() => {
    const fetchIntradaySteps = async () => {
      if (!authorized) {
        setIntradayLog([]);
        return;
      }
      try {
        const start = new Date(selectedDay + 'T00:00:00');
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const options = {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          bucketUnit: 'HOUR',
          bucketInterval: 1,
        };
        const samples = await require('react-native-google-fit').default.getDailyStepCountSamples(options);
        let slotData = [];
        if (Array.isArray(samples)) {
          let preferredSample = samples.find(
            s => s.source === 'com.google.android.gms:estimated_steps'
          );
          if (!preferredSample && samples.length > 0) {
            preferredSample = samples[0];
          }
          // Prefer rawSteps if available, otherwise fallback to steps
          if (preferredSample && Array.isArray(preferredSample.rawSteps) && preferredSample.rawSteps.length > 0) {
            slotData = aggregateStepsBy4HourSlot(preferredSample.rawSteps);
          } else if (preferredSample && Array.isArray(preferredSample.steps)) {
            // fallback: group by slot using step.startDate
            const stepsArr = preferredSample.steps.map(s => ({
              startDate: typeof s.startDate === 'string' ? new Date(s.startDate).getTime() : undefined,
              endDate: typeof s.endDate === 'string' ? new Date(s.endDate).getTime() : undefined,
              steps: s.value || 0,
            })).filter(s => s.startDate && s.endDate && s.steps);
            slotData = aggregateStepsBy4HourSlot(stepsArr);
          }
        }
        setIntradayLog(slotData);
      } catch (e) {
        setIntradayLog([]);
      }
    };
    if (activityTab === 'day') fetchIntradaySteps();
  }, [authorized, selectedDay, activityTab]);

  // Fetch last 7 days steps for "My Activity"
  useEffect(() => {
    const fetchLast7DaysSteps = async () => {
      if (!authorized) {
        setActivityLog([]);
        setWeeklyLog([]);
        setMonthlyLog([]);
        return;
      }
      try {
        // --- Day wise (last 7 days) ---
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const options = {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          bucketUnit: 'DAY',
          bucketInterval: 1,
        };
        const samples = await require('react-native-google-fit').default.getDailyStepCountSamples(options);

        let stepsArr = [];
        if (Array.isArray(samples)) {
          let preferredSample = samples.find(
            s => s.source === 'com.google.android.gms:estimated_steps'
          );
          if (!preferredSample && samples.length > 0) {
            preferredSample = samples[0];
          }
          if (preferredSample && Array.isArray(preferredSample.steps)) {
            stepsArr = preferredSample.steps.map(s => ({
              date: s.date?.slice(0, 10),
              value: s.value || 0,
            }));
          }
        }
        // Remove duplicates by date
        const stepsByDate = {};
        for (const s of stepsArr) {
          if (!s.date) continue;
          stepsByDate[s.date] = s.value;
        }
        const resultArr = Object.entries(stepsByDate)
          .map(([date, value]) => ({
            label: new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            value,
            date,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setActivityLog(resultArr.slice(-7));

        // --- Week wise (last 8 weeks) ---
        const weekLogs = [];
        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          const weekOptions = {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
            bucketUnit: 'WEEK',
            bucketInterval: 1,
          };
          const weekSamples = await require('react-native-google-fit').default.getDailyStepCountSamples(weekOptions);
          let weekSteps = 0;
          if (Array.isArray(weekSamples)) {
            let preferredSample = weekSamples.find(
              s => s.source === 'com.google.android.gms:estimated_steps'
            );
            if (!preferredSample && weekSamples.length > 0) {
              preferredSample = weekSamples[0];
            }
            if (preferredSample && Array.isArray(preferredSample.steps)) {
              for (const s of preferredSample.steps) {
                weekSteps += s.value || 0;
              }
            }
          }
          weekLogs.push({
            label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            value: weekSteps,
          });
        }
        setWeeklyLog(weekLogs);

        // --- Month wise (last 6 months) ---
        const monthLogs = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
          const monthOptions = {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString(),
            bucketUnit: 'MONTH',
            bucketInterval: 1,
          };
          const monthSamples = await require('react-native-google-fit').default.getDailyStepCountSamples(monthOptions);
          let monthSteps = 0;
          if (Array.isArray(monthSamples)) {
            let preferredSample = monthSamples.find(
              s => s.source === 'com.google.android.gms:estimated_steps'
            );
            if (!preferredSample && monthSamples.length > 0) {
              preferredSample = monthSamples[0];
            }
            if (preferredSample && Array.isArray(preferredSample.steps)) {
              for (const s of preferredSample.steps) {
                monthSteps += s.value || 0;
              }
            }
          }
          monthLogs.push({
            label: `${monthStart.toLocaleString(undefined, { month: 'short' })} '${String(monthStart.getFullYear()).slice(-2)}`,
            value: monthSteps,
          });
        }
        setMonthlyLog(monthLogs);

      } catch (e) {
        setActivityLog([]);
        setWeeklyLog([]);
        setMonthlyLog([]);
      }
    };
    fetchLast7DaysSteps();
  }, [authorized, fitnessData]);

  const navigation = useNavigation();

  const handleConnect = async () => {
    // First check for permissions
    try {
      const { PermissionsAndroid } = require('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Activity Recognition Permission',
          message: 'We need access to track your physical activity to connect with Google Fit.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Proceed with Google Fit connection
        const result = await authorizeGoogleFit({ forceAccountSelection: true });
        if (!result.success) {
          Alert.alert(
            'Google Fit Connection Failed',
            result.message || 'Unknown error'
          );
        } else {
          Alert.alert('Success', 'Successfully connected to Google Fit!');
        }
      } else {
        Alert.alert(
          'Permission Denied',
          'We need activity recognition permission to track your steps and fitness data.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Error',
        'Failed to request permissions: ' + (err.message || 'Unknown error')
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f8fa', paddingTop: 24 }}>
      {/* Header with back navigation */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
          <Icon name="arrow-back" size={28} color="#1976d2" />
        </TouchableOpacity>
        <Image
          source={images.google_fitness_fit_app_logo}
          style={{ width: 32, height: 32, marginRight: 8, marginLeft: 8 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1976d2', alignItems: 'flex-start', marginLeft: 8, flex: 1 }}>Google Fit</Text>
      </View>

      {isLoading ? (
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 }}>Processing...</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{
            alignItems: 'center',
            paddingBottom: 40,
            flexGrow: 1,
            minHeight: '100%',
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 16, marginBottom: 24, color: '#666' }}>
            Status:{' '}
            <Text style={{ fontWeight: 'bold', color: authorized ? '#388e3c' : '#d32f2f' }}>
              {authorized ? 'Connected' : 'Not Connected'}
            </Text>
          </Text>

          {authorized && fitnessData && (
            <View style={{ 
              backgroundColor: 'white', 
              borderRadius: 20, 
              padding: 24, 
              marginBottom: 32, 
              width: '95%', 
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24 }}>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>Steps</Text>
                  <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1976d2' }}>{fitnessData.steps}</Text>
                  <Text style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>steps</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>Calories</Text>
                  <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1976d2' }}>{fitnessData.calories}</Text>
                  <Text style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>kcal</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 15, color: '#888', marginBottom: 4 }}>Distance</Text>
                  <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1976d2' }}>{fitnessData.distanceKm}</Text>
                  <Text style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>km</Text>
                </View>
              </View>
              {/* Steps summary day/week/month */}
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: 'bold' }}>Steps Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#1976d2', fontWeight: 'bold' }}>{stepsSummary?.day || 0}</Text>
                    <Text style={{ fontSize: 12, color: '#888' }}>Today</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#1976d2', fontWeight: 'bold' }}>{stepsSummary?.week || 0}</Text>
                    <Text style={{ fontSize: 12, color: '#888' }}>This Week</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#1976d2', fontWeight: 'bold' }}>{stepsSummary?.month || 0}</Text>
                    <Text style={{ fontSize: 12, color: '#888' }}>This Month</Text>
                  </View>
                </View>
              </View>
              <View style={{ width: '100%', marginBottom: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Daily Goal Progress</Text>
                <View style={{ width: '90%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: '#1976d2',
                      borderRadius: 4,
                      width: `${Math.min((fitnessData.steps / 10000) * 100, 100)}%`
                    }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: '#1976d2', fontWeight: 'bold' }}>
                  {Math.min(fitnessData.steps, 10000)}/10000 steps
                </Text>
              </View>
              <View style={{ width: '100%', backgroundColor: '#f1f8e9', borderRadius: 12, padding: 12, marginTop: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#388e3c', marginBottom: 8, fontSize: 15 }}>Tips</Text>
                <Text style={{ color: '#388e3c', fontSize: 12, marginBottom: 4 }}>
                  • Aim for at least 10,000 steps per day for optimal health.
                </Text>
                <Text style={{ color: '#388e3c', fontSize: 12, marginBottom: 4 }}>
                  • Stay hydrated and take regular breaks to stretch.
                </Text>
                <Text style={{ color: '#388e3c', fontSize: 12, marginBottom: 4 }}>
                  • Your data syncs automatically every minute.
                </Text>
              </View>
            </View>
          )}

          {/* My Activity Section */}
          {authorized && (
            <>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginBottom: 12, alignSelf: 'flex-start', marginLeft: 16 }}>My Activity</Text>
              {/* Professional Tabs and Date Selector */}
              <View style={{ width: '95%', flexDirection: 'row', justifyContent: 'center', marginBottom: 12, alignSelf: 'center' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: '#f4f6fb',
                    borderRadius: 24,
                    padding: 4,
                    shadowColor: '#1976d2',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.07,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {['day', 'week', 'month'].map(tab => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setActivityTab(tab)}
                      style={{
                        backgroundColor: activityTab === tab ? '#1976d2' : 'transparent',
                        borderRadius: 20,
                        paddingVertical: 8,
                        paddingHorizontal: 18,
                        marginHorizontal: 2,
                        minWidth: 80,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: activityTab === tab ? '#1976d2' : undefined,
                        shadowOpacity: activityTab === tab ? 0.12 : 0,
                        shadowRadius: activityTab === tab ? 4 : 0,
                        elevation: activityTab === tab ? 2 : 0,
                        borderWidth: activityTab === tab ? 0 : 1,
                        borderColor: activityTab === tab ? 'transparent' : '#dbeafe',
                        transitionDuration: '200ms',
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={{
                          color: activityTab === tab ? '#fff' : '#1976d2',
                          fontWeight: 'bold',
                          fontSize: 13,
                          letterSpacing: 0.2,
                        }}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {activityTab === 'day' && (
                <View
                  style={{
                    backgroundColor: '#f4f6fb',
                    borderRadius: 16,
                    alignItems: 'center',
                    paddingVertical: 8,
                    marginBottom: 16,
                    shadowColor: '#1976d2',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.07,
                    shadowRadius: 4,
                    elevation: 1,
                    width: '95%',
                    alignSelf: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      const prev = new Date(selectedDay);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDay(prev.toISOString().slice(0, 10));
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="chevron-left" size={26} color="#1976d2" />
                  </TouchableOpacity>
                  <Text
                    style={{
                      marginHorizontal: 10,
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#1976d2',
                      letterSpacing: 0.2,
                      minWidth: 120,
                      textAlign: 'center',
                    }}
                  >
                    {new Date(selectedDay).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const next = new Date(selectedDay);
                      next.setDate(next.getDate() + 1);
                      const todayStr = new Date().toISOString().slice(0, 10);
                      if (next.toISOString().slice(0, 10) <= todayStr) {
                        setSelectedDay(next.toISOString().slice(0, 10));
                      }
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="chevron-right" size={26} color="#1976d2" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ width: '95%', height: 200, backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                {/* Bar Graph */}
                {activityTab === 'day' && <BarGraph data={intradayLog} label="Day" />}
                {activityTab === 'week' && <BarGraph data={weeklyLog} label="Week" />}
                {activityTab === 'month' && <BarGraph data={monthlyLog} label="Month" />}
                {/* Fallback if no data */}
                {(activityTab === 'day' && intradayLog.length === 0) ||
                (activityTab === 'week' && weeklyLog.length === 0) ||
                (activityTab === 'month' && monthlyLog.length === 0) ? (
                  <Text style={{ fontSize: 12, color: '#888' }}>No activity data.</Text>
                ) : null}
              </View>
            </>
          )}

          {!authorized ? (
            <View style={{ width: '80%', alignSelf: 'center' }}>
              <CustomButton
                title="Connect to Google Fit"
                onPress={handleConnect}
                color="#1976d2"
                disabled={isLoading}
              />
            </View>
          ) : (
            <View style={{ marginTop: 24, width: '80%', alignSelf: 'center' }}>
              <CustomButton
                title="Disconnect"
                onPress={disconnectGoogleFit}
                color="#ff6b6b"
                disabled={isLoading}
              />
            </View>
          )}
          {/* Add bottom space for better scroll experience */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default GoogleFitApi;

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { throttle } from 'lodash'; // Add this import
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import EventSource from 'react-native-event-source';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTheme } from '../../context/ThemeContext';

const API_URL = "https://trackeatfit.onrender.com";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Move helper functions to the top, before they're used
const calculateLevelProgress = (currentXP, targetLevel, levels) => {
  const currentLevel = levels[targetLevel - 1];
  const nextLevel = levels[targetLevel];
  if (!nextLevel) return 100; // Max level reached

  const xpForCurrentLevel = currentLevel.xp;
  const xpForNextLevel = nextLevel.xp;
  const xpRequired = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = currentXP - xpForCurrentLevel;

  return Math.max(0, Math.min(Math.round((xpProgress / xpRequired) * 100), 100));
};

// Update the createAchievementObject function to handle 100% progress
const createAchievementObject = (title, description, type, category, icon, progress, isUnlocked) => ({
  title,
  description,
  type,
  category,
  icon,
  progress: Math.min(Math.round(progress), 100),
  isUnlocked: isUnlocked || Math.round(progress) >= 100  // Auto unlock at 100%
});

// Utility styles for dark/light mode and achievement states
const styles = {
  card: (isDarkMode, isUnlocked) => ({
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDarkMode
      ? isUnlocked ? '#1f2937' : 'rgba(31,41,55,0.5)'
      : isUnlocked ? '#ecfdf5' : '#f9fafb',
    borderWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#d1d5db',
  }),
  iconCircle: (isDarkMode, isUnlocked) => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode
      ? isUnlocked ? 'rgba(6,95,70,0.3)' : '#374151'
      : isUnlocked ? '#d1fae5' : '#f3f4f6',
  }),
  cardTitle: (isDarkMode, isUnlocked) => ({
    fontWeight: 'bold',
    color: isDarkMode
      ? isUnlocked ? '#e5e7eb' : '#9ca3af'
      : isUnlocked ? '#111827' : '#9ca3af',
  }),
  cardDesc: (isDarkMode, isUnlocked) => ({
    fontSize: 14,
    marginTop: 4,
    color: isDarkMode
      ? isUnlocked ? '#9ca3af' : '#6b7280'
      : isUnlocked ? '#4b5563' : '#9ca3af',
  }),
  progressBarBg: isDarkMode => ({
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
    marginTop: 12,
  }),
  progressBarFill: (isDarkMode, isUnlocked, progressValue) => ({
    height: '100%',
    width: `${progressValue}%`,
    backgroundColor: isUnlocked
      ? isDarkMode ? '#059669' : '#10b981'
      : isDarkMode ? '#4b5563' : '#d1d5db',
    borderRadius: 8,
  }),
  progressText: isDarkMode => ({
    fontSize: 12,
    marginTop: 4,
    color: isDarkMode ? '#9ca3af' : '#6b7280',
  }),
  checkCircle: isDarkMode => ({
    borderRadius: 999,
    padding: 4,
    marginLeft: 8,
    backgroundColor: isDarkMode ? '#059669' : '#10b981',
  }),
  header: isDarkMode => ({
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#d1d5db',
  }),
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: isDarkMode => ({
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: isDarkMode ? '#e5e7eb' : '#111827',
  }),
  statsOverview: isDarkMode => ({
    padding: 16,
    borderBottomWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#d1d5db',
  }),
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsNum: (isDarkMode, color) => ({
    fontSize: 24,
    fontWeight: 'bold',
    color: color || (isDarkMode ? '#e5e7eb' : '#111827'),
  }),
  statsLabel: isDarkMode => ({
    color: isDarkMode ? '#9ca3af' : '#4b5563',
  }),
  skeletonCard: isDarkMode => ({
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDarkMode ? 'rgba(31,41,55,0.5)' : '#f3f4f6',
    borderWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#d1d5db',
  }),
  skeletonIcon: isDarkMode => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
  }),
  skeletonTitle: isDarkMode => ({
    height: 16,
    width: 128,
    borderRadius: 4,
    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
  }),
  skeletonDesc: isDarkMode => ({
    height: 12,
    width: 96,
    borderRadius: 4,
    backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
    marginTop: 8,
  }),
  skeletonBar: (isDarkMode, width) => ({
    height: 8,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
    marginTop: 16,
    width,
  }),
  scrollView: isDarkMode => ({
    flex: 1,
    padding: 16,
    backgroundColor: isDarkMode ? '#111827' : '#fff',
  }),
  safeArea: isDarkMode => ({
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#fff',
  }),
};

// Optimize the AchievementCard to prevent unnecessary re-renders
const AchievementCard = memo(({ title, description, icon, progress, isUnlocked, style }) => {
  const { isDarkMode } = useTheme();
  const progressValue = useMemo(() => Math.min(Math.round(progress), 100), [progress]);
  return (
    <View style={[styles.card(isDarkMode, isUnlocked), style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconCircle(isDarkMode, isUnlocked)}>
              <MaterialCommunityIcons
                name={icon}
                size={24}
                color={
                  isUnlocked
                    ? isDarkMode ? '#34d399' : '#059669'
                    : isDarkMode ? '#6B7280' : '#9CA3AF'
                }
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle(isDarkMode, isUnlocked)}>
                {title}
              </Text>
              <Text style={styles.cardDesc(isDarkMode, isUnlocked)}>
                {description}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg(isDarkMode)}>
            <View style={styles.progressBarFill(isDarkMode, isUnlocked, progressValue)} />
          </View>
          <Text style={styles.progressText(isDarkMode)}>
            {progressValue}% Complete
          </Text>
        </View>
        {isUnlocked && (
          <View style={styles.checkCircle(isDarkMode)}>
            <MaterialCommunityIcons name="check" size={16} color="white" />
          </View>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return prevProps.isUnlocked === nextProps.isUnlocked && 
         Math.round(prevProps.progress) === Math.round(nextProps.progress);
});

// Optimize achievement calculations using useMemo
const useAchievementCalculations = (foodStats, user, levels) => {
  return useMemo(() => ({
    loggingAchievements: [
      // Move logging achievements calculation here
      createAchievementObject(
        'First Steps',
        'Log your first meal',
        'meals',
        'logging',
        'silverware',
        Math.min(Math.round((foodStats.totalMeals / 1) * 100), 100),
        foodStats.totalMeals >= 1
      ),
      createAchievementObject(
        'Regular Logger',
        'Log meals for 3 different days',
        'meals',
        'logging',
        'notebook',
        Math.min(Math.round((foodStats.daysLogged / 3) * 100), 100),
        foodStats.daysLogged >= 3
      ),
      createAchievementObject(
        'Consistent Tracker',
        'Log meals for 7 different days',
        'meals',
        'logging',
        'calendar-check',
        Math.min(Math.round((foodStats.daysLogged / 7) * 100), 100),
        foodStats.daysLogged >= 7
      ),
      createAchievementObject(
        'Dedicated Logger',
        'Log meals for 14 different days',
        'meals',
        'logging',
        'calendar-range',
        Math.min(Math.round((foodStats.daysLogged / 14) * 100), 100),
        foodStats.daysLogged >= 14
      ),
      createAchievementObject(
        'Meal Master',
        'Log meals for 30 different days',
        'meals',
        'logging',
        'calendar-month',
        Math.min(Math.round((foodStats.daysLogged / 30) * 100), 100),
        foodStats.daysLogged >= 30
      ),
      createAchievementObject(
        'Getting Started',
        'Log 10 total meals',
        'meals',
        'logging',
        'food',
        Math.min(Math.round((foodStats.totalMeals / 10) * 100), 100),
        foodStats.totalMeals >= 10
      ),
      createAchievementObject(
        'Food Explorer',
        'Log 50 total meals',
        'meals',
        'logging',
        'food-variant',
        Math.min(Math.round((foodStats.totalMeals / 50) * 100), 100),
        foodStats.totalMeals >= 50
      ),
      createAchievementObject(
        'Century Club',
        'Log 100 total meals',
        'meals',
        'logging',
        'food-fork-drink',
        Math.min(Math.round((foodStats.totalMeals / 100) * 100), 100),
        foodStats.totalMeals >= 100
      ),
      createAchievementObject(
        'Food Fanatic',
        'Log 200 total meals',
        'meals',
        'logging',
        'chef-hat',
        Math.min(Math.round((foodStats.totalMeals / 200) * 100), 100),
        foodStats.totalMeals >= 200
      ),
      createAchievementObject(
        'Nutrition Master',
        'Log 500 total meals',
        'meals',
        'logging',
        'trophy-variant',
        Math.min(Math.round((foodStats.totalMeals / 500) * 100), 100),
        foodStats.totalMeals >= 500
      ),
      createAchievementObject(
        'Balance Keeper',
        'Average 2+ meals per day',
        'meals',
        'logging',
        'scale-balance',
        Math.min(Math.round((foodStats.averagePerDay / 2) * 100), 100),
        foodStats.averagePerDay >= 2 && foodStats.daysLogged >= 7
      ),
      createAchievementObject(
        'Consistency King',
        'Average 3+ meals per day',
        'meals',
        'logging',
        'crown',
        Math.min(Math.round((foodStats.averagePerDay / 3) * 100), 100),
        foodStats.averagePerDay >= 3 && foodStats.daysLogged >= 7
      ),
      createAchievementObject(
        'Meal Perfectionist',
        'Average 4+ meals per day',
        'meals',
        'logging',
        'star-circle',
        Math.min(Math.round((foodStats.averagePerDay / 4) * 100), 100),
        foodStats.averagePerDay >= 4 && foodStats.daysLogged >= 7
      )
    ],
    achievementsWithLevels: [
      // Move level achievements calculation here
      {
        title: 'First Week Warrior',
        description: 'Log meals for 7 consecutive days',
        icon: 'calendar-check',
        progress: Math.min(Math.round((user?.streak || 0) * (100/7)), 100),
        isUnlocked: (user?.streak || 0) >= 7
      },
      {
        title: 'Two-Week Triumph',
        description: 'Maintain streak for 14 consecutive days',
        icon: 'calendar-week',
        progress: Math.min(Math.round((user?.streak || 0) * (100/14)), 100),
        isUnlocked: (user?.streak || 0) >= 14
      },
      {
        title: 'Three-Week Champion',
        description: 'Keep logging for 21 consecutive days',
        icon: 'calendar-star',
        progress: Math.min(Math.round((user?.streak || 0) * (100/21)), 100),
        isUnlocked: (user?.streak || 0) >= 21
      },
      {
        title: 'Four-Week Master',
        description: 'Complete a 28-day streak',
        icon: 'calendar-clock',
        progress: Math.min(Math.round((user?.streak || 0) * (100/28)), 100),
        isUnlocked: (user?.streak || 0) >= 28
      },
      {
        title: 'Monthly Milestone',
        description: 'Achieve a 30-day perfect streak',
        icon: 'trophy',
        progress: Math.min(Math.round((user?.streak || 0) * (100/30)), 100),
        isUnlocked: (user?.streak || 0) >= 30
      },
      {
        title: 'Starting Fresh',
        description: `Reach Level 1: ${levels[0].status}`,
        icon: 'sprout',
        progress: 100, // Always completed as it's starting level
        isUnlocked: true
      },
      {
        title: 'Explorer\'s Spirit',
        description: `Reach Level 2: ${levels[1].status}`,
        icon: 'compass',
        progress: (user?.xp || 0) >= levels[1].xp ? 100 : calculateLevelProgress(user?.xp || 0, 1, levels),
        isUnlocked: (user?.xp || 0) >= levels[1].xp
      },
      {
        title: 'Seeker\'s Path',
        description: `Reach Level 3: ${levels[2].status}`,
        icon: 'map-marker-path',
        progress: (user?.xp || 0) >= levels[2].xp ? 100 : calculateLevelProgress(user?.xp || 0, 2, levels),
        isUnlocked: (user?.xp || 0) >= levels[2].xp
      },
      {
        title: 'Fitness Journey',
        description: `Reach Level 4: ${levels[3].status}`,
        icon: 'run-fast',
        progress: (user?.xp || 0) >= levels[3].xp ? 100 : calculateLevelProgress(user?.xp || 0, 3, levels),
        isUnlocked: (user?.xp || 0) >= levels[3].xp
      },
      {
        title: 'Health Champion',
        description: `Reach Level 5: ${levels[4].status}`,
        icon: 'shield-star',
        progress: (user?.xp || 0) >= levels[4].xp ? 100 : calculateLevelProgress(user?.xp || 0, 4, levels),
        isUnlocked: (user?.xp || 0) >= levels[4].xp
      },
      {
        title: 'Nutrition Professional',
        description: `Reach Level 6: ${levels[5].status}`,
        icon: 'certificate',
        progress: (user?.xp || 0) >= levels[5].xp ? 100 : calculateLevelProgress(user?.xp || 0, 5, levels),
        isUnlocked: (user?.xp || 0) >= levels[5].xp
      },
      {
        title: 'Wellness Warrior',
        description: `Reach Level 7: ${levels[6].status}`,
        icon: 'sword',
        progress: (user?.xp || 0) >= levels[6].xp ? 100 : calculateLevelProgress(user?.xp || 0, 6, levels),
        isUnlocked: (user?.xp || 0) >= levels[6].xp
      },
      {
        title: 'Expert Status',
        description: `Reach Level 8: ${levels[7].status}`,
        icon: 'star-circle',
        progress: (user?.xp || 0) >= levels[7].xp ? 100 : calculateLevelProgress(user?.xp || 0, 7, levels),
        isUnlocked: (user?.xp || 0) >= levels[7].xp
      },
      {
        title: 'Elite Achievement',
        description: `Reach Level 9: ${levels[8].status}`,
        icon: 'crown',
        progress: (user?.xp || 0) >= levels[8].xp ? 100 : calculateLevelProgress(user?.xp || 0, 8, levels),
        isUnlocked: (user?.xp || 0) >= levels[8].xp
      },
      {
        title: 'Wellness Master',
        description: `Reach Level 10: ${levels[9].status}`,
        icon: 'trophy-variant',
        progress: (user?.xp || 0) >= levels[9].xp ? 100 : calculateLevelProgress(user?.xp || 0, 9, levels),
        isUnlocked: (user?.xp || 0) >= levels[9].xp
      }
    ]
  }), [foodStats, user?.streak, user?.xp, levels]);
};

// Add a simple skeleton loader for achievements
const AchievementSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <View style={styles.skeletonCard(isDarkMode)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.skeletonIcon(isDarkMode)} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <View style={styles.skeletonTitle(isDarkMode)} />
          <View style={styles.skeletonDesc(isDarkMode)} />
        </View>
      </View>
      <View style={styles.skeletonBar(isDarkMode, '100%')} />
      <View style={styles.skeletonBar(isDarkMode, '60%')} />
    </View>
  );
};

// Add a skeleton loader for stats overview
const StatsOverviewSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <View style={styles.statsOverview(isDarkMode)}>
      <View style={styles.statsRow}>
        {[1, 2, 3].map(i => (
          <View style={styles.statsItem} key={i}>
            <View style={styles.skeletonBar(isDarkMode, 40)} />
            <View style={styles.skeletonBar(isDarkMode, 56)} />
          </View>
        ))}
      </View>
    </View>
  );
};

const Achievements = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { user } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const [foodStats, setFoodStats] = useState({
    totalMeals: 0,
    daysLogged: 0,
    averagePerDay: 0,
    firstLogDate: null,
    lastLogDate: null
  });
  const [userAchievements, setUserAchievements] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const pendingUpdates = useRef(new Set());
  const lastEventId = useRef('');

  // Add processing state and debounce
  const debouncedAchievements = useDebounce(userAchievements, 300);

  // Add function to fetch food statistics
  useEffect(() => {
    const fetchFoodStats = async () => {
      if (!user?._id) return;

      try {
        setLoading(true); // Start loading
        const response = await fetch(
          `${API_URL}/logged-food/get-all-logged-food/${user._id}`
        );

        // Check if response is ok and content type is JSON
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Received non-JSON response from server");
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Food stats received:', data.summary); // Debug log
          setFoodStats({
            totalMeals: data.summary.totalMeals || 0,
            daysLogged: data.summary.daysLogged || 0,
            averagePerDay: parseFloat(data.summary.averagePerDay) || 0,
            firstLogDate: data.summary.firstLogDate,
            lastLogDate: data.summary.lastLogDate
          });
        } else {
          console.warn('Server returned success: false', data);
        }
      } catch (error) {
        console.error('Error fetching food stats:', error);
        // Set default values on error
        setFoodStats({
          totalMeals: 0,
          daysLogged: 0,
          averagePerDay: 0,
          firstLogDate: null,
          lastLogDate: null
        });
      } finally {
        setLoading(false); // End loading after fetch
      }
    };

    fetchFoodStats();
  }, [user?._id]);

  // Add useEffect for SSE connection
  useEffect(() => {
    let eventSource;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${API_URL}/logged-food/events`);

        eventSource.onopen = () => {
          console.log('SSE Connection opened for achievements');
          retryCount = 0;
        };

        eventSource.addEventListener('logged-food', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Achievement SSE event received:', data);

            // Only update foodStats if changed
            if (data.type === 'stats-update' && data.userId === user?._id) {
              const newStats = {
                totalMeals: data.summary.totalMeals || 0,
                daysLogged: data.summary.daysLogged || 0,
                averagePerDay: parseFloat(data.summary.averagePerDay) || 0,
                firstLogDate: data.summary.firstLogDate,
                lastLogDate: data.summary.lastLogDate
              };
              setFoodStats(prevStats => {
                // Compare all fields, only update if changed
                if (
                  prevStats.totalMeals !== newStats.totalMeals ||
                  prevStats.daysLogged !== newStats.daysLogged ||
                  prevStats.averagePerDay !== newStats.averagePerDay ||
                  prevStats.firstLogDate !== newStats.firstLogDate ||
                  prevStats.lastLogDate !== newStats.lastLogDate
                ) {
                  return newStats;
                }
                return prevStats;
              });
            }
          } catch (error) {
            console.error('Error handling achievement SSE event:', error);
          }
        });

        eventSource.onerror = (error) => {
          console.error('Achievement SSE Error:', error);
          eventSource.close();

          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying achievement SSE connection (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
            setTimeout(connectSSE, retryDelay);
          } else {
            console.error('Max retries reached for achievement SSE connection');
          }
        };

      } catch (error) {
        console.error('Error creating Achievement EventSource:', error);
      }
    };

    if (user?._id) {
      connectSSE();
    }

    return () => {
      if (eventSource) {
        try {
          eventSource.close();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, [user?._id]);

  // Add function to initialize achievements
  useEffect(() => {
    const initializeAchievements = async () => {
      if (!user?._id) return;

      try {
        setLoading(true); // Start loading
        const response = await fetch(`${API_URL}/achievements/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user._id })
        });

        if (!response.ok) throw new Error('Failed to initialize achievements');
        
        const data = await response.json();
        if (data.achievements?.achievements) {
          // Normalize the data structure
          const normalizedAchievements = data.achievements.achievements.map(achievement => ({
            title: achievement.title,
            description: achievement.description,
            type: achievement.type || 'meals',
            icon: achievement.icon,
            isUnlocked: achievement.isUnlocked || false,
            unlockedAt: achievement.unlockedAt || null,
            _id: achievement._id
          }));
          setUserAchievements(normalizedAchievements);
        }
      } catch (error) {
        console.error('Error initializing achievements:', error);
      } finally {
        setLoading(false); // End loading after fetch
      }
    };

    initializeAchievements();
  }, [user?._id]);

  // Update the achievement progress function with better error handling
  const updateAchievementProgress = async (achievement) => {
    if (!achievement.isUnlocked) return;

    try {
      const achievementData = {
        userId: user._id,
        achievementTitle: achievement.title,
        description: achievement.description,
        type: achievement.type || 'meals',
        icon: achievement.icon
      };

      const response = await fetch(`${API_URL}/achievements/update-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(achievementData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update achievement');
      }

      if (data.success) {
        setUserAchievements(prev => [
          ...prev.filter(a => a.title !== achievement.title),
          data.achievement
        ]);
      }
    } catch (error) {
      console.error(`Error saving achievement ${achievement.title}:`, error);
    }
  };

  // Add SSE listener for achievement updates
  useEffect(() => {
    let eventSource;
    let isSubscribed = true;

    if (user?._id) {
      eventSource = new EventSource(`${API_URL}/achievements/events`);

      const handleEvent = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!isSubscribed || data.userId !== user._id) return;
          
          console.log('Achievement event received:', data);
          
          switch (data.type) {
            case 'init':
              if (data.achievements?.achievements) {
                const normalizedAchievements = data.achievements.achievements.map(achievement => ({
                  title: achievement.title,
                  description: achievement.description,
                  type: achievement.type || 'meals',
                  icon: achievement.icon,
                  isUnlocked: achievement.isUnlocked || false,
                  unlockedAt: achievement.unlockedAt || null,
                  _id: achievement._id
                }));
                setUserAchievements(normalizedAchievements);
              }
              break;

            case 'achievement-unlocked':
              if (data.achievement) {
                setUserAchievements(prev => {
                  const index = prev.findIndex(a => a._id === data.achievement._id);
                  if (index === -1) return [...prev, data.achievement];
                  
                  const updated = [...prev];
                  updated[index] = {
                    ...updated[index],
                    ...data.achievement,
                    isUnlocked: true,
                    unlockedAt: new Date().toISOString()
                  };
                  return updated;
                });
              }
              break;
          }
        } catch (error) {
          console.error('Error handling achievement event:', error);
        }
      };

      eventSource.addEventListener('achievements', handleEvent);
    }

    return () => {
      isSubscribed = false;
      if (eventSource) {
        try {
          eventSource.close();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, [user?._id]);

  const levels = [
    { level: 1, xp: 0, status: 'Nutrition Novice', color: '#9ca3af' },
    { level: 2, xp: 50, status: 'Health Explorer', color: '#60a5fa' },
    { level: 3, xp: 100, status: 'Wellness Seeker', color: '#34d399' },
    { level: 4, xp: 200, status: 'Fitness Enthusiast', color: '#a78bfa' },
    { level: 5, xp: 350, status: 'Health Champion', color: '#f59e0b' },
    { level: 6, xp: 550, status: 'Nutrition Pro', color: '#ec4899' },
    { level: 7, xp: 800, status: 'Wellness Warrior', color: '#6366f1' },
    { level: 8, xp: 1100, status: 'Health Expert', color: '#8b5cf6' },
    { level: 9, xp: 1450, status: 'Elite Achiever', color: '#ef4444' },
    { level: 10, xp: 1850, status: 'Wellness Master', color: '#f59e0b' }
  ];

  const { loggingAchievements, achievementsWithLevels } = useAchievementCalculations(
    foodStats,
    user,
    levels
  );

  // Update processedAchievements to ensure unlocking at 100%
  const processedAchievements = useMemo(() => {
    if (!debouncedAchievements.length && !loggingAchievements.length) return [];
    
    return [
      ...loggingAchievements,
      ...achievementsWithLevels
    ].map(achievement => {
      const savedAchievement = debouncedAchievements.find(a => a.title === achievement.title);
      const progress = Math.round(achievement.progress);
      return {
        ...achievement,
        progress,
        isUnlocked: savedAchievement?.isUnlocked || progress >= 100,  // Force unlock at 100%
        unlockedAt: savedAchievement?.unlockedAt || (progress >= 100 ? new Date().toISOString() : null),
        _id: savedAchievement?._id || achievement.title
      };
    });
  }, [loggingAchievements, achievementsWithLevels, debouncedAchievements]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    const unlockedCount = processedAchievements.filter(a => a.isUnlocked).length;
    const totalCount = processedAchievements.length;
    const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

    return {
      unlockedCount,
      totalCount,
      completionPercentage
    };
  }, [processedAchievements]);

  // Separate Stats Overview component
  const StatsOverview = memo(({ stats }) => {
    const { isDarkMode } = useTheme();
    return (
      <View style={styles.statsOverview(isDarkMode)}>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNum(isDarkMode)}>{stats.unlockedCount}</Text>
            <Text style={styles.statsLabel(isDarkMode)}>Unlocked</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNum(isDarkMode)}>{stats.totalCount}</Text>
            <Text style={styles.statsLabel(isDarkMode)}>Total</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNum(isDarkMode, isDarkMode ? '#34d399' : '#059669')}>
              {stats.completionPercentage}%
            </Text>
            <Text style={styles.statsLabel(isDarkMode)}>Complete</Text>
          </View>
        </View>
      </View>
    );
  });

  // Add new function to batch process achievements
  const batchUpdateAchievements = async (achievements) => {
    if (!achievements.length) return;

    try {
      // Create a Set of achievement titles that are already unlocked in the backend
      const unlockedSet = new Set(
        userAchievements
          .filter(a => a.isUnlocked)
          .map(a => a.title)
      );

      // Only send achievements that are not already unlocked in the backend
      let achievementsToUpdate = achievements.filter(achievement =>
        (achievement.isUnlocked || Math.round(achievement.progress) >= 100) &&
        !unlockedSet.has(achievement.title)
      );

      // Prevent duplicate "Starting Fresh" achievement
      achievementsToUpdate = achievementsToUpdate.filter(a => a.title !== "Starting Fresh");

      // Filter out duplicates by title (keep the last occurrence)
      const seen = new Set();
      achievementsToUpdate = achievementsToUpdate
        .reverse()
        .filter(a => {
          if (seen.has(a.title)) return false;
          seen.add(a.title);
          return true;
        })
        .reverse();

      if (!achievementsToUpdate.length) {
        console.log('No new achievements to update');
        return;
      }

      console.log(`Updating ${achievementsToUpdate.length} achievements`);

      // Send all achievements in a single request
      const response = await fetch(`${API_URL}/achievements/update-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id,
          achievements: achievementsToUpdate.map(achievement => ({
            achievementTitle: achievement.title,
            description: achievement.description,
            type: achievement.type || 'meals',
            icon: achievement.icon,
            progress: Math.round(achievement.progress),
            isUnlocked: true  // Force unlock for all updated achievements
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Only log error, don't throw to avoid breaking sync loop
        console.error(data.error || 'Failed to update achievements');
        return;
      }

      if (data.success) {
        setUserAchievements(prev => {
          // Use a Map to avoid duplicates by title
          const achievementMap = new Map();
          prev.forEach(a => achievementMap.set(a.title, a));
          data.achievements.forEach(achievement => {
            achievementMap.set(achievement.title, achievement);
          });
          return Array.from(achievementMap.values());
        });
      }
    } catch (error) {
      // Only log error, don't throw to avoid breaking sync loop
      console.error('Error updating achievements:', error);
    }
  };

  // Modified effect to handle changes (fixes infinite loop and stops update when no new)
  useEffect(() => {
    if (processedAchievements.length === 0) return;

    // Only add achievements that are not already unlocked in the backend
    const newAchievements = processedAchievements.filter(achievement => {
      const existingAchievement = userAchievements.find(
        a => a.title === achievement.title
      );
      return achievement.isUnlocked && (!existingAchievement || !existingAchievement.isUnlocked);
    });

    if (newAchievements.length > 0) {
      batchUpdateAchievements(newAchievements);
    }
  }, [processedAchievements, userAchievements]);

  // Handle navigation params for highlighting achievements
  useEffect(() => {
    if (params?.highlightId) {
      setHighlightedId(params.highlightId);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedId(null), 3000);
    }
  }, [params?.highlightId]);

  // Update the achievement card render with highlight
  const getHighlightStyle = (achievementId) => {
    if (highlightedId === achievementId) {
      return {
        borderWidth: 2,
        borderColor: '#f59e0b',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      };
    }
    return {};
  };

  return (
    <SafeAreaView style={styles.safeArea(isDarkMode)}>
      <View style={styles.safeArea(isDarkMode)}>
        {/* Header */}
        <View style={styles.header(isDarkMode)}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={isDarkMode ? "#D1D5DB" : "#374151"}
              />
            </TouchableOpacity>
            <Text style={styles.headerText(isDarkMode)}>
              Achievements
            </Text>
          </View>
        </View>

        {/* Stats Overview */}
        {loading ? <StatsOverviewSkeleton /> : <StatsOverview stats={stats} />}

        {/* Achievements List */}
        <ScrollView style={styles.scrollView(isDarkMode)}>
          {loading
            ? (
              <>
                <AchievementSkeleton />
                <AchievementSkeleton />
                <AchievementSkeleton />
                <AchievementSkeleton />
              </>
            )
            : processedAchievements.map((achievement, index) => (
                <AchievementCard
                  key={`${achievement.title}-${achievement.isUnlocked}`}
                  {...achievement}
                  style={getHighlightStyle(achievement._id)}
                />
              ))
          }
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Export memoized component
export default memo(Achievements);

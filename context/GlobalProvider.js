import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
// ...existing code...
import analytics from '../utils/firebaseAnalytics';

const API_URL = "https://trackeatfit.onrender.com";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [authToken, setAuthToken] = useState(null); // Add this line
  const router = useRouter();

  // Add new function to check token validity
  const checkTokenValidity = async (token) => {
    try {
      const response = await fetch(`${API_URL}/users/get-current-user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return !data.code || data.code !== 'INVALID_SESSION';
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Function to load user data from AsyncStorage
  const loadUserFromCache = async () => {
    try {
      console.log("Loading user from cache...");
      const [cachedData, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('authToken')
      ]);
      setAuthToken(token); // Save token to state

      if (!token) {
        console.log('No token in cache');
        return null;
      }

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Handle both nested and flat user data structures
        const userData = parsed.user || parsed;
        if (userData) {
          console.log('Valid cache found:', userData);
          return userData;
        }
      }

      console.log('No valid user found in cache');
      return null;
    } catch (error) {
      console.error('Error loading user from cache:', error);
      return null;
    } finally {
      setIsCacheLoaded(true);
    }
  };

  // Save user data to AsyncStorage
  const saveUserToCache = async (userData) => {
    try {
      // Ensure we're storing the user data in a consistent format
      const cacheData = {
        user: userData,
        timestamp: new Date().toISOString(),
        version: 1 // Add version control
      };
      console.log('Saving user to cache:', cacheData);
      await AsyncStorage.setItem('user', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving user to cache:', error);
    }
  };

  const saveTokenToCache = async (token) => {
    try {
      console.log('Saving token to cache:', token);
      await AsyncStorage.setItem('authToken', token); // Save token, not retrieve it
    } catch (error) {
      console.error('Error saving token to cache:', error);
    }
  };

  // Clear user data from AsyncStorage
  const clearUserCache = async () => {
    try {
      console.log('Clearing user data from cache...');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  };

  // Add this function inside GlobalProvider component
  const clearAllLocalData = async () => {
    try {
      console.log('Clearing all local data...');
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);
      console.log('All local data cleared successfully');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  };

  // Add session validation function
  const validateSession = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found during session validation');
        return false;
      }

      const response = await fetch(`${API_URL}/users/validate-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  // Function to fetch workout analytics for a user
  const fetchWorkoutAnalytics = async (userId) => {
    try {
      if (!userId) return null;
      const response = await fetch(`${API_URL}/api/v3/workouts/analytics/user/${userId}`);
      if (!response.ok) {
        console.error('Failed to fetch workout analytics');
        return null;
      }
      const data = await response.json();
      // Only return today's analytics
      return data.today
        ? {
            workouts: data.today.workouts ?? 0,
            duration: data.today.duration ?? 0,
            cal: data.today.cal ?? 0,
          }
        : { workouts: 0, duration: 0, cal: 0 };
    } catch (error) {
      console.error('Error fetching workout analytics:', error);
      return null;
    }
  };

  // Add normalizeUserData function at the top of GlobalProvider component
  const normalizeUserData = (userData) => {
    // Ensure all required fields exist with proper defaults
    return {
      _id: userData._id,
      email: userData.email,
      username: userData.username,
      uniqueName: userData.uniqueName,
      avatar: userData.avatar || "https://th.bing.com/th/id/OIP.yd94h9eJxZuHPrDg31LkiQHaHa?w=500&h=500&rs=1&pid=ImgDetMain",
      bio: userData.bio || "",
      link: userData.link || "",
      createdAt: userData.createdAt || new Date().toISOString(),
      streak: userData.streak || 1,
      lastStreak: userData.lastStreak || new Date().toISOString(),
      level: userData.level || 1,
      xp: userData.xp || 0,
      nextLevelXP: userData.nextLevelXP || 50,
      profileCompleted: userData.profileCompleted || false,
      completionPercentage: userData.completionPercentage || 0,
      subscriptions: userData.subscriptions || [{ plan: 'BASIC' }]
    };
  };

  // Function to fetch current user from the API
  const fetchCurrentUser = async (retryCount = 3, retryDelay = 1000) => {
    try {
      console.log("Fetching current user...");
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return null;
      }

      const response = await fetch(`${API_URL}/users/get-current-user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INVALID_SESSION' || data.code === 'NO_TOKEN') {
          console.log('Session invalid, handling session invalidation...');
          await handleSessionInvalid(true);
          return null;
        }
        throw new Error(data.error || 'Failed to fetch current user');
      }
  
      if (data && data.user) {
        // Normalize the user data before returning
        return normalizeUserData(data.user);
      }
  
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      if (error.message === 'Invalid session. Please login again.') {
        await handleSessionInvalid();
        return null;
      }
      if (retryCount > 0) {
        console.log(`Retrying fetch current user in ${retryDelay}ms... Remaining retries: ${retryCount - 1}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchCurrentUser(retryCount - 1, retryDelay * 2); // Exponential backoff
      } else {
        console.error('Max retries reached. Returning null.');
        return null;
      }
    }
  };

  // Update the updateUserStreak function to match backend API
  const updateUserStreak = async (newStreak) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !user) {
        console.error('No token or user found');
        return;
      }

      // Ensure streak is never less than 1
      const safeStreak = Math.max(1, newStreak);
      console.log('Updating streak to:', safeStreak);

      const response = await fetch(`${API_URL}/users/update-streak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          streak: safeStreak
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log backend error details for debugging
        console.error('Failed to update streak:', data);
        throw new Error(data.error || 'Failed to update streak');
      }

      if (data.success) {
        const updatedUser = {
          ...user,
          streak: safeStreak,
          lastStreak: new Date().toISOString()
        };

        setUser(updatedUser);
        await saveUserToCache(updatedUser);
      }
    } catch (error) {
      // Log the error with more details
      console.error('Error in updateUserStreak:', error);
    }
  };

  // Add function to check and reset streak
  const checkDailyStreak = async () => {
    try {
        if (!user) return;

        const now = new Date();
        const lastStreakDate = user.lastStreak ? new Date(user.lastStreak) : null;
        
        console.log('Checking streak:');
        console.log('Current date:', now.toISOString());
        console.log('Last streak date:', lastStreakDate?.toISOString());
        console.log('Current streak:', user.streak || 1); // Ensure initial streak is at least 1

        if (!lastStreakDate) {
            console.log('First time user, starting streak at 1');
            await updateUserStreak(1);
            return;
        }

        // Convert dates to UTC to avoid timezone issues
        const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const lastDayUTC = Date.UTC(lastStreakDate.getUTCFullYear(), lastStreakDate.getUTCMonth(), lastStreakDate.getUTCDate());

        // Get time difference in days
        const daysDiff = Math.floor((todayUTC - lastDayUTC) / (1000 * 60 * 60 * 24));
        console.log('Days missed:', daysDiff);

        if (daysDiff === 0) {
            // Same day, ensure streak is at least 1
            const currentStreak = Math.max(1, user.streak || 1);
            if (currentStreak !== user.streak) {
                await updateUserStreak(currentStreak);
            }
        } else if (daysDiff === 1) {
            // Next consecutive day - increment streak
            const newStreak = Math.max(1, (user.streak || 1) + 1);
            console.log('Next day - incrementing streak to:', newStreak);
            await updateUserStreak(newStreak);
        } else if (daysDiff > 1) {
            // Subtract missed days from current streak
            const currentStreak = user.streak || 1;
            const newStreak = Math.max(1, currentStreak - (daysDiff - 1));
            console.log(`Missed ${daysDiff} days - reducing streak from ${currentStreak} to ${newStreak}`);
            await updateUserStreak(newStreak);
        }
    } catch (error) {
        console.error('Error checking daily streak:', error);
    }
};

  // Add function to update user level
  const updateUserLevel = async (newLevel, newXP) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !user) {
        console.error('No token or user found');
        return false;
      }

      console.log('Updating user level/XP:', { newLevel, newXP });

      const response = await fetch(`${API_URL}/users/update-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          level: parseInt(newLevel),
          xp: parseInt(newXP)
        }),
      });

      const data = await response.json();

      // Handle the response immediately without checking multiple times
      if (response.ok && data.success) {
        const updatedUser = {
          ...user,
          level: parseInt(newLevel),
          xp: parseInt(newXP)
        };
        setUser(updatedUser);
        await saveUserToCache(updatedUser);
        console.log('Level/XP updated successfully:', { level: newLevel, xp: newXP });
        return true;
      } else {
        throw new Error(data.error || 'Failed to update level');
      }
    } catch (error) {
      console.error('Error updating level:', error);
      return false;
    }
  };

  // Add new function to handle invalid sessions
  const handleSessionInvalid = async () => {
    console.log('Handling invalid session...');
    const token = await AsyncStorage.getItem('authToken');
    
    // Only clear data if we actually have an invalid token
    if (token) {
      const isValid = await checkTokenValidity(token);
      if (!isValid) {
        console.log('Token confirmed invalid, clearing data');
        await clearAllLocalData();
      }
    }
    
    setUser(null);
    setIsLoggedIn(false);

    // Track session invalidation event
    await analytics.logEvent('session_invalidated');
    await analytics.logEvent('logout', { reason: 'session_invalid' });
  };

  // Modify initializeApp to use cache-first, then API update
  const initializeApp = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      setAuthToken(token);

      if (!token) {
        console.log('No token found during initialization');
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      // Start API fetch in parallel with cache load
      let cachedUser = null;
      let cachePromise = loadUserFromCache().then(user => {
        if (user) {
          setUser(user);
          setIsLoggedIn(true);
          setIsCacheLoaded(true);
          console.log('User info (from cache):', user);
        }
        cachedUser = user;
      });

      setIsRefreshing(true);
      // Start API fetch immediately, don't wait for cache
      fetchCurrentUser().then(async (currentUser) => {
        if (currentUser) {
          if (!cachedUser || JSON.stringify(currentUser) !== JSON.stringify(cachedUser)) {
            setUser(currentUser);
            setIsLoggedIn(true);
            await saveUserToCache(currentUser);
          }
          console.log('User info (from API):', currentUser);
        } else if (!cachedUser) {
          await handleSessionInvalid();
        }
        setIsRefreshing(false);
        setIsApiLoaded(true);
      });

      // Wait for cache to finish before proceeding (for isLoading)
      await cachePromise;

    } catch (error) {
      console.error('Error during initialization:', error);
      if (error.message && (error.message.includes('token') || error.message.includes('session'))) {
        await handleSessionInvalid();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add refresh function to manually trigger data refresh
  const refreshUserData = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      const currentUser = await fetchCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await saveUserToCache(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add useEffect to check streak on app load
  useEffect(() => {
    // Only check streak if user and token are present and not loading
    if (user && authToken && !isLoading) {
      checkDailyStreak();
    }
  }, [user, authToken, isLoading]);

  // Update useEffect to handle session timeouts
  useEffect(() => {
    initializeApp();
    checkNotificationStatus(); // Add this line

    // Add session check interval
    const sessionCheckInterval = setInterval(async () => {
      if (isLoggedIn) {
        const isValid = await validateSession();
        if (!isValid) {
          console.log('Session expired, logging out...');
          await handleSessionInvalid();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(sessionCheckInterval);
  }, []); // This ensures data is only loaded once when the app is opened

  // Add this function after other initialization functions
  const checkNotificationStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('notificationEnabled');
      setShowNotification(status !== 'true');
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  // Signout function to log out the user
  const signOut = async () => {
    try {
      console.log('Signing out user...');
      // Terminate session on backend before clearing local data
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          await fetch(`${API_URL}/users/signout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (err) {
        console.error('Error terminating backend session:', err);
      }

      // Clear all storage in parallel
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('user'),
        clearAllLocalData()
      ]);

      // Update state
      setIsLoggedIn(false);
      setUser(null);
      console.log('User info:', null);

      // Track logout event
      await analytics.logEvent('logout', { reason: 'user_signout' });

      return true; // Indicate successful logout
    } catch (error) {
      console.error('Error during signout:', error);
      return false;
    }
  };

  // Save token after login (call this function after a successful login)
  const handleLogin = async (userData, token) => {
    console.log('Handling login...');
    if (!userData || !token) {
      console.error('Invalid login data');
      return;
    }

    try {
      // Save token first
      await saveTokenToCache(token);
      setAuthToken(token);

      // Initial normalized user data
      const normalizedUser = normalizeUserData(userData);
      
      // Set initial state and cache
      setUser(normalizedUser);
      setIsLoggedIn(true);
      await saveUserToCache(normalizedUser);
      
      // Immediately fetch complete user data from API
      setIsRefreshing(true);
      const response = await fetch(`${API_URL}/users/get-current-user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        const fullUserData = normalizeUserData(data.user);
        setUser(fullUserData);
        await saveUserToCache(fullUserData);
        console.log('User info from API:', fullUserData);
      } else {
        console.log('Using normalized initial data:', normalizedUser);
      }

      setIsRefreshing(false);
      setIsApiLoaded(true);

      // Track login event
      await analytics.setUserId(normalizedUser._id);
      await analytics.setUserProperties({
        email: normalizedUser.email,
        username: normalizedUser.username
      });
      await analytics.logEvent('login', {
        method: token.includes('google') ? 'google' : 'password',
        userId: normalizedUser._id
      });

    } catch (error) {
      console.error('Error during login:', error);
      // Keep the normalized data if API fetch fails
      setIsRefreshing(false);
      setIsApiLoaded(true);
    }
  };

  // Add activity tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && user?._id) {
        // Update last active time when app becomes active
        updateLastActive();
      }
    });

    // Update last active time on initial load
    if (user?._id) {
      updateLastActive();
    }

    return () => {
      subscription.remove();
    };
  }, [user?._id]);
  const updateLastActive = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await fetch(`${API_URL}/api/user-activity/update-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          lastActive: new Date().toISOString()
        })
      });      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to update last active time:', errorData);
        throw new Error(`Failed to update last active time: ${errorData}`);
      }
    } catch (error) {
      console.error('Error updating last active time:', error);
      // Don't throw here to prevent app crashes, but log the error
    }
  };

  // ...existing code...

  // Update the value object to include refresh state and function
  const value = {
    isLoggedIn,
    setIsLoggedIn,
    user,
    setUser,
    isLoading,
    isCacheLoaded,
    isApiLoaded,
    isRefreshing,
    refreshUserData,
    clearUserCache,
    signOut,
    handleLogin,
    updateUserStreak,
    checkDailyStreak,
    updateUserLevel,
    showNotification,
    setShowNotification,
    checkNotificationStatus,
    getAuthToken: async () => await AsyncStorage.getItem('authToken'), // Add this line
    updateLastActive,
    authToken, // Add this if you want to expose it
  };

  // Add this useEffect to monitor authToken changes
  useEffect(() => {
    if (authToken === null && isCacheLoaded) {
      // Only redirect if we've finished loading cache to prevent premature redirects
      router.replace('/(auth)/sign-in');
    }
  }, [authToken, isCacheLoaded]);

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;

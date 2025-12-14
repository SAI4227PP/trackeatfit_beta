import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import { Platform, PermissionsAndroid } from 'react-native';

// Async helpers
export const setGoogleFitAuthState = async (isAuthorized) => {
  try {
    await AsyncStorage.setItem('googleFitAuthorized', JSON.stringify(isAuthorized));
  } catch (e) {
    console.error('[GoogleFit] Failed to persist auth state:', e);
  }
};

export const getGoogleFitAuthState = async () => {
  try {
    const value = await AsyncStorage.getItem('googleFitAuthorized');
    return value !== null ? JSON.parse(value) : undefined;
  } catch (e) {
    console.error('[GoogleFit] Failed to get auth state:', e);
    return undefined;
  }
};

export const clearGoogleFitAuthState = async () => {
  try {
    await AsyncStorage.removeItem('googleFitAuthorized');
  } catch (e) {
    console.error('[GoogleFit] Failed to clear auth state:', e);
  }
};

// Request ACTIVITY_RECOGNITION permission (Android 10+)
const requestActivityRecognitionPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 29) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Activity Recognition Permission',
          message: 'This app needs access to your physical activity to count your steps.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Activity Recognition permission error:', err);
      return false;
    }
  } else {
    return true;
  }
};

// Context
const GoogleFitContext = createContext();
export const useGoogleFit = () => useContext(GoogleFitContext);

export const GoogleFitProvider = ({ children }) => {
  const [authorized, setAuthorized] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [fitnessData, setFitnessData] = useState(null);
  const [stepsSummary, setStepsSummary] = useState({ day: 0, week: 0, month: 0 });

  const fetchFitnessSummary = useCallback(async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const getSteps = async (options) => {
        const samples = await GoogleFit.getDailyStepCountSamples(options);
        const preferredSample = samples.find(s => s.source === 'com.google.android.gms:estimated_steps') || samples[0];
        return preferredSample?.steps?.reduce((sum, s) => sum + (s.value || 0), 0) || 0;
      };

      const totalSteps = await getSteps({ startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() });

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const weekSteps = await getSteps({ startDate: weekStart.toISOString(), endDate: weekEnd.toISOString() });

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const monthSteps = await getSteps({ startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() });

      let calories = 0;
      if (GoogleFit.getDailyCalorieSamples) {
        const cals = await GoogleFit.getDailyCalorieSamples({ startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() });
        if (Array.isArray(cals)) calories = cals.reduce((sum, c) => sum + (c.calorie || 0), 0);
      }

      let distance = 0;
      if (GoogleFit.getDailyDistanceSamples) {
        const dist = await GoogleFit.getDailyDistanceSamples({ startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() });
        if (Array.isArray(dist)) distance = dist.reduce((sum, d) => sum + (d.distance || 0), 0);
      }

      setFitnessData({ steps: totalSteps, calories: Math.round(calories), distanceKm: (distance / 1000).toFixed(2) });
      setStepsSummary({ day: totalSteps, week: weekSteps, month: monthSteps });
    } catch (e) {
      setFitnessData(null);
      setStepsSummary({ day: 0, week: 0, month: 0 });
      console.error('[GoogleFit] Error fetching data:', e);
    }
  }, []);

  // Accept options for account selection
  const authorizeGoogleFit = useCallback(
    async (options = {}) => {
      setIsLoading(true);
      try {
        const permissionGranted = await requestActivityRecognitionPermission();
        if (!permissionGranted) {
          setAuthorized(false);
          return { success: false, message: 'Activity Recognition permission denied' };
        }

        // Add prompt: 'select_account' if forceAccountSelection is requested
        const authOptions = {
          scopes: [
            Scopes.FITNESS_ACTIVITY_READ,
            Scopes.FITNESS_ACTIVITY_WRITE,
            Scopes.FITNESS_BODY_READ,
            Scopes.FITNESS_BODY_WRITE,
            Scopes.FITNESS_BLOOD_PRESSURE_READ,
            Scopes.FITNESS_BLOOD_PRESSURE_WRITE,
            Scopes.FITNESS_BLOOD_GLUCOSE_READ,
            Scopes.FITNESS_BLOOD_GLUCOSE_WRITE,
            Scopes.FITNESS_NUTRITION_READ,
            Scopes.FITNESS_NUTRITION_WRITE,
            Scopes.FITNESS_LOCATION_READ,
          ],
          // Only add prompt if requested
          ...(options.forceAccountSelection ? { prompt: 'select_account' } : {}),
        };

        const authResult = await GoogleFit.authorize(authOptions);
        if (authResult.success) {
          setAuthorized(true);
          await setGoogleFitAuthState(true);
          await fetchFitnessSummary();
          return { success: true };
        } else {
          setAuthorized(false);
          return { success: false, message: authResult.message };
        }
      } catch (e) {
        setAuthorized(false);
        return { success: false, message: e.message };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFitnessSummary]
  );

  const disconnectGoogleFit = useCallback(async () => {
    GoogleFit.disconnect();
    setAuthorized(false);
    setFitnessData(null);
    await clearGoogleFitAuthState();
  }, []);

  useEffect(() => {
    (async () => {
      const persisted = await getGoogleFitAuthState();
      if (persisted) {
        setIsLoading(true);
        try {
          const permissionGranted = await requestActivityRecognitionPermission();
          if (!permissionGranted) {
            setAuthorized(false);
            return;
          }

          const authResult = await GoogleFit.authorize({
            scopes: [
              Scopes.FITNESS_ACTIVITY_READ,
              Scopes.FITNESS_ACTIVITY_WRITE,
              Scopes.FITNESS_BODY_READ,
              Scopes.FITNESS_BODY_WRITE,
              Scopes.FITNESS_LOCATION_READ,
            ],
          });

          if (authResult.success) {
            setAuthorized(true);
            await fetchFitnessSummary();
          } else {
            setAuthorized(false);
          }
        } catch (e) {
          setAuthorized(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAuthorized(false);
      }
    })();
  }, [fetchFitnessSummary]);

  useEffect(() => {
    if (!authorized) return;
    const interval = setInterval(() => {
      fetchFitnessSummary();
    }, 60000);
    return () => clearInterval(interval);
  }, [authorized, fetchFitnessSummary]);

  return (
    <GoogleFitContext.Provider
      value={{
        authorized,
        isLoading,
        fitnessData,
        stepsSummary,
        authorizeGoogleFit, // now supports options
        disconnectGoogleFit,
        fetchFitnessSummary,
      }}
    >
      {children}
    </GoogleFitContext.Provider>
  );
};

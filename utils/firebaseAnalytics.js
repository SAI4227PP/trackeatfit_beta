// To see real-time analytics in Firebase DebugView during development:
// Android: adb shell setprop debug.firebase.analytics.app <your.package.name>
// iOS:    Add -FIRDebugEnabled to your launch arguments in Xcode
// See: https://firebase.google.com/docs/analytics/debugview

// Screen time: ❌ Not yet logged automatically (can fix with the timer logic above).
// User context: ❌ Can set after auth for personalized analytics.

import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { NativeModules } from 'react-native';

// List of recommended event names for validation (add more as needed)
const RECOMMENDED_EVENTS = [
  'screen_view',
  'screen_time',
  'login',
  'signup',
  'logout',
  'purchase',
  'add_to_cart',
  'remove_from_cart',
  'home_loaded',
  // Custom community events:
  'like_post',
  'unlike_post',
  'save_post',
  'unsave_post',
  'view_comments',
  'follow_user',
  'unfollow_user',
  'report_post',
  'copy_post_link',
  'performance_metric',
  'submit_comment',
  'search_user',
  'follow_user_search',
  'delete_comment',
  'delete_post',
  'edit_post',
  'change_avatar',
  'check_unique_name',
  'save_profile',
  'share_profile_qr',
  'pick_image',
  'take_photo',
  'upload_images',
  'create_post',

//signin/signup
  'login',
  'signup',
  // ...add more business events here
];

// Centralized error logger with production hook
function logError(context, error) {
  // TODO: Integrate with production logging service if needed
  // if (__DEV__) {
  //   console.error(`[Analytics][${context}]`, error);
  // }
  // Production: log to a service here if needed
}

// Validate event name (warn in dev, allow custom events)
function validateEventName(eventName) {
  // if (!RECOMMENDED_EVENTS.includes(eventName) && __DEV__) {
  //   console.warn(`[Analytics] Event name "${eventName}" is not in the recommended list.`);
  // }
}

// Validate params are objects
function validateParams(params) {
  if (typeof params !== 'object' || params === null) {
    // if (__DEV__) {
    //   console.warn('[Analytics] Event params should be an object.');
    // }
    return {};
  }
  return params || {};
}

// Helper to get analytics instance (modular API)
function getAnalyticsInstance() {
  const firebase = getFirebaseModules();
  if (!firebase) {
    return null;
  }

  const app = firebase.getApp();
  return firebase.getAnalytics(app);
}

let cachedFirebaseModules = undefined;

function getFirebaseModules() {
  if (cachedFirebaseModules !== undefined) {
    return cachedFirebaseModules;
  }

  // Expo Go does not include RN Firebase native modules.
  if (!NativeModules?.RNFBAppModule) {
    cachedFirebaseModules = null;
    return cachedFirebaseModules;
  }

  try {
    const { getApp } = require('@react-native-firebase/app');
    const analyticsModule = require('@react-native-firebase/analytics');

    cachedFirebaseModules = {
      getApp,
      getAnalytics: analyticsModule.getAnalytics,
      logEvent: analyticsModule.logEvent,
      setUserId: analyticsModule.setUserId,
      setUserProperties: analyticsModule.setUserProperties,
    };
  } catch (error) {
    logError('getFirebaseModules', error);
    cachedFirebaseModules = null;
  }

  return cachedFirebaseModules;
}

// Analytics Service Singleton
class AnalyticsService {
  constructor() {
    this.screenEnterTime = new Map();
    this.globalUserContext = {};
    this.eventQueue = [];
    this.isOnline = true;
    // this.debug = __DEV__;
    this.debug = false; // Production: debug logs off
    this._initNetworkListener();
  }

  _initNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline) this._flushEventQueue();
    });
  }

  setDebugMode(enabled) {
    this.debug = enabled;
  }

  setGlobalUserContext(context) {
    if (typeof context === 'object' && context !== null) {
      this.globalUserContext = { ...context };
    }
  }

  async logEvent(eventName, params = {}) {
    validateEventName(eventName);
    const safeContext = typeof this.globalUserContext === 'object' && this.globalUserContext !== null ? this.globalUserContext : {};
    const safeParams = validateParams(params || {});
    const mergedParams = { ...safeContext, ...safeParams };
    if (!this.isOnline) {
      this.eventQueue.push({ eventName, params: mergedParams });
      // if (this.debug) console.log('[Analytics] Queued event:', eventName, mergedParams);
      return;
    }
    try {
      const analyticsInstance = getAnalyticsInstance();
      const firebase = getFirebaseModules();
      if (!analyticsInstance || !firebase) return;

      // Use modular API
      await firebase.logEvent(analyticsInstance, eventName, mergedParams);
      // if (this.debug) console.log('[Analytics] Sent event:', eventName, mergedParams);
    } catch (error) {
      logError('logEvent', error);
    }
  }

  async _flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const { eventName, params } = this.eventQueue.shift();
      try {
        const analyticsInstance = getAnalyticsInstance();
        const firebase = getFirebaseModules();
        if (!analyticsInstance || !firebase) return;

        // Use modular API
        await firebase.logEvent(analyticsInstance, eventName, params);
        // if (this.debug) console.log('[Analytics] Flushed event:', eventName, params);
      } catch (error) {
        logError('flushEventQueue', error);
      }
    }
  }

  async setUserId(userId) {
    try {
      const analyticsInstance = getAnalyticsInstance();
      const firebase = getFirebaseModules();
      if (!analyticsInstance || !firebase) return;

      // Use modular API
      await firebase.setUserId(analyticsInstance, userId);
      this.globalUserContext.userId = userId;
    } catch (error) {
      logError('setUserId', error);
    }
  }

  async setUserProperties(properties) {
    if (!properties || typeof properties !== 'object') {
      logError('setUserProperties', new Error('User properties must be an object.'));
      return;
    }
    try {
      const analyticsInstance = getAnalyticsInstance();
      const firebase = getFirebaseModules();
      if (!analyticsInstance || !firebase) return;

      // Use modular API
      await firebase.setUserProperties(analyticsInstance, properties);
      this.globalUserContext = { ...this.globalUserContext, ...properties };
    } catch (error) {
      logError('setUserProperties', error);
    }
  }

  // Log a page/screen view event
  async logScreenView(screenName, screenClass = null) {
    validateEventName('screen_view');
    try {
      await this.logEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName, // Use screenName as default for screen_class
        page_path: screenName, // Add page_path for analytics
      });
    } catch (error) {
      logError('logScreenView', error);
    }
  }

  // Track screen time (duration user spends on a screen)
  startScreenTimer(screenName) {
    this.screenEnterTime.set(screenName, Date.now());
  }

  async endScreenTimer(screenName, extraParams = {}) {
    const enterTime = this.screenEnterTime.get(screenName);
    if (enterTime) {
      const duration = Math.round((Date.now() - enterTime) / 1000); // seconds
      validateEventName('screen_time');
      try {
        await this.logEvent('screen_time', {
          screen_name: screenName,
          duration_seconds: duration,
          ...validateParams(extraParams),
        });
      } catch (error) {
        logError('endScreenTimer', error);
      }
      this.screenEnterTime.delete(screenName);
    }
  }

  // Optional: Clear all timers (for memory management)
  clearAllScreenTimers() {
    this.screenEnterTime.clear();
  }

  // Performance metric logging
  async logPerformanceMetric(metricName, value, params = {}) {
    try {
      await this.logEvent('performance_metric', {
        metric_name: metricName,
        value,
        ...validateParams(params),
      });
    } catch (error) {
      logError('logPerformanceMetric', error);
    }
  }
}

// Export a singleton instance for use throughout the app
const analyticsService = new AnalyticsService();
export default analyticsService;

// React hook for automatic screen tracking
export function useScreenAnalytics(screenName) {
  const timerStarted = useRef(false);
  useEffect(() => {
    analyticsService.logScreenView(screenName);
    analyticsService.startScreenTimer(screenName);
    timerStarted.current = true;
    return () => {
      if (timerStarted.current) {
        analyticsService.endScreenTimer(screenName);
        timerStarted.current = false;
      }
    };
  }, [screenName]);
}


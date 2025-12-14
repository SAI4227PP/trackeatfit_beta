import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'achievements_cache';
const CACHE_TIMESTAMP_KEY = 'achievements_cache_timestamp';
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export const achievementCache = {
  async get(userId) {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestamp || Date.now() - parseInt(timestamp) > CACHE_DURATION) {
        return null;
      }

      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;

      const parsed = JSON.parse(cachedData);
      return parsed[userId] || null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },

  async set(userId, achievements) {
    try {
      const existingCache = await AsyncStorage.getItem(CACHE_KEY);
      const cacheData = existingCache ? JSON.parse(existingCache) : {};
      
      cacheData[userId] = achievements;
      
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Cache write error:', error);
    }
  },

  async update(userId, achievement) {
    try {
      const cachedData = await this.get(userId);
      if (!cachedData) return;

      const index = cachedData.findIndex(a => a.title === achievement.title);
      if (index !== -1) {
        cachedData[index] = { ...cachedData[index], ...achievement };
      } else {
        cachedData.push(achievement);
      }

      await this.set(userId, cachedData);
    } catch (error) {
      console.error('Cache update error:', error);
    }
  },

  async invalidate() {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },

  clear: async (userId) => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const achievementKeys = keys.filter(key => key.startsWith(`achievement_${userId}`));
      if (achievementKeys.length > 0) {
        await AsyncStorage.multiRemove(achievementKeys);
      }
    } catch (error) {
      console.error('Error clearing achievement cache:', error);
    }
  }
};

import { AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';

const CACHE_KEY = 'goalIdeasCache';
const CACHE_TIMESTAMP_KEY = 'goalIdeasCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface CachedGoalIdeas {
  data: AdminGoalIdea[];
  timestamp: number;
  genderFilter?: 'male' | 'female';
}

export const goalIdeasCache = {
  get: (genderFilter?: 'male' | 'female'): AdminGoalIdea[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) return null;
      
      const cacheAge = Date.now() - parseInt(timestamp);
      if (cacheAge > CACHE_DURATION) {
        goalIdeasCache.clear();
        return null;
      }
      
      const parsedCache: CachedGoalIdeas = JSON.parse(cached);
      
      // Check if cache matches the current gender filter
      if (parsedCache.genderFilter !== genderFilter) {
        return null;
      }
      
      return parsedCache.data;
    } catch (error) {
      console.warn('Error reading goal ideas cache:', error);
      goalIdeasCache.clear();
      return null;
    }
  },

  set: (data: AdminGoalIdeas[], genderFilter?: 'male' | 'female'): void => {
    try {
      const cacheData: CachedGoalIdeas = {
        data,
        timestamp: Date.now(),
        genderFilter
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Error writing goal ideas cache:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Error clearing goal ideas cache:', error);
    }
  },

  isStale: (): boolean => {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestamp) return true;
      
      const cacheAge = Date.now() - parseInt(timestamp);
      return cacheAge > CACHE_DURATION;
    } catch (error) {
      return true;
    }
  }
};
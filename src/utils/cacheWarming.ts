// Cache warming utility for authenticated user data
// Preloads user-specific data in background for mobile performance

import { supabase } from '@/integrations/supabase/client';

interface CacheWarmingOptions {
  userId: string;
  priority?: 'high' | 'normal' | 'low';
  skipIfExists?: boolean;
}

// Critical user-specific endpoints for mobile performance
const getUserDataEndpoints = (userId: string) => [
  // User profile data
  `profiles?select=*&user_id=eq.${userId}`,
  // User's food entries for today
  `food_entries?select=*&user_id=eq.${userId}&date=eq.${new Date().toISOString().split('T')[0]}`,
  // User's recent foods for quick access
  `food_entries?select=food_name,quantity,unit,calories&user_id=eq.${userId}&order=created_at.desc&limit=20`,
  // User's motivators
  `motivators?select=*&user_id=eq.${userId}&is_active=eq.true`,
  // User's walking sessions for today  
  `walking_sessions?select=*&user_id=eq.${userId}&date=eq.${new Date().toISOString().split('T')[0]}`,
];

export class CacheWarmingManager {
  private isWarming = false;
  private warmingQueue: (() => Promise<void>)[] = [];

  // Warm cache for authenticated user
  async warmUserCache(options: CacheWarmingOptions): Promise<void> {
    if (this.isWarming && options.priority !== 'high') {
      console.log('Cache warming already in progress, queueing request');
      return new Promise((resolve) => {
        this.warmingQueue.push(async () => {
          await this.performCacheWarming(options);
          resolve();
        });
      });
    }

    return this.performCacheWarming(options);
  }

  private async performCacheWarming(options: CacheWarmingOptions): Promise<void> {
    this.isWarming = true;
    const { userId, skipIfExists = true } = options;
    
    console.log(`🔥 Warming cache for user: ${userId}`);

    try {
      const endpoints = getUserDataEndpoints(userId);
      const promises = endpoints.map(endpoint => 
        this.warmEndpoint(endpoint, skipIfExists)
      );

      await Promise.allSettled(promises);
      
      console.log(`✅ Cache warming completed for user: ${userId}`);
    } catch (error) {
      console.error('Cache warming failed:', error);
    } finally {
      this.isWarming = false;
      
      // Process queue
      if (this.warmingQueue.length > 0) {
        const nextTask = this.warmingQueue.shift();
        if (nextTask) {
          setTimeout(() => nextTask(), 100); // Small delay to prevent overwhelming
        }
      }
    }
  }

  private async warmEndpoint(endpoint: string, skipIfExists: boolean): Promise<void> {
    try {
      // Use the configured Supabase URL instead of accessing protected property
      const fullUrl = `https://texnkijwcygodtywgedm.supabase.co/rest/v1/${endpoint}`;
      
      // Check if already cached
      if (skipIfExists && 'caches' in window) {
        const cache = await caches.open('fastnow-data-v1757846000000');
        const cached = await cache.match(fullUrl);
        if (cached) {
          console.log(`⏩ Skipping cached endpoint: ${endpoint}`);
          return;
        }
      }

      console.log(`📥 Warming: ${endpoint}`);
      
      // Make direct fetch request instead of using supabase client for dynamic endpoints
      const response = await fetch(fullUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️  Failed to warm ${endpoint}: ${response.status}`);
        return;
      }

      const data = await response.text();

      // Cache the response if caching is available
      if ('caches' in window) {
        const cache = await caches.open('fastnow-data-v1757846000000');
        const cacheResponse = new Response(data, {
          headers: {
            'content-type': 'application/json',
            'x-cached-at': new Date().toISOString(),
            'x-cache-source': 'cache-warming'
          }
        });
        await cache.put(fullUrl, cacheResponse);
      }

      console.log(`🔥 Warmed: ${endpoint}`);
    } catch (error) {
      console.error(`❌ Error warming ${endpoint}:`, error);
    }
  }

  // Clear all user-specific caches
  async clearUserCache(userId: string): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('fastnow-data-v1757846000000');
      const keys = await cache.keys();
      
      const userCacheKeys = keys.filter(req => 
        req.url.includes(`user_id=eq.${userId}`)
      );

      await Promise.all(userCacheKeys.map(key => cache.delete(key)));
      
      console.log(`🗑️  Cleared cache for user: ${userId}`);
    } catch (error) {
      console.error('Failed to clear user cache:', error);
    }
  }
}

// Singleton instance
export const cacheWarmingManager = new CacheWarmingManager();

// React hook for cache warming
import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useCacheWarming = () => {
  const user = useAuthStore(state => state.user);

  const warmCache = useCallback(async (priority: 'high' | 'normal' | 'low' = 'normal') => {
    if (!user?.id) {
      console.warn('Cannot warm cache: no authenticated user');
      return;
    }

    return cacheWarmingManager.warmUserCache({
      userId: user.id,
      priority,
      skipIfExists: true
    });
  }, [user?.id]);

  const clearCache = useCallback(async () => {
    if (!user?.id) return;
    return cacheWarmingManager.clearUserCache(user.id);
  }, [user?.id]);

  return {
    warmCache,
    clearCache,
    isUserAuthenticated: !!user?.id
  };
};
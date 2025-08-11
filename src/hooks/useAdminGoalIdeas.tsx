import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

const CACHE_KEY = 'admin_goal_ideas_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedGoalIdeas {
  data: AdminGoalIdea[];
  timestamp: number;
}

export const useAdminGoalIdeas = () => {
  const [goalIdeas, setGoalIdeas] = useState<AdminGoalIdea[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  // Load cached data from localStorage
  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedGoalIdeas = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsed.timestamp < CACHE_TTL) {
          console.log('📦 Using cached admin goal ideas');
          setGoalIdeas(parsed.data);
          setLoading(false);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cached admin goal ideas:', error);
    }
    return false;
  };

  // Cache data to localStorage
  const cacheData = (data: AdminGoalIdea[]) => {
    try {
      const cacheData: CachedGoalIdeas = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching admin goal ideas:', error);
    }
  };

  const loadGoalIdeas = async (retryCount = 0, background = false) => {
    // Check if offline and use cached data
    if (!navigator.onLine) {
      console.log('🔌 Offline: using cached admin goal ideas only');
      if (loadCachedData()) {
        return;
      }
      setLoading(false);
      return;
    }

    // Prevent overlapping fetches
    if (isFetching) {
      console.log('⏸️ Admin goal ideas fetch already in progress');
      return;
    }

    console.log('🔄 Loading admin goal ideas...', retryCount > 0 ? `(retry ${retryCount})` : '', background ? '(background)' : '');
    setIsFetching(true);

    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error) {
        console.error('Admin Goal Ideas Database error:', error);
        
        // Retry on network errors up to 3 times with backoff
        if (error.message?.includes('Failed to fetch') && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          setTimeout(() => loadGoalIdeas(retryCount + 1, background), delay);
          return;
        }
        
        if (!background) {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Failed to load motivator ideas. Please check your connection and try again."
          });
        }
        
        // Use cached data as fallback
        if (!loadCachedData()) {
          setGoalIdeas([]);
        }
        return;
      }

      if (data?.setting_value) {
        try {
          const parsedGoalIdeas = JSON.parse(data.setting_value);
          const validIdeas = Array.isArray(parsedGoalIdeas) ? parsedGoalIdeas : [];
          console.log('✅ Admin Goal Ideas loaded successfully:', validIdeas.length, background ? '(background)' : '');
          
          setGoalIdeas(validIdeas.map(idea => ({ ...idea })));
          cacheData(validIdeas); // Cache the fresh data
        } catch (parseError) {
          console.error('Error parsing admin goal ideas:', parseError);
          if (!background) {
            toast({
              variant: "destructive",
              title: "Data Error",
              description: "Failed to parse motivator ideas data."
            });
          }
          setGoalIdeas([]);
        }
      } else {
        console.log('No admin goal ideas data found in database');
        setGoalIdeas([]);
      }
    } catch (error: any) {
      console.error('Error loading admin goal ideas:', error);
      
      // Retry on network errors
      if (error.message?.includes('Failed to fetch') && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        setTimeout(() => loadGoalIdeas(retryCount + 1, background), delay);
        return;
      }
      
      if (!background) {
        toast({
          variant: "destructive", 
          title: "Connection Error",
          description: "Failed to load motivator ideas. Please check your connection and try again."
        });
      }
      
      // Use cached data as fallback
      if (!loadCachedData()) {
        setGoalIdeas([]);
      }
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  // Load cached data immediately on mount, then fetch fresh data
  useEffect(() => {
    // First load cached data if available (instant)
    if (loadCachedData()) {
      // Then fetch fresh data in background
      setTimeout(() => loadGoalIdeas(0, true), 100);
    } else {
      // No cached data, load fresh data
      loadGoalIdeas();
    }
  }, [refreshTrigger]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing admin goal ideas...');
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    goalIdeas,
    loading,
    refreshGoalIdeas: loadGoalIdeas,
    forceRefresh
  };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ManualCalorieBurn {
  id: string;
  user_id: string;
  activity_name: string;
  calories_burned: number;
  created_at: string;
  updated_at: string;
}

export const useManualCalorieBurns = () => {
  const [manualBurns, setManualBurns] = useState<ManualCalorieBurn[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadTodayManualBurns = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('manual_calorie_burns')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setManualBurns(data || []);
      
      // Calculate today's total
      const total = (data || []).reduce((sum, burn) => sum + burn.calories_burned, 0);
      setTodayTotal(total);
    } catch (error) {
      console.error('Error loading manual calorie burns:', error);
      setManualBurns([]);
      setTodayTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTodayManualBurns();
  }, [loadTodayManualBurns]);

  return {
    manualBurns,
    todayTotal,
    loading,
    refreshManualBurns: loadTodayManualBurns
  };
};
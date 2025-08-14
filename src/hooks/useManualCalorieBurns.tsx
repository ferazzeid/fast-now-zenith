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
      
      console.log('🔥 MANUAL CALORIE BURNS HOOK RESULT:', {
        totalEntries: (data || []).length,
        entries: data?.map(d => ({ activity: d.activity_name, calories: d.calories_burned })),
        calculatedTotal: total,
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        today: new Date().toISOString()
      });
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

  const deleteManualBurn = useCallback(async (burnId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('manual_calorie_burns')
        .delete()
        .eq('id', burnId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the list
      await loadTodayManualBurns();
    } catch (error) {
      console.error('Error deleting manual calorie burn:', error);
      throw error;
    }
  }, [user, loadTodayManualBurns]);

  return {
    manualBurns,
    todayTotal,
    loading,
    refreshManualBurns: loadTodayManualBurns,
    deleteManualBurn
  };
};
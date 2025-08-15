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
      // FIX: Use same date logic as deficit query for consistency
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('manual_calorie_burns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to today's entries using same date string comparison
      const todayEntries = (data || []).filter(burn => {
        const burnDate = burn.created_at.split('T')[0];
        return burnDate === today;
      });

      setManualBurns(todayEntries);
      
      // Calculate today's total
      const total = todayEntries.reduce((sum, burn) => sum + burn.calories_burned, 0);
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
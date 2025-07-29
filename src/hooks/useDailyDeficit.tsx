import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useManualCalorieBurns } from '@/hooks/useManualCalorieBurns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalkingStats } from '@/contexts/WalkingStatsContext';

interface DailyDeficitData {
  todayDeficit: number;
  bmr: number;
  tdee: number;
  caloriesConsumed: number;
  walkingCalories: number;
  manualCalories: number;
  activityLevel: string;
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9
};

export const useDailyDeficit = () => {
  const [deficitData, setDeficitData] = useState<DailyDeficitData>({
    todayDeficit: 0,
    bmr: 0,
    tdee: 0,
    caloriesConsumed: 0,
    walkingCalories: 0,
    manualCalories: 0,
    activityLevel: 'sedentary'
  });
  const [loading, setLoading] = useState(false);
  
  const { profile } = useProfile();
  const { todayTotals } = useFoodEntries();
  const { todayTotal: manualCalorieTotal } = useManualCalorieBurns();
  const { user } = useAuth();
  const { walkingStats } = useWalkingStats();

  const calculateCompletedWalkingCaloriesForDay = useCallback(async () => {
    if (!user || !profile?.weight) {
      return 0;
    }
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Only get completed sessions from today
      const { data: sessions } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString());
      
      if (!sessions) return 0;
      
      // Sum up calories from completed sessions only
      return sessions.reduce((total, session) => {
        return total + (session.calories_burned || 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating completed walking calories:', error);
      return 0;
    }
  }, [user, profile?.weight]);


  const calculateDeficit = useCallback(async () => {
    if (!profile?.weight || !profile?.height || !profile?.age) {
      setDeficitData(prev => ({ 
        ...prev, 
        todayDeficit: 0, 
        bmr: 0, 
        tdee: 0,
        caloriesConsumed: todayTotals.calories || 0,
        walkingCalories: 0,
        manualCalories: manualCalorieTotal || 0,
        activityLevel: profile?.activity_level || 'sedentary'
      }));
      setLoading(false);
      return;
    }

    // Only show loading when we have no data at all
    if (deficitData.tdee === 0) {
      setLoading(true);
    }
    
    try {
      // Calculate BMR using Mifflin-St Jeor equation
      let weightKg: number;
      let heightCm: number;
      
      if (profile.units === 'metric') {
        weightKg = profile.weight;
        heightCm = profile.height;
      } else {
        weightKg = profile.weight * 0.453592; // Convert lbs to kg
        heightCm = profile.height * 2.54; // Convert inches to cm
      }
      
      const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age - 78);
      
      // Use activity level from profile
      const activityLevel = profile.activity_level || 'sedentary';
      const multiplier = ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || 1.2;
      const tdee = Math.round(bmr * multiplier);
      
      // Get today's data
      const caloriesConsumed = todayTotals.calories || 0;
      
      // Get walking calories: completed sessions + current active session (if any)
      const completedWalkingCalories = await calculateCompletedWalkingCaloriesForDay();
      const activeWalkingCalories = walkingStats.isActive ? walkingStats.realTimeCalories : 0;
      const walkingCalories = completedWalkingCalories + activeWalkingCalories;
      
      console.log('Walking calories calculation:', {
        completedWalkingCalories,
        activeWalkingCalories,
        totalWalkingCalories: walkingCalories,
        walkingStatsIsActive: walkingStats.isActive,
        walkingStatsRealTimeCalories: walkingStats.realTimeCalories
      });
      
      const manualCalories = manualCalorieTotal || 0;
      
      // Calculate deficit: TDEE + Walking + Manual Activities - Food Consumed
      const todayDeficit = tdee + walkingCalories + manualCalories - caloriesConsumed;
      
      setDeficitData({
        todayDeficit,
        bmr,
        tdee,
        caloriesConsumed,
        walkingCalories,
        manualCalories,
        activityLevel
      });
      
    } catch (error) {
      console.error('Error calculating deficit:', error);
      
      const fallbackData = {
        todayDeficit: 0,
        bmr: 0,
        tdee: 0,
        caloriesConsumed: todayTotals.calories || 0,
        walkingCalories: 0,
        manualCalories: manualCalorieTotal || 0,
        activityLevel: profile.activity_level || 'sedentary'
      };
      
      setDeficitData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [profile, todayTotals, calculateCompletedWalkingCaloriesForDay, manualCalorieTotal, walkingStats]);

  // Calculate deficit when relevant data changes
  useEffect(() => {
    if (profile && user) {
      calculateDeficit();
    }
  }, [profile?.weight, profile?.height, profile?.age, profile?.activity_level, todayTotals.calories, manualCalorieTotal, walkingStats.realTimeCalories, calculateDeficit]);

  // Recalculate every 30 seconds when walking is active
  useEffect(() => {
    if (walkingStats.isActive && !walkingStats.isPaused) {
      const interval = setInterval(() => {
        calculateDeficit();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [walkingStats.isActive, walkingStats.isPaused, calculateDeficit]);

  const refreshDeficit = useCallback(async () => {
    await calculateDeficit();
  }, [calculateDeficit]);

  return {
    deficitData,
    loading,
    refreshDeficit
  };
};
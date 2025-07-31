import React, { useState, useEffect, useCallback, useMemo } from 'react';
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


  // Memoize expensive calculations
  const { weightKg, heightCm } = useMemo(() => {
    if (!profile?.weight || !profile?.height) return { weightKg: 0, heightCm: 0 };
    
    if (profile.units === 'metric') {
      return { weightKg: profile.weight, heightCm: profile.height };
    } else {
      return {
        weightKg: profile.weight * 0.453592, // Convert lbs to kg
        heightCm: profile.height * 2.54 // Convert inches to cm
      };
    }
  }, [profile?.weight, profile?.height, profile?.units]);

  const bmrCalculation = useMemo(() => {
    if (!profile?.weight || !profile?.height || !profile?.age) return 0;
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age - 78);
  }, [weightKg, heightCm, profile?.age]);

  const tdeeCalculation = useMemo(() => {
    if (!bmrCalculation || !profile?.activity_level) return 0;
    const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level as keyof typeof ACTIVITY_MULTIPLIERS] || 1.2;
    return Math.round(bmrCalculation * multiplier);
  }, [bmrCalculation, profile?.activity_level]);

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
      // Use memoized calculations
      const bmr = bmrCalculation;
      const tdee = tdeeCalculation;
      
      // Get today's data
      const caloriesConsumed = todayTotals.calories || 0;
      
      // Get walking calories: completed sessions + current active session (if any)
      const completedWalkingCalories = await calculateCompletedWalkingCaloriesForDay();
      const activeWalkingCalories = walkingStats.isActive ? walkingStats.realTimeCalories : 0;
      const walkingCalories = completedWalkingCalories + activeWalkingCalories;
      
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
        activityLevel: profile.activity_level || 'sedentary'
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
        activityLevel: profile?.activity_level || 'sedentary'
      };
      
      setDeficitData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [profile, todayTotals, calculateCompletedWalkingCaloriesForDay, manualCalorieTotal, walkingStats, bmrCalculation, tdeeCalculation]);

  // Calculate deficit when relevant data changes - enhanced to detect walking session changes
  useEffect(() => {
    if (profile && user) {
      calculateDeficit();
    }
  }, [profile?.weight, profile?.height, profile?.age, profile?.activity_level, todayTotals.calories, manualCalorieTotal, walkingStats.realTimeCalories, walkingStats.isActive, walkingStats.currentSessionId, calculateDeficit]);

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
    // Force refresh by invalidating any cached data
    await calculateDeficit();
  }, [calculateDeficit]);

  // Additional effect to trigger refresh when walking sessions end or are deleted
  useEffect(() => {
    if (!walkingStats.isActive && walkingStats.currentSessionId === null) {
      // Walking session just ended or was deleted - refresh to clear old data
      setTimeout(() => calculateDeficit(), 1000); // Small delay to ensure database is updated
    }
  }, [walkingStats.isActive, walkingStats.currentSessionId, calculateDeficit]);

  return {
    deficitData,
    loading,
    refreshDeficit
  };
};
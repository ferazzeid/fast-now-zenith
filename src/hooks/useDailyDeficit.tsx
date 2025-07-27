import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useFastingSession } from '@/hooks/useFastingSession';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DailyDeficitData {
  todayDeficit: number;
  bmr: number;
  tdee: number;
  caloriesConsumed: number;
  walkingCalories: number;
  fastingBonus: number;
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
    fastingBonus: 0,
    activityLevel: 'sedentary'
  });
  const [loading, setLoading] = useState(false);
  
  const { profile } = useProfile();
  const { todayTotals } = useFoodEntries();
  const { currentSession: walkingSession } = useWalkingSession();
  const { currentSession: fastingSession } = useFastingSession();
  const { user } = useAuth();

  const calculateWalkingCaloriesForDay = useCallback(async () => {
    if (!user || !profile?.weight) return 0;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const { data: sessions } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString())
        .neq('status', 'deleted');
      
      if (!sessions) return 0;
      
      let totalCalories = 0;
      
      for (const session of sessions) {
        if (session.calories_burned) {
          totalCalories += session.calories_burned;
        } else if (session.end_time) {
          // Calculate calories for completed sessions without calories_burned
          const durationMs = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
          const durationMinutes = durationMs / (1000 * 60);
          const speedMph = session.speed_mph || 3;
          
          // MET values for walking
          const metValues: { [key: number]: number } = {
            2: 2.5, 3: 3.5, 4: 5.0, 5: 6.0
          };
          const met = metValues[Math.round(speedMph)] || 3.5;
          // Use consistent weight handling
          const weightKg = profile.units === 'metric' ? profile.weight : profile.weight * 0.453592;
          const calories = Math.round(met * weightKg * (durationMinutes / 60));
          totalCalories += calories;
        }
      }
      
      // Add current active session calories with pause time handling
      if (walkingSession?.session_state === 'active' && profile.weight) {
        const currentDuration = (Date.now() - new Date(walkingSession.start_time).getTime()) / (1000 * 60);
        // Subtract pause time for accurate calculation
        const pauseTime = walkingSession.total_pause_duration || 0;
        const activeDuration = Math.max(0, currentDuration - (pauseTime / 60));
        
        const speedMph = walkingSession.speed_mph || 3;
        const metValues: { [key: number]: number } = {
          2: 2.5, 3: 3.5, 4: 5.0, 5: 6.0
        };
        const met = metValues[Math.round(speedMph)] || 3.5;
        
        // Use consistent weight handling
        const weightKg = profile.units === 'metric' ? profile.weight : profile.weight * 0.453592;
        const currentCalories = Math.round(met * weightKg * (activeDuration / 60));
        totalCalories += currentCalories;
        
        console.log('Active session calories calculation:', {
          currentDuration,
          pauseTime,
          activeDuration,
          speedMph,
          met,
          weightKg,
          currentCalories,
          totalCalories
        });
      }
      
      return totalCalories;
    } catch (error) {
      console.error('Error calculating walking calories:', error);
      return 0;
    }
  }, [user, profile?.weight, walkingSession]);

  const calculateFastingBonus = useCallback(() => {
    if (!fastingSession?.status || fastingSession.status !== 'active') return 0;
    
    // Simple fasting bonus: 5% increase in metabolic rate during active fast
    const bmr = profile ? (10 * (profile.weight || 0) + 6.25 * (profile.height || 0) - 5 * (profile.age || 0) - 78) : 0;
    return Math.round(bmr * 0.05);
  }, [fastingSession, profile]);

  const calculateDeficit = useCallback(async () => {
    if (!profile?.weight || !profile?.height || !profile?.age) {
      setDeficitData(prev => ({ ...prev, todayDeficit: 0, bmr: 0, tdee: 0 }));
      return;
    }

    setLoading(true);
    
    try {
      // Calculate BMR using Mifflin-St Jeor equation (gender-neutral)
      const bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 78);
      
      // Use activity level from profile
      const activityLevel = profile.activity_level || 'sedentary';
      const multiplier = ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || 1.2;
      const tdee = Math.round(bmr * multiplier);
      
      // Get today's data
      const caloriesConsumed = todayTotals.calories || 0;
      const walkingCalories = await calculateWalkingCaloriesForDay();
      const fastingBonus = calculateFastingBonus();
      
      // Calculate deficit: TDEE + Walking + Fasting Bonus - Food Consumed
      const todayDeficit = tdee + walkingCalories + fastingBonus - caloriesConsumed;
      
      setDeficitData({
        todayDeficit,
        bmr,
        tdee,
        caloriesConsumed,
        walkingCalories,
        fastingBonus,
        activityLevel
      });
    } catch (error) {
      console.error('Error calculating deficit:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, todayTotals, calculateWalkingCaloriesForDay, calculateFastingBonus, user?.id]);

  // Real-time calculation - recalculate every 10 seconds if walking is active
  useEffect(() => {
    if (profile && user) {
      calculateDeficit();
      
      // Set up interval for active walking sessions only - more frequent updates
      if (walkingSession?.session_state === 'active') {
        const interval = setInterval(() => {
          calculateDeficit();
        }, 10000); // 10 seconds for better real-time accuracy
        
        return () => clearInterval(interval);
      }
    }
  }, [profile?.weight, profile?.height, profile?.age, profile?.activity_level, todayTotals.calories, todayTotals.carbs, fastingSession?.status, user?.id]);

  // Only recalculate immediately when walking session starts/stops  
  useEffect(() => {
    if (profile && user && walkingSession?.session_state !== undefined) {
      calculateDeficit();
    }
  }, [walkingSession?.session_state]);

  return {
    deficitData,
    loading,
    refreshDeficit: calculateDeficit
  };
};
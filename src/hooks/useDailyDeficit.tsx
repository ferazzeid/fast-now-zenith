import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useManualCalorieBurns } from '@/hooks/useManualCalorieBurns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { currentSession: walkingSession } = useWalkingSession();
  const { todayTotal: manualCalorieTotal } = useManualCalorieBurns();
  const { user } = useAuth();

  const calculateWalkingCaloriesForDay = useCallback(async () => {
    if (!user || !profile?.weight) {
      console.log('Walking calc early return:', { user: !!user, weight: profile?.weight });
      return 0;
    }
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      console.log('Fetching walking sessions for today:', { startOfDay, endOfDay });
      
      const { data: sessions } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString())
        .neq('status', 'deleted');
      
      console.log('Found walking sessions:', sessions);
      
      if (!sessions) {
        console.log('No sessions found');
        return 0;
      }
      
      let totalCalories = 0;
      
      for (const session of sessions) {
        if (session.calories_burned) {
          // FIXED: Don't double count - use already calculated calories for completed sessions
          totalCalories += session.calories_burned;
        } else if (session.end_time) {
          // Calculate calories for completed sessions without calories_burned
          const durationMs = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
          // FIXED: Subtract pause time from completed sessions
          const pauseTimeMs = (session.total_pause_duration || 0) * 1000;
          const activeDurationMs = Math.max(0, durationMs - pauseTimeMs);
          const activeDurationMinutes = activeDurationMs / (1000 * 60);
          
          const speedMph = session.speed_mph || 3;
          
          // FIXED: Corrected MET values based on research data
          const metValues: { [key: number]: number } = {
            2: 2.8,  // 2 mph - slow pace (was 2.5)
            3: 3.2,  // 3 mph - average pace (was 3.5) 
            4: 4.3,  // 4 mph - brisk pace (was 5.0)
            5: 5.5   // 5 mph - fast pace (was 6.0)
          };
          const met = metValues[Math.round(speedMph)] || 3.2;
          
          // FIXED: Ensure weight conversion is consistent
          let weightKg: number;
          if (profile.units === 'metric') {
            weightKg = profile.weight;
          } else {
            weightKg = profile.weight * 0.453592; // Convert lbs to kg
          }
          
          const calories = Math.round(met * weightKg * (activeDurationMinutes / 60));
          totalCalories += calories;
          
          console.log('Completed session calculation:', {
            durationMs,
            pauseTimeMs,
            activeDurationMinutes,
            speedMph,
            met,
            weightKg,
            calories
          });
        }
      }
      
      console.log('Current walking session state:', walkingSession);
      console.log('Total calories from completed sessions:', totalCalories);
      
      // FIXED: Only calculate active session if not already included in completed sessions
      if (walkingSession?.session_state === 'active' && profile.weight) {
        // Check if this session is already in the completed sessions list
        const activeSessionInList = sessions.find(s => s.id === walkingSession.id);
        
        console.log('Active session check:', { 
          activeSessionInList: !!activeSessionInList, 
          walkingSessionId: walkingSession.id,
          sessionState: walkingSession.session_state 
        });
        
        if (!activeSessionInList) {
          const currentDuration = (Date.now() - new Date(walkingSession.start_time).getTime()) / (1000 * 60);
          // Subtract pause time for accurate calculation  
          const pauseTimeMinutes = (walkingSession.total_pause_duration || 0) / 60;
          const activeDuration = Math.max(0, currentDuration - pauseTimeMinutes);
          
          const speedMph = walkingSession.speed_mph || 3;
          
          // FIXED: Use same corrected MET values
          const metValues: { [key: number]: number } = {
            2: 2.8, 3: 3.2, 4: 4.3, 5: 5.5
          };
          const met = metValues[Math.round(speedMph)] || 3.2;
          
          // FIXED: Ensure weight conversion is consistent
          let weightKg: number;
          if (profile.units === 'metric') {
            weightKg = profile.weight;
          } else {
            weightKg = profile.weight * 0.453592; // Convert lbs to kg
          }
          
          const currentCalories = Math.round(met * weightKg * (activeDuration / 60));
          totalCalories += currentCalories;
          
          console.log('Active session calories calculation:', {
            currentDuration,
            pauseTimeMinutes,
            activeDuration,
            speedMph,
            met,
            weightKg,
            currentCalories,
            totalCalories
          });
        }
      }
      
      console.log('Final walking calories total:', totalCalories);
      return totalCalories;
    } catch (error) {
      console.error('Error calculating walking calories:', error);
      return 0;
    }
  }, [user, profile?.weight, profile?.units, walkingSession]);


  const calculateDeficit = useCallback(async () => {
    if (!profile?.weight || !profile?.height || !profile?.age) {
      setDeficitData(prev => ({ ...prev, todayDeficit: 0, bmr: 0, tdee: 0 }));
      return;
    }

    setLoading(true);
    
    try {
      // Calculate BMR using Mifflin-St Jeor equation (gender-neutral)
      // Convert to metric for calculation if needed
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
      const walkingCalories = await calculateWalkingCaloriesForDay();
      const manualCalories = manualCalorieTotal || 0;
      
      // Calculate deficit: TDEE + Walking + Manual Activities - Food Consumed
      const todayDeficit = tdee + walkingCalories + manualCalories - caloriesConsumed;
      
      console.log('Deficit calculation breakdown:', {
        bmr,
        tdee,
        activityLevel,
        multiplier,
        caloriesConsumed,
        walkingCalories,
        manualCalories,
        todayDeficit,
        profile: { weight: profile.weight, height: profile.height, age: profile.age, units: profile.units }
      });
      
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
    } finally {
      setLoading(false);
    }
  }, [profile, todayTotals, calculateWalkingCaloriesForDay, manualCalorieTotal, user?.id]);

  // Real-time calculation - recalculate every 60 seconds if walking is active
  useEffect(() => {
    console.log('Deficit calculation effect triggered:', { profile: !!profile, user: !!user });
    if (profile && user) {
      console.log('Calling calculateDeficit...');
      calculateDeficit();
      
      // Set up interval for active walking sessions only - less frequent updates for better performance
      if (walkingSession?.session_state === 'active') {
        console.log('Setting up interval for active walking session');
        const interval = setInterval(() => {
          console.log('Interval triggered - recalculating deficit');
          calculateDeficit();
        }, 60000); // 60 seconds for better performance while maintaining accuracy
        
        return () => clearInterval(interval);
      }
    }
  }, [calculateDeficit]);

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
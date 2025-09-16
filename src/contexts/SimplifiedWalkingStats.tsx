import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useOptimizedProfile } from '@/hooks/optimized/useOptimizedProfile';

// Simplified walking stats for immediate display
interface SimpleWalkingStats {
  calories: number;
  distance: number;
  pace: string;
  startTime: string;
  fatBurned: number;
}

interface SimpleWalkingStatsContextType {
  walkingStats: SimpleWalkingStats;
}

const SimpleWalkingStatsContext = createContext<SimpleWalkingStatsContextType | undefined>(undefined);

export const SimpleWalkingStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walkingStats, setWalkingStats] = useState<SimpleWalkingStats>({
    calories: 0,
    distance: 0,
    pace: '',
    startTime: '',
    fatBurned: 0
  });

  // Always call useWalkingSession hook consistently
  const walkingSession = useWalkingSession();
  const currentSession = walkingSession?.currentSession || null;
  const selectedSpeed = walkingSession?.selectedSpeed || 3;
  const { profile, calculateWalkingCalories } = useOptimizedProfile();

  // Stabilize calculateWalkingCalories to prevent infinite loops
  const stableCalculateWalkingCalories = useCallback(
    (duration: number, speed: number) => {
      if (calculateWalkingCalories) {
        return calculateWalkingCalories(duration, speed);
      }
      return 0;
    },
    [calculateWalkingCalories]
  );

  // Memoize session-related values to prevent infinite re-renders
  const sessionId = currentSession?.id;
  const sessionStatus = currentSession?.status;
  const sessionStartTime = currentSession?.start_time;
  const totalPauseDuration = currentSession?.total_pause_duration;

  // Update stats every 30 seconds when active - fixed dependencies to prevent infinite loops
  useEffect(() => {
    if (!sessionId || sessionStatus !== 'active') {
      // Only update if stats are not already reset
      setWalkingStats(prev => {
        if (prev.calories === 0 && prev.distance === 0) return prev;
        return {
          calories: 0,
          distance: 0,
          pace: '',
          startTime: '',
          fatBurned: 0
        };
      });
      return;
    }

    const updateStats = () => {
      const now = new Date();
      const startTime = new Date(sessionStartTime);
      
      // Calculate elapsed time in seconds first, then convert
      const totalElapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const pauseDurationSeconds = totalPauseDuration || 0;
      const activeElapsedSeconds = Math.max(0, totalElapsedSeconds - pauseDurationSeconds);
      const activeDurationMinutes = activeElapsedSeconds / 60;

      if (activeDurationMinutes <= 0) return;

      // Use proper MET-based calorie calculation with user profile
      let calories = 0;
      if (profile?.weight && calculateWalkingCalories) {
        calories = calculateWalkingCalories(activeDurationMinutes, selectedSpeed);
      } else {
        // Fallback calculation if no profile
        const met = selectedSpeed <= 3 ? 3.0 : selectedSpeed <= 4 ? 3.5 : 4.0;
        const hours = activeDurationMinutes / 60;
        calories = Math.round(met * 70 * hours); // Assume 70kg if no profile
      }
      
      // Correct distance calculation 
      const distanceMiles = (activeDurationMinutes / 60) * selectedSpeed;
      
      // Simple pace calculation
      const paceMinutesPerMile = selectedSpeed > 0 ? 60 / selectedSpeed : 0;
      const paceMinutes = Math.floor(paceMinutesPerMile);
      const paceSeconds = Math.round((paceMinutesPerMile - paceMinutes) * 60);
      const pace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/mi`;

      // Format start time
      const startTimeFormatted = startTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Correct fat calculation (1g fat = 9 calories)
      const fatBurned = parseFloat((calories / 9).toFixed(1));

      const newStats = {
        calories,
        distance: parseFloat(distanceMiles.toFixed(2)),
        pace,
        startTime: startTimeFormatted,
        fatBurned
      };

      // Only update if values have changed significantly to prevent unnecessary re-renders
      setWalkingStats(prev => {
        if (Math.abs(prev.calories - newStats.calories) < 1 && 
            Math.abs(prev.distance - newStats.distance) < 0.01) {
          return prev;
        }
        return newStats;
      });
    };

    // Update immediately
    updateStats();

    // Set up interval for updates every 30 seconds (for real-time feedback)
    const interval = setInterval(updateStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, sessionStatus, sessionStartTime, totalPauseDuration, selectedSpeed, profile?.weight]);

  const contextValue = useMemo(() => ({ walkingStats }), [walkingStats]);

  return (
    <SimpleWalkingStatsContext.Provider value={contextValue}>
      {children}
    </SimpleWalkingStatsContext.Provider>
  );
};

export const useSimpleWalkingStats = () => {
  const context = useContext(SimpleWalkingStatsContext);
  if (context === undefined) {
    // Return default values instead of throwing an error
    return {
      walkingStats: {
        calories: 0,
        distance: 0,
        pace: '',
        startTime: '',
        fatBurned: 0
      }
    };
  }
  return context;
};
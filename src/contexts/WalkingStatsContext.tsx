import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';

interface WalkingStats {
  realTimeCalories: number;
  realTimeDistance: number;
  timeElapsed: number;
  isActive: boolean;
  isPaused: boolean;
  currentSessionId: string | null;
}

interface WalkingStatsContextType {
  walkingStats: WalkingStats;
}

const WalkingStatsContext = createContext<WalkingStatsContextType | undefined>(undefined);

export const WalkingStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walkingStats, setWalkingStats] = useState<WalkingStats>({
    realTimeCalories: 0,
    realTimeDistance: 0,
    timeElapsed: 0,
    isActive: false,
    isPaused: false,
    currentSessionId: null
  });

  const { currentSession, isPaused, selectedSpeed } = useWalkingSession();
  const { profile } = useProfile();

  // Memoize profile checks to prevent re-renders
  const isProfileComplete = useMemo(() => {
    return !!(profile && profile.weight && profile.height && profile.age);
  }, [profile?.weight, profile?.height, profile?.age]);

  const calculateCalories = useMemo(() => {
    return (durationMinutes: number, speedMph: number = 3) => {
      if (!profile || !profile.weight) return 0;
      
      const metValues: { [key: number]: number } = {
        2: 2.8, 3: 3.2, 4: 4.3, 5: 5.5
      };
      const met = metValues[speedMph] || 3.2;
      
      let weightKg: number;
      if (profile?.units === 'metric') {
        weightKg = profile.weight;
      } else {
        weightKg = profile.weight * 0.453592;
      }
      
      return Math.round(met * weightKg * (durationMinutes / 60));
    };
  }, [profile?.weight, profile?.units]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let mounted = true;

    const updateStats = () => {
      if (!mounted || !currentSession) return;
      
      const startTime = new Date(currentSession.start_time);
      const now = new Date();
      let totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      // Subtract paused time for accurate calculation
      const pausedTime = currentSession.total_pause_duration || 0;
      const activeElapsed = Math.max(0, totalElapsed - pausedTime);

      // Calculate real-time stats based on active time only
      const activeDurationMinutes = activeElapsed / 60;
      const speedMph = currentSession.speed_mph || selectedSpeed || 3;
      
      let calories = 0;
      if (isProfileComplete) {
        calories = calculateCalories(activeDurationMinutes, speedMph);
      }
      
      // Convert distance based on unit preference
      let distance = (activeDurationMinutes / 60) * speedMph;
      if (profile?.units === 'metric') {
        distance = distance * 1.60934; // Convert miles to km
      }

      if (mounted) {
        setWalkingStats({
          realTimeCalories: calories,
          realTimeDistance: Math.round(distance * 100) / 100,
          timeElapsed: activeElapsed,
          isActive: true,
          isPaused: false,
          currentSessionId: currentSession.id
        });
      }
    };

    if (currentSession && !isPaused) {
      // Update immediately
      updateStats();
      // Then set interval for regular updates
      interval = setInterval(updateStats, 1000);
    } else if (currentSession && isPaused) {
      // Keep last known values but mark as paused
      if (mounted) {
        setWalkingStats(prev => ({
          ...prev,
          isActive: true,
          isPaused: true,
          currentSessionId: currentSession.id
        }));
      }
    } else {
      // No active session
      if (mounted) {
        setWalkingStats({
          realTimeCalories: 0,
          realTimeDistance: 0,
          timeElapsed: 0,
          isActive: false,
          isPaused: false,
          currentSessionId: null
        });
      }
    }

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [currentSession?.id, currentSession?.start_time, currentSession?.total_pause_duration, currentSession?.speed_mph, selectedSpeed, isPaused, isProfileComplete, calculateCalories, profile?.units]);

  return (
    <WalkingStatsContext.Provider value={{ walkingStats }}>
      {children}
    </WalkingStatsContext.Provider>
  );
};

export const useWalkingStats = () => {
  const context = useContext(WalkingStatsContext);
  if (context === undefined) {
    // Return default values instead of throwing an error
    return {
      walkingStats: {
        realTimeCalories: 0,
        realTimeDistance: 0,
        timeElapsed: 0,
        isActive: false,
        isPaused: false,
        currentSessionId: null
      }
    };
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { useStepEstimation } from '@/utils/stepEstimation';

interface WalkingStats {
  realTimeCalories: number;
  realTimeDistance: number;
  realTimeSteps: number;
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
    realTimeSteps: 0,
    timeElapsed: 0,
    isActive: false,
    isPaused: false,
    currentSessionId: null
  });

  const { currentSession, isPaused, selectedSpeed, refreshTrigger } = useWalkingSession();
  const { profile } = useProfile();
  const { estimateStepsForSession } = useStepEstimation();

  // Memoize profile checks to prevent re-renders
  const isProfileComplete = useMemo(() => {
    return profile?.weight && profile?.height && profile?.age;
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

  // Stable references to prevent infinite re-renders
  const sessionIdRef = useRef(currentSession?.id);
  const wasActiveRef = useRef(false);
  
  useEffect(() => {
    // Only trigger when session actually changes, not on every render
    if (sessionIdRef.current !== currentSession?.id) {
      sessionIdRef.current = currentSession?.id;
      wasActiveRef.current = !!currentSession;
    }
  }, [currentSession?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let mounted = true;

    const updateStats = () => {
      if (!mounted) return;
      
      if (!currentSession) {
        if (wasActiveRef.current) {
          // Only update if we were previously active
          setWalkingStats({
            realTimeCalories: 0,
            realTimeDistance: 0,
            realTimeSteps: 0,
            timeElapsed: 0,
            isActive: false,
            isPaused: false,
            currentSessionId: null
          });
          wasActiveRef.current = false;
        }
        return;
      }
      
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

      // Calculate estimated steps
      const estimatedSteps = estimateStepsForSession(activeDurationMinutes, speedMph);

      setWalkingStats({
        realTimeCalories: calories,
        realTimeDistance: Math.round(distance * 100) / 100,
        realTimeSteps: estimatedSteps,
        timeElapsed: activeElapsed,
        isActive: true,
        isPaused: isPaused || false,
        currentSessionId: currentSession.id
      });
      
      wasActiveRef.current = true;
    };

    if (currentSession && !isPaused) {
      // Update immediately then set interval
      updateStats();
      interval = setInterval(updateStats, 1000);
    } else if (currentSession && isPaused) {
      // Update once to mark as paused
      updateStats();
    } else if (!currentSession) {
      // Clear stats if no session
      updateStats();
    }

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentSession, isPaused, selectedSpeed, isProfileComplete, calculateCalories, profile?.units, estimateStepsForSession]);

  const contextValue = useMemo(() => ({ walkingStats }), [walkingStats]);

  return (
    <WalkingStatsContext.Provider value={contextValue}>
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
        realTimeSteps: 0,
        timeElapsed: 0,
        isActive: false,
        isPaused: false,
        currentSessionId: null
      }
    };
  }
  return context;
};

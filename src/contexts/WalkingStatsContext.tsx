import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useStableProfile } from '@/hooks/useStableProfile';
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
  const { profile } = useStableProfile();
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

  // Create refs at component level for stable access in intervals
  const currentSessionRef = useRef(currentSession);
  const isPausedRef = useRef(isPaused);
  const selectedSpeedRef = useRef(selectedSpeed);
  const isProfileCompleteRef = useRef(isProfileComplete);
  const calculateCaloriesRef = useRef(calculateCalories);
  const profileUnitsRef = useRef(profile?.units);
  const estimateStepsRef = useRef(estimateStepsForSession);

  // Separate interval effect with minimal dependencies
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let mounted = true;

    // Update refs when values change
    currentSessionRef.current = currentSession;
    isPausedRef.current = isPaused;
    selectedSpeedRef.current = selectedSpeed;
    isProfileCompleteRef.current = isProfileComplete;
    calculateCaloriesRef.current = calculateCalories;
    profileUnitsRef.current = profile?.units;
    estimateStepsRef.current = estimateStepsForSession;

    const updateStats = () => {
      if (!mounted) return;
      
      const session = currentSessionRef.current;
      const paused = isPausedRef.current;
      const speed = selectedSpeedRef.current;
      const profileComplete = isProfileCompleteRef.current;
      const calcCalories = calculateCaloriesRef.current;
      const units = profileUnitsRef.current;
      const estimateSteps = estimateStepsRef.current;
      
      if (!session) {
        if (wasActiveRef.current) {
          // Only update if we were previously active
          setWalkingStats(prev => {
            // Prevent update if already cleared
            if (!prev.isActive) return prev;
            
            return {
              realTimeCalories: 0,
              realTimeDistance: 0,
              realTimeSteps: 0,
              timeElapsed: 0,
              isActive: false,
              isPaused: false,
              currentSessionId: null
            };
          });
          wasActiveRef.current = false;
        }
        return;
      }
      
      const startTime = new Date(session.start_time);
      const now = new Date();
      let totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      // Subtract paused time for accurate calculation
      const pausedTime = session.total_pause_duration || 0;
      const activeElapsed = Math.max(0, totalElapsed - pausedTime);

      // Calculate real-time stats based on active time only
      const activeDurationMinutes = activeElapsed / 60;
      const speedMph = session.speed_mph || speed || 3;
      
      let calories = 0;
      if (profileComplete) {
        calories = calcCalories(activeDurationMinutes, speedMph);
      }
      
      // Convert distance based on unit preference
      let distance = (activeDurationMinutes / 60) * speedMph;
      if (units === 'metric') {
        distance = distance * 1.60934; // Convert miles to km
      }

      // Calculate estimated steps
      const estimatedSteps = estimateSteps(activeDurationMinutes, speedMph);

      setWalkingStats(prev => {
        // Only update if values actually changed to prevent unnecessary renders
        const newStats = {
          realTimeCalories: calories,
          realTimeDistance: Math.round(distance * 100) / 100,
          realTimeSteps: estimatedSteps,
          timeElapsed: activeElapsed,
          isActive: true,
          isPaused: paused || false,
          currentSessionId: session.id
        };
        
        // Shallow comparison to prevent unnecessary updates
        if (prev.realTimeCalories === newStats.realTimeCalories &&
            prev.realTimeDistance === newStats.realTimeDistance &&
            prev.realTimeSteps === newStats.realTimeSteps &&
            prev.timeElapsed === newStats.timeElapsed &&
            prev.isActive === newStats.isActive &&
            prev.isPaused === newStats.isPaused &&
            prev.currentSessionId === newStats.currentSessionId) {
          return prev; // No change, return previous state
        }
        
        return newStats;
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
  }, [currentSession?.id, isPaused, selectedSpeed]); // Minimal dependencies - only IDs/primitives

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

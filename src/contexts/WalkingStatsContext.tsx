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

  // Add state for incremental step counting
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [accumulatedSteps, setAccumulatedSteps] = useState<number>(0);

  const { currentSession, isPaused, selectedSpeed, refreshTrigger } = useWalkingSession();
  const { profile } = useStableProfile();
  const { estimateStepsForSession } = useStepEstimation();

  // Memoize profile checks to prevent re-renders - more robust check
  const isProfileComplete = useMemo(() => {
    const complete = !!(profile?.weight && profile?.height && profile?.age && 
      profile.weight > 0 && profile.height > 0 && profile.age > 0);
    console.log('Profile completeness check:', {
      complete,
      weight: profile?.weight,
      height: profile?.height, 
      age: profile?.age,
      profile: !!profile
    });
    return complete;
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
          // Reset accumulated steps and time when session ends
          setAccumulatedSteps(0);
          setLastUpdateTime(0);
          
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
      
      // Debug logging for calories calculation
      let calories = 0;
      if (profileComplete) {
        calories = calcCalories(activeDurationMinutes, speedMph);
        console.log('Calories calculation:', {
          profileComplete,
          activeDurationMinutes,
          speedMph,
          calories,
          profile: profile
        });
      } else {
        console.log('Profile incomplete for calories:', {
          profileComplete,
          weight: profile?.weight,
          height: profile?.height,
          age: profile?.age
        });
      }
      
      // Convert distance based on unit preference
      let distance = (activeDurationMinutes / 60) * speedMph;
      if (units === 'metric') {
        distance = distance * 1.60934; // Convert miles to km
      }

      // Smoother step calculation - calculate steps per second and accumulate
      const currentTime = Date.now();
      let newSteps = accumulatedSteps;
      
      if (lastUpdateTime > 0) {
        const timeDiff = (currentTime - lastUpdateTime) / 1000; // seconds
        
        // Calculate steps per second based on speed
        const heightInches = units === 'metric' ? (profile?.height || 70) / 2.54 : (profile?.height || 70);
        const baseStride = heightInches * 0.414;
        let speedFactor = 1.0;
        if (speedMph <= 2.5) speedFactor = 0.9;
        else if (speedMph <= 3.5) speedFactor = 1.0;
        else if (speedMph <= 4.5) speedFactor = 1.1;
        else speedFactor = 1.2;
        
        const strideInches = baseStride * speedFactor;
        const stepsPerMile = 63360 / strideInches;
        const stepsPerSecond = (speedMph * stepsPerMile) / 3600; // 3600 seconds in an hour
        
        const incrementalSteps = stepsPerSecond * timeDiff;
        newSteps = accumulatedSteps + incrementalSteps;
        
        setAccumulatedSteps(newSteps);
      }
      
      setLastUpdateTime(currentTime);

      setWalkingStats(prev => {
        // Use the newly calculated steps for smoother progression
        const smoothSteps = Math.round(newSteps);
        
        const newStats = {
          realTimeCalories: calories,
          realTimeDistance: Math.round(distance * 100) / 100,
          realTimeSteps: smoothSteps,
          timeElapsed: activeElapsed,
          isActive: true,
          isPaused: paused || false,
          currentSessionId: session.id
        };
        
        // Only update if significant changes to prevent excessive renders
        const shouldUpdate = 
          Math.abs(prev.realTimeCalories - newStats.realTimeCalories) >= 1 ||
          Math.abs(prev.realTimeDistance - newStats.realTimeDistance) >= 0.01 ||
          Math.abs(prev.realTimeSteps - newStats.realTimeSteps) >= 1 ||
          Math.abs(prev.timeElapsed - newStats.timeElapsed) >= 1 ||
          prev.isActive !== newStats.isActive ||
          prev.isPaused !== newStats.isPaused ||
          prev.currentSessionId !== newStats.currentSessionId;
        
        if (!shouldUpdate) {
          return prev;
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

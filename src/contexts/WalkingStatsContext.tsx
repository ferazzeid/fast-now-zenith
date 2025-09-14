import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useOptimizedProfile } from '@/hooks/optimized/useOptimizedProfile';
import { useStepEstimation } from '@/utils/stepEstimation';

// Performance optimized walking stats - updates every minute when active

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
  const { profile, loading: profileLoading } = useOptimizedProfile();
  const { estimateStepsForSession } = useStepEstimation();

  // Simplified profile check - no dependency on loading state for initial display
  const isProfileComplete = useMemo(() => {
    return !!(profile?.weight && profile?.height && profile?.age && 
      profile.weight > 0 && profile.height > 0 && profile.age > 0);
  }, [profile?.weight, profile?.height, profile?.age]);

  const calculateCalories = useMemo(() => {
    return (durationMinutes: number, speedMph: number = 3) => {
      if (!profile || !profile.weight) return 0;
      
      const metValues: { [key: number]: number } = {
        2: 2.8, 3: 3.2, 4: 4.3, 5: 5.5
      };
      const met = metValues[speedMph] || 3.2;
      
      // Weight is already in kg
      const weightKg = profile.weight;
      
      return Math.round(met * weightKg * (durationMinutes / 60));
    };
  }, [profile?.weight]);

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
      estimateStepsRef.current = estimateStepsForSession;

    const updateStats = () => {
      if (!mounted) return;
      
      const session = currentSessionRef.current;
      const paused = isPausedRef.current;
      const speed = selectedSpeedRef.current;
      const profileComplete = isProfileCompleteRef.current;
      const calcCalories = calculateCaloriesRef.current;
      
      const estimateSteps = estimateStepsRef.current;
      
      if (!session) {
        if (wasActiveRef.current) {
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
        console.log('WalkingStats - Calories calculation:', {
          profileComplete,
          activeDurationMinutes,
          speedMph,
          calories,
          hasProfile: !!profile,
          profileWeight: profile?.weight,
          
        });
      } else {
        console.log('WalkingStats - Profile incomplete for calories:', {
          profileComplete,
          weight: profile?.weight,
          height: profile?.height,
          age: profile?.age,
          hasProfile: !!profile
        });
      }
      
      // Distance calculation - store in km but display according to user preference
      let distanceKm = (activeDurationMinutes / 60) * speedMph * 1.60934;

      // Step calculation using metric system (height in cm)
      const heightCm = profile?.height || 175; // Default 175cm
      const heightInches = heightCm / 2.54;
      const baseStride = heightInches * 0.37; // Conservative stride multiplier
      
      // Speed-based stride adjustment
      let speedFactor = 1.0;
      if (speedMph <= 2.5) speedFactor = 0.85;      // Slow pace
      else if (speedMph <= 3.5) speedFactor = 1.0;  // Average pace
      else if (speedMph <= 4.5) speedFactor = 1.15; // Brisk pace
      else speedFactor = 1.3;                        // Fast pace
      
      const strideInches = baseStride * speedFactor;
      const distanceInches = distanceKm * 39370.1; // Convert km to inches
      const totalSteps = Math.round(distanceInches / strideInches);

      setWalkingStats(prev => {
        const newStats = {
          realTimeCalories: calories,
          realTimeDistance: Math.round(distanceKm * 100) / 100,
          realTimeSteps: totalSteps,
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
      // Update immediately then set interval every 60 seconds only when active
      updateStats();
      interval = setInterval(updateStats, 60000); // 60 seconds when active for better performance
    } else if (currentSession && isPaused) {
      // Update once to mark as paused, then stop updates
      updateStats();
    } else if (!currentSession) {
      // Clear stats if no session, then stop updates
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

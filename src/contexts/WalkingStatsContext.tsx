import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const { profile, isProfileComplete, calculateWalkingCalories } = useProfile();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession && !isPaused) {
      interval = setInterval(() => {
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
        if (isProfileComplete()) {
          calories = calculateWalkingCalories(activeDurationMinutes, speedMph);
        }
        
        // Convert distance based on unit preference
        let distance = (activeDurationMinutes / 60) * speedMph;
        if (profile?.units === 'metric') {
          distance = distance * 1.60934; // Convert miles to km
        }

        setWalkingStats({
          realTimeCalories: calories,
          realTimeDistance: Math.round(distance * 100) / 100,
          timeElapsed: activeElapsed,
          isActive: true,
          isPaused: false,
          currentSessionId: currentSession.id
        });
      }, 1000);
    } else if (currentSession && isPaused) {
      // Keep last known values but mark as paused
      setWalkingStats(prev => ({
        ...prev,
        isActive: true,
        isPaused: true,
        currentSessionId: currentSession.id
      }));
    } else {
      // No active session
      setWalkingStats({
        realTimeCalories: 0,
        realTimeDistance: 0,
        timeElapsed: 0,
        isActive: false,
        isPaused: false,
        currentSessionId: null
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession, selectedSpeed, isPaused, isProfileComplete, calculateWalkingCalories, profile?.units]);

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

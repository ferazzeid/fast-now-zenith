import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useWalkingSession } from '@/hooks/useWalkingSession';

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

  // Update stats every 2 minutes when active (reduced frequency)
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'active') {
      setWalkingStats({
        calories: 0,
        distance: 0,
        pace: '',
        startTime: '',
        fatBurned: 0
      });
      return;
    }

    const updateStats = () => {
      const now = new Date();
      const startTime = new Date(currentSession.start_time);
      const totalElapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
      const pauseDurationMinutes = currentSession.total_pause_duration ? currentSession.total_pause_duration / 60 : 0;
      const activeDurationMinutes = totalElapsedMinutes - pauseDurationMinutes;

      if (activeDurationMinutes <= 0) return;

      // Speed-based calorie calculations (varies by speed)
      const caloriesPerMinute = Math.max(3, selectedSpeed * 1.2); // More calories for faster speeds
      const calories = Math.round(activeDurationMinutes * caloriesPerMinute);
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

      // Simple fat burned estimate
      const fatBurned = Math.round(calories * 0.2);

      setWalkingStats({
        calories,
        distance: parseFloat(distanceMiles.toFixed(2)),
        pace,
        startTime: startTimeFormatted,
        fatBurned
      });
    };

    // Update immediately
    updateStats();

    // Set up interval for updates every 30 seconds (for real-time feedback)
    const interval = setInterval(updateStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSession, selectedSpeed]);

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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFastingSession } from './useFastingSession';
import { useWalkingSession } from './useWalkingSession';

export type TimerMode = 'fasting' | 'walking';

interface TimerStatus {
  fasting: {
    isActive: boolean;
    timeElapsed: number;
  };
  walking: {
    isActive: boolean;
    timeElapsed: number;
  };
}

export const useTimerNavigation = () => {
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState<TimerMode>('fasting');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>({
    fasting: { isActive: false, timeElapsed: 0 },
    walking: { isActive: false, timeElapsed: 0 }
  });

  const { currentSession: fastingSession } = useFastingSession();
  const { currentSession: walkingSession } = useWalkingSession();

  // Update timer status based on active sessions
  useEffect(() => {
    const updateTimerStatus = () => {
      const fastingActive = !!fastingSession;
      const walkingActive = !!walkingSession;

      let fastingElapsed = 0;
      let walkingElapsed = 0;

      if (fastingSession) {
        const startTime = new Date(fastingSession.start_time);
        const now = new Date();
        fastingElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      }

      if (walkingSession) {
        const startTime = new Date(walkingSession.start_time);
        const now = new Date();
        walkingElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      }

      setTimerStatus({
        fasting: { isActive: fastingActive, timeElapsed: fastingElapsed },
        walking: { isActive: walkingActive, timeElapsed: walkingElapsed }
      });
    };

    updateTimerStatus();
    
    // Only update every 5 seconds to reduce performance impact
    const interval = setInterval(updateTimerStatus, 5000);
    return () => clearInterval(interval);
  }, [fastingSession, walkingSession]);

  const switchMode = (mode: TimerMode) => {
    setCurrentMode(mode);
    // Navigate to the appropriate timer page using React Router
    if (mode === 'walking') {
      navigate('/walking');
    } else {
      navigate('/');
    }
  };

  const getActiveTimerCount = () => {
    return (timerStatus.fasting.isActive ? 1 : 0) + (timerStatus.walking.isActive ? 1 : 0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    currentMode,
    timerStatus,
    switchMode,
    getActiveTimerCount,
    formatTime
  };
};
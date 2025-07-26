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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>({
    fasting: { isActive: false, timeElapsed: 0 },
    walking: { isActive: false, timeElapsed: 0 }
  });

  const { currentSession: fastingSession } = useFastingSession();
  const { currentSession: walkingSession } = useWalkingSession();

  // Update timer status based on active sessions
  useEffect(() => {
    const updateTimerStatus = () => {
      const fastingActive = !!fastingSession && fastingSession.status === 'active';
      const walkingActive = !!walkingSession && walkingSession.status === 'active';

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
        let totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Subtract paused time
        const pausedTime = walkingSession.total_pause_duration || 0;
        let currentPauseTime = 0;
        
        // If currently paused, add current pause duration
        if (walkingSession.session_state === 'paused' && walkingSession.pause_start_time) {
          currentPauseTime = Math.floor((now.getTime() - new Date(walkingSession.pause_start_time).getTime()) / 1000);
        }
        
        walkingElapsed = Math.max(0, totalElapsed - pausedTime - currentPauseTime);
      }

      setTimerStatus({
        fasting: { isActive: fastingActive, timeElapsed: fastingElapsed },
        walking: { isActive: walkingActive, timeElapsed: walkingElapsed }
      });
    };

    updateTimerStatus();
    
    // Update every second for accurate display
    const interval = setInterval(updateTimerStatus, 1000);
    return () => clearInterval(interval);
  }, [fastingSession, walkingSession]);

  const switchMode = (mode: TimerMode) => {
    setCurrentMode(mode);
    setSheetOpen(false); // Auto-close the sheet
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
    sheetOpen,
    setSheetOpen,
    switchMode,
    getActiveTimerCount,
    formatTime
  };
};
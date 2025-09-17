import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFastingSessionQuery } from './optimized/useFastingSessionQuery';
import { useOptimizedWalkingSession } from './optimized/useOptimizedWalkingSession';
import { useIntermittentFasting } from './useIntermittentFasting';

export type TimerMode = 'fasting' | 'walking' | 'if';

interface TimerStatus {
  fasting: {
    isActive: boolean;
    timeElapsed: number;
  };
  walking: {
    isActive: boolean;
    timeElapsed: number;
  };
  if: {
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
    walking: { isActive: false, timeElapsed: 0 },
    if: { isActive: false, timeElapsed: 0 }
  });

  const { currentSession: fastingSession } = useFastingSessionQuery();
  const { currentSession: walkingSession, elapsedTime: walkingElapsedTime } = useOptimizedWalkingSession();
  const { todaySession: ifSession } = useIntermittentFasting();

  // Optimized timer status - only update when sessions are active
  useEffect(() => {
    const updateTimerStatus = () => {
      const fastingActive = !!fastingSession && fastingSession.status === 'active';
      const walkingActive = !!walkingSession && ['active', 'paused'].includes(walkingSession.session_state || '');
      const ifActive = !!ifSession && ['fasting', 'eating'].includes(ifSession.status || '');

      let fastingElapsed = 0;
      let walkingElapsed = 0;
      let ifElapsed = 0;

      if (fastingSession && fastingActive) {
        const startTime = new Date(fastingSession.start_time);
        const now = new Date();
        fastingElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      }

      // Use the calculated elapsed time from the hook for walking
      if (walkingSession && walkingActive) {
        walkingElapsed = walkingElapsedTime || 0;
      }

      // Calculate IF elapsed time based on current window
      if (ifSession && ifActive) {
        const now = new Date();
        if (ifSession.status === 'fasting' && ifSession.fasting_start_time) {
          const startTime = new Date(ifSession.fasting_start_time);
          ifElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        } else if (ifSession.status === 'eating' && ifSession.eating_start_time) {
          const startTime = new Date(ifSession.eating_start_time);
          ifElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        }
      }

      setTimerStatus({
        fasting: { isActive: fastingActive, timeElapsed: fastingElapsed },
        walking: { isActive: walkingActive, timeElapsed: walkingElapsed },
        if: { isActive: ifActive, timeElapsed: ifElapsed }
      });
    };

    let interval: NodeJS.Timeout | undefined;
    
    // Only set up interval if there are active sessions
    if ((fastingSession && fastingSession.status === 'active') || 
        (walkingSession && ['active', 'paused'].includes(walkingSession.session_state || '')) ||
        (ifSession && ['fasting', 'eating'].includes(ifSession.status || ''))) {
      updateTimerStatus();
      interval = setInterval(updateTimerStatus, 1000);
    } else {
      // Update once to clear any inactive sessions
      updateTimerStatus();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fastingSession?.status, walkingSession?.session_state, fastingSession?.start_time, walkingSession?.start_time, walkingElapsedTime, ifSession?.status, ifSession?.fasting_start_time, ifSession?.eating_start_time]);

  // Additional effect to monitor session state changes for immediate sync
  useEffect(() => {
    const updateTimerStatus = () => {
      const fastingActive = !!fastingSession && fastingSession.status === 'active';
      const walkingActive = !!walkingSession && ['active', 'paused'].includes(walkingSession.session_state || '');
      const ifActive = !!ifSession && ['fasting', 'eating'].includes(ifSession.status || '');

      let fastingElapsed = 0;
      let walkingElapsed = 0;
      let ifElapsed = 0;

      if (fastingSession && fastingActive) {
        const startTime = new Date(fastingSession.start_time);
        const now = new Date();
        fastingElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      }

      // Use the calculated elapsed time from the hook for walking
      if (walkingSession && walkingActive) {
        walkingElapsed = walkingElapsedTime || 0;
      }

      setTimerStatus({
        fasting: { isActive: fastingActive, timeElapsed: fastingElapsed },
        walking: { isActive: walkingActive, timeElapsed: walkingElapsed },
        if: { isActive: ifActive, timeElapsed: ifElapsed }
      });
    };

    updateTimerStatus();
  }, [walkingSession?.id, walkingSession?.session_state, fastingSession?.id, fastingSession?.status, walkingElapsedTime]);

  const switchMode = (mode: TimerMode) => {
    setCurrentMode(mode);
    setSheetOpen(false); // Auto-close the sheet
    // Navigate to the appropriate timer page using React Router
    if (mode === 'walking') {
      navigate('/walking');
    } else if (mode === 'if') {
      navigate('/intermittent-fasting');
    } else {
      navigate('/');
    }
  };

  const getActiveTimerCount = () => {
    return (timerStatus.fasting.isActive ? 1 : 0) + 
           (timerStatus.walking.isActive ? 1 : 0) + 
           (timerStatus.if.isActive ? 1 : 0);
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
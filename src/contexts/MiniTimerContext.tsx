import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface TimerData {
  id: string;
  type: 'fasting' | 'walking' | 'if' | 'if-eating';
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  progress?: number;
  startTime?: string;
  realTimeStats?: {
    speed?: number;
    distance?: number;
    calories?: number;
  };
}

interface MiniTimerContextType {
  timers: TimerData[];
  showMiniTimer: boolean;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  size: 'small' | 'medium' | 'large';
  opacity: number;
  autoHide: boolean;
  autoHideDelay: number;
  
  updateTimer: (timerId: string, data: Partial<TimerData>) => void;
  removeTimer: (timerId: string) => void;
  setShowMiniTimer: (show: boolean) => void;
  setPosition: (position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right') => void;
  setSize: (size: 'small' | 'medium' | 'large') => void;
  setOpacity: (opacity: number) => void;
  setAutoHide: (autoHide: boolean) => void;
  setAutoHideDelay: (delay: number) => void;
  
  hasActiveTimers: boolean;
  getActiveTimerCount: () => number;
}

const MiniTimerContext = createContext<MiniTimerContextType | undefined>(undefined);

export const useMiniTimer = () => {
  const context = useContext(MiniTimerContext);
  if (!context) {
    throw new Error('useMiniTimer must be used within a MiniTimerProvider');
  }
  return context;
};

export const MiniTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timers, setTimers] = useState<TimerData[]>([]);
  const [showMiniTimer, setShowMiniTimerState] = useState(() => {
    const saved = localStorage.getItem('miniTimer.enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [position, setPositionState] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>(() => {
    const saved = localStorage.getItem('miniTimer.position');
    return (saved as any) || 'bottom-left';
  });
  const [size, setSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('miniTimer.size');
    return (saved as any) || 'medium';
  });
  const [opacity, setOpacityState] = useState(() => {
    const saved = localStorage.getItem('miniTimer.opacity');
    return saved ? parseFloat(saved) : 0.9;
  });
  const [autoHide, setAutoHideState] = useState(() => {
    const saved = localStorage.getItem('miniTimer.autoHide');
    return saved ? JSON.parse(saved) : false;
  });
  const [autoHideDelay, setAutoHideDelayState] = useState(() => {
    const saved = localStorage.getItem('miniTimer.autoHideDelay');
    return saved ? parseInt(saved) : 5000;
  });

  const updateTimer = useCallback((timerId: string, data: Partial<TimerData>) => {
    setTimers(prev => {
      const existing = prev.find(t => t.id === timerId);
      if (existing) {
        return prev.map(t => t.id === timerId ? { ...t, ...data } : t);
      } else {
        return [...prev, { id: timerId, ...data } as TimerData];
      }
    });
  }, []);

  const removeTimer = useCallback((timerId: string) => {
    setTimers(prev => prev.filter(t => t.id !== timerId));
  }, []);

  const setShowMiniTimer = useCallback((show: boolean) => {
    setShowMiniTimerState(show);
    localStorage.setItem('miniTimer.enabled', JSON.stringify(show));
  }, []);

  const setPosition = useCallback((pos: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right') => {
    setPositionState(pos);
    localStorage.setItem('miniTimer.position', pos);
  }, []);

  const setSize = useCallback((sz: 'small' | 'medium' | 'large') => {
    setSizeState(sz);
    localStorage.setItem('miniTimer.size', sz);
  }, []);

  const setOpacity = useCallback((op: number) => {
    setOpacityState(op);
    localStorage.setItem('miniTimer.opacity', op.toString());
  }, []);

  const setAutoHide = useCallback((hide: boolean) => {
    setAutoHideState(hide);
    localStorage.setItem('miniTimer.autoHide', JSON.stringify(hide));
  }, []);

  const setAutoHideDelay = useCallback((delay: number) => {
    setAutoHideDelayState(delay);
    localStorage.setItem('miniTimer.autoHideDelay', delay.toString());
  }, []);

  const hasActiveTimers = timers.some(t => t.isActive);
  const getActiveTimerCount = useCallback(() => timers.filter(t => t.isActive).length, [timers]);

  // Clean up inactive timers after a delay
  useEffect(() => {
    const cleanup = setTimeout(() => {
      setTimers(prev => prev.filter(t => t.isActive));
    }, 30000); // Clean up after 30 seconds of inactivity

    return () => clearTimeout(cleanup);
  }, [timers]);

  return (
    <MiniTimerContext.Provider value={{
      timers,
      showMiniTimer,
      position,
      size,
      opacity,
      autoHide,
      autoHideDelay,
      
      updateTimer,
      removeTimer,
      setShowMiniTimer,
      setPosition,
      setSize,
      setOpacity,
      setAutoHide,
      setAutoHideDelay,
      
      hasActiveTimers,
      getActiveTimerCount
    }}>
      {children}
    </MiniTimerContext.Provider>
  );
};
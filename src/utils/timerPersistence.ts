// Timer persistence utilities for offline mode
export interface PersistedFastingSession {
  id: string;
  start_time: string;
  goal_duration_seconds?: number;
  status: 'active' | 'completed' | 'cancelled';
  user_id: string;
}

export interface PersistedWalkingSession {
  id: string;
  user_id: string;
  start_time: string;
  status: string;
  speed_mph?: number;
  session_state?: string;
  pause_start_time?: string;
  total_pause_duration?: number;
}

const FASTING_SESSION_KEY = 'fastnow_fasting_session';
const WALKING_SESSION_KEY = 'fastnow_walking_session';

// Fasting session persistence
export const persistFastingSession = (session: PersistedFastingSession | null) => {
  if (typeof localStorage === 'undefined') return;
  
  if (session) {
    localStorage.setItem(FASTING_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(FASTING_SESSION_KEY);
  }
};

export const getPersistedFastingSession = (): PersistedFastingSession | null => {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(FASTING_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Walking session persistence
export const persistWalkingSession = (session: PersistedWalkingSession | null) => {
  if (typeof localStorage === 'undefined') return;
  
  if (session) {
    localStorage.setItem(WALKING_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(WALKING_SESSION_KEY);
  }
};

export const getPersistedWalkingSession = (): PersistedWalkingSession | null => {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(WALKING_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Calculate elapsed time for persisted sessions
export const calculateElapsedTime = (startTime: string, isPaused?: boolean, pauseStartTime?: string, totalPauseDuration?: number): number => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  let elapsed = Math.floor((now - start) / 1000);
  
  // Subtract pause durations
  if (totalPauseDuration) {
    elapsed -= totalPauseDuration;
  }
  
  // If currently paused, subtract current pause duration
  if (isPaused && pauseStartTime) {
    const currentPauseDuration = Math.floor((now - new Date(pauseStartTime).getTime()) / 1000);
    elapsed -= currentPauseDuration;
  }
  
  return Math.max(0, elapsed);
};
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CeramicAnimationType } from '@/components/CeramicCelebrationEffects';

export interface MilestoneEvent {
  type: 'hourly' | 'completion';
  hours: number;
  message: string;
}

interface CelebrationState {
  lastMilestoneHour: number;
  isVisible: boolean;
  currentEvent: MilestoneEvent | null;
  animationType: CeramicAnimationType;
}

// Persistent storage key for celebrated milestones per session
const CELEBRATION_STORAGE_KEY = 'fasting_celebrated_milestones';

// Get celebrated milestones for current session from localStorage
const getCelebratedMilestones = (sessionId?: string): Set<number> => {
  if (!sessionId) return new Set();
  
  try {
    const stored = localStorage.getItem(`${CELEBRATION_STORAGE_KEY}_${sessionId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Store celebrated milestone for current session
const storeCelebratedMilestone = (sessionId: string, hour: number) => {
  try {
    const celebrated = getCelebratedMilestones(sessionId);
    celebrated.add(hour);
    localStorage.setItem(`${CELEBRATION_STORAGE_KEY}_${sessionId}`, JSON.stringify([...celebrated]));
  } catch {
    // Silent fail for localStorage issues
  }
};

const getRandomAnimationType = (): CeramicAnimationType => {
  const types: CeramicAnimationType[] = ['ring-pulse', 'particle-burst', 'color-wave', 'fireworks'];
  return types[Math.floor(Math.random() * types.length)];
};

export const useCelebrationMilestones = (sessionId?: string) => {
  const [celebration, setCelebration] = useState<CelebrationState>({
    lastMilestoneHour: 0,
    isVisible: false,
    currentEvent: null,
    animationType: 'ring-pulse'
  });
  const { toast } = useToast();

  const triggerCelebration = useCallback((event: MilestoneEvent) => {
    // For admin testing, skip localStorage restrictions
    // For normal sessions, check if already celebrated
    if (sessionId && !event.message.includes('🎉 Testing')) {
      const celebrated = getCelebratedMilestones(sessionId);
      if (celebrated.has(event.hours)) {
        console.log(`Milestone ${event.hours} already celebrated for session ${sessionId}, skipping`);
        return;
      }
      
      // Store that we've celebrated this milestone
      storeCelebratedMilestone(sessionId, event.hours);
    }
    
    console.log(`🎉 Triggering celebration for ${event.type} milestone:`, event);
    
    setCelebration({
      lastMilestoneHour: event.hours,
      isVisible: true,
      currentEvent: event,
      animationType: getRandomAnimationType()
    });

    // Show toast notification
    toast({
      title: "🎉 Milestone Reached!",
      description: event.message,
      duration: 5000,
    });

    // Auto-hide celebration after 3 seconds
    setTimeout(() => {
      setCelebration(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, [toast, sessionId]);

  const checkForMilestones = useCallback((currentElapsedSeconds: number, goalDurationSeconds?: number) => {
    const currentHours = Math.floor(currentElapsedSeconds / 3600);
    
    if (!sessionId) return; // Don't check milestones without a session ID
    
    const celebrated = getCelebratedMilestones(sessionId);
    
    // Check for hourly milestones (every full hour)
    if (currentHours > 0 && !celebrated.has(currentHours)) {
      const event: MilestoneEvent = {
        type: 'hourly',
        hours: currentHours,
        message: `${currentHours} hour${currentHours === 1 ? '' : 's'} of fasting completed!`
      };
      triggerCelebration(event);
      return;
    }

    // Check for completion milestone
    if (goalDurationSeconds && currentElapsedSeconds >= goalDurationSeconds) {
      const goalHours = Math.floor(goalDurationSeconds / 3600);
      if (!celebrated.has(goalHours)) {
        const event: MilestoneEvent = {
          type: 'completion',
          hours: goalHours,
          message: `🏆 Goal completed! ${goalHours} hour fast achieved!`
        };
        triggerCelebration(event);
      }
    }
  }, [sessionId, triggerCelebration]);

  const resetMilestones = useCallback(() => {
    setCelebration({
      lastMilestoneHour: 0,
      isVisible: false,
      currentEvent: null,
      animationType: 'ring-pulse'
    });
    
    // Clear celebrated milestones for this session when starting a new fast
    if (sessionId) {
      try {
        localStorage.removeItem(`${CELEBRATION_STORAGE_KEY}_${sessionId}`);
      } catch {
        // Silent fail for localStorage issues
      }
    }
  }, [sessionId]);

  const closeCelebration = useCallback(() => {
    setCelebration(prev => ({ 
      ...prev, 
      isVisible: false,
      animationType: getRandomAnimationType() // Generate new animation for next celebration
    }));
  }, []);

  return {
    celebration,
    checkForMilestones,
    resetMilestones,
    triggerCelebration,
    closeCelebration
  };
};
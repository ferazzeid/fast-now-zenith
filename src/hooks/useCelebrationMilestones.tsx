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
  enhancedVisible: boolean; // New enhanced celebration visibility
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

const getAnimationTypeForMilestone = (type: 'hourly' | 'completion', hours: number): CeramicAnimationType => {
  // Simplified: always use color-wave for all milestones
  return 'color-wave';
};

// Enhanced milestone messages for different durations
const getEnhancedMilestoneMessage = (hours: number, type: 'hourly' | 'completion'): string => {
  if (type === 'completion') {
    if (hours >= 168) return `🏆 LEGENDARY! ${Math.floor(hours/24)} day fast completed!`;
    if (hours >= 120) return `🏆 INCREDIBLE! ${Math.floor(hours/24)} day fast completed!`;
    if (hours >= 96) return `🥇 AMAZING! ${Math.floor(hours/24)} day fast completed!`;
    if (hours >= 72) return `🥇 OUTSTANDING! 3 day fast completed!`;
    if (hours >= 48) return `🏅 EXCELLENT! 2 day fast completed!`;
    if (hours >= 24) return `🎖️ GREAT! 1 day fast completed!`;
    return `⭐ Fast completed! ${hours} hours achieved!`;
  }
  
  // Hourly milestones
  if (hours >= 168) return `🏆 ${Math.floor(hours/24)} days of pure dedication!`;
  if (hours >= 120) return `🏆 ${Math.floor(hours/24)} days - You're unstoppable!`;
  if (hours >= 96) return `🥇 ${Math.floor(hours/24)} days - Incredible willpower!`;
  if (hours >= 72) return `🥇 3+ days - Exceptional commitment!`;
  if (hours >= 48) return `🏅 ${hours} hours - You're crushing it!`;
  if (hours >= 24) return `🎖️ ${hours} hours - Amazing progress!`;
  if (hours >= 12) return `⭐ ${hours} hours - Great momentum!`;
  return `✨ ${hours} hour${hours === 1 ? '' : 's'} completed!`;
};

export const useCelebrationMilestones = (sessionId?: string) => {
  const [celebration, setCelebration] = useState<CelebrationState>({
    lastMilestoneHour: 0,
    isVisible: false,
    currentEvent: null,
    animationType: 'color-wave',
    enhancedVisible: false
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
    
    // Get the correct animation type for this milestone
    const animationType = getAnimationTypeForMilestone(event.type, event.hours);
    
    setCelebration({
      lastMilestoneHour: event.hours,
      isVisible: true,
      currentEvent: event,
      animationType: animationType,
      enhancedVisible: true // Show enhanced celebration
    });

    // Show toast notification for smaller milestones only
    if (event.hours < 4) {
      toast({
        title: "Milestone Reached!",
        description: event.message,
        duration: 3000,
      });
    }

    // Auto-hide celebration after duration based on milestone importance
    const duration = event.hours >= 96 ? 15000 : event.hours >= 48 ? 12000 : event.hours >= 24 ? 10000 : event.hours >= 12 ? 8000 : 6000;
    setTimeout(() => {
      setCelebration(prev => ({ ...prev, isVisible: false, enhancedVisible: false }));
    }, duration);
  }, [toast, sessionId]);

  const checkForMilestones = useCallback((currentElapsedSeconds: number, goalDurationSeconds?: number) => {
    const currentHours = Math.floor(currentElapsedSeconds / 3600);
    
    if (!sessionId) return; // Don't check milestones without a session ID
    
    const celebrated = getCelebratedMilestones(sessionId);
    
    // Enhanced milestone system for long fasts
    const shouldCelebrate = (hours: number): boolean => {
      if (hours <= 0) return false;
      
      // Short fasts (1-12h): Every hour
      if (hours <= 12) return true;
      
      // Medium fasts (12-24h): Every 3 hours starting at 12
      if (hours <= 24) return hours >= 12 && (hours - 12) % 3 === 0;
      
      // Long fasts (24-48h): Every 6 hours starting at 24  
      if (hours <= 48) return hours >= 24 && (hours - 24) % 6 === 0;
      
      // Epic fasts (48h+): Every 12 hours starting at 48
      if (hours >= 48) return (hours - 48) % 12 === 0;
      
      return false;
    };
    
    // Check for hourly milestones
    if (currentHours > 0 && shouldCelebrate(currentHours) && !celebrated.has(currentHours)) {
      const event: MilestoneEvent = {
        type: 'hourly',
        hours: currentHours,
        message: getEnhancedMilestoneMessage(currentHours, 'hourly')
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
          message: getEnhancedMilestoneMessage(goalHours, 'completion')
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
      animationType: 'color-wave',
      enhancedVisible: false
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
      enhancedVisible: false
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

// Enhanced milestone messages for different durations
const getEnhancedMilestoneMessage = (hours: number, type: 'hourly' | 'completion'): string => {
  if (type === 'completion') {
    if (hours >= 168) return `🏆 LEGENDARY! ${Math.floor(hours/24)} day fast completed!`;
    if (hours >= 120) return `🏆 INCREDIBLE! ${Math.floor(hours/24)} day fast completed!`;
    if (hours >= 96) return `🥇 AMAZING! ${Math.floor(hours/24)} day fast completed!`;
    if (hours >= 72) return `🥇 OUTSTANDING! 3 day fast completed!`;
    if (hours >= 48) return `🏅 EXCELLENT! 2 day fast completed!`;
    if (hours >= 24) return `🎖️ GREAT! 1 day fast completed!`;
    return `⭐ Fast completed! ${hours} hours achieved!`;
  }
  
  // Hourly milestones
  if (hours >= 168) return `🏆 ${Math.floor(hours/24)} days of pure dedication!`;
  if (hours >= 120) return `🏆 ${Math.floor(hours/24)} days - You're unstoppable!`;
  if (hours >= 96) return `🥇 ${Math.floor(hours/24)} days - Incredible willpower!`;
  if (hours >= 72) return `🥇 3+ days - Exceptional commitment!`;
  if (hours >= 48) return `🏅 ${hours} hours - You're crushing it!`;
  if (hours >= 24) return `🎖️ ${hours} hours - Amazing progress!`;
  if (hours >= 12) return `⭐ ${hours} hours - Great momentum!`;
  return `✨ ${hours} hour${hours === 1 ? '' : 's'} completed!`;
};

  const resetMilestones = useCallback(() => {
    setCelebration({
      lastMilestoneHour: 0,
      isVisible: false,
      currentEvent: null,
      animationType: 'color-wave',
      enhancedVisible: false
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
      enhancedVisible: false
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
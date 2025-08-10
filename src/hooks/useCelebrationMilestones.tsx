import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface MilestoneEvent {
  type: 'hourly' | 'completion';
  hours: number;
  message: string;
}

interface CelebrationState {
  lastMilestoneHour: number;
  isVisible: boolean;
  currentEvent: MilestoneEvent | null;
}

export const useCelebrationMilestones = () => {
  const [celebration, setCelebration] = useState<CelebrationState>({
    lastMilestoneHour: 0,
    isVisible: false,
    currentEvent: null
  });
  const { toast } = useToast();

  const triggerCelebration = useCallback((event: MilestoneEvent) => {
    console.log(`🎉 Triggering celebration for ${event.type} milestone:`, event);
    
    setCelebration({
      lastMilestoneHour: event.hours,
      isVisible: true,
      currentEvent: event
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
  }, [toast]);

  const checkForMilestones = useCallback((currentElapsedSeconds: number, goalDurationSeconds?: number) => {
    const currentHours = Math.floor(currentElapsedSeconds / 3600);
    
    // Check for hourly milestones (every full hour)
    if (currentHours > celebration.lastMilestoneHour && currentHours > 0) {
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
      if (celebration.lastMilestoneHour < goalHours) {
        const event: MilestoneEvent = {
          type: 'completion',
          hours: goalHours,
          message: `🏆 Goal completed! ${goalHours} hour fast achieved!`
        };
        triggerCelebration(event);
      }
    }
  }, [celebration.lastMilestoneHour, triggerCelebration]);

  const resetMilestones = useCallback(() => {
    setCelebration({
      lastMilestoneHour: 0,
      isVisible: false,
      currentEvent: null
    });
  }, []);

  return {
    celebration,
    checkForMilestones,
    resetMilestones,
    triggerCelebration
  };
};
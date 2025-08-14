import { Brain, Settings, Utensils, Clock, Footprints } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useProfile } from '@/hooks/useProfile';
import { useFastingSessionQuery } from '@/hooks/optimized/useFastingSessionQuery';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { TimerBadge } from '@/components/TimerBadge';
import { TrialTimerBadge } from '@/components/TrialTimerBadge';
import { useAnimationControl } from '@/components/AnimationController';
import { useConnectionStore } from '@/stores/connectionStore';
import { PremiumGate } from '@/components/PremiumGate';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

export const Navigation = () => {
  const location = useLocation();
  const { timerStatus, formatTime } = useTimerNavigation();
  const { hasActiveNotifications, getHighPriorityNotifications } = useNotificationSystem();
  const { isProfileComplete } = useProfile();
  const { currentSession: fastingSession, refreshActiveSession } = useFastingSessionQuery();
  const { todayTotals } = useFoodEntriesQuery();
  const { currentSession: walkingSession } = useWalkingSession();
  const { isAnimationsSuspended } = useAnimationControl();
  const { isOnline } = useConnectionStore();
  const { inTrial, trialEndsAt } = useUnifiedSubscription();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Optimize timer updates - only update when needed for both fasting and walking
  useEffect(() => {
    if (isAnimationsSuspended) return;
    
    let interval: NodeJS.Timeout;
    
    // Update time if there's an active fasting OR walking session
    const hasFastingSession = fastingSession && fastingSession.status === 'active';
    const hasWalkingSession = walkingSession && walkingSession.status === 'active';
    
    if (hasFastingSession || hasWalkingSession) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnimationsSuspended, fastingSession?.status, walkingSession?.status]);

  // Load active session on mount only - remove frequent polling
  useEffect(() => {
    refreshActiveSession();
  }, [refreshActiveSession]);

  // Memoize fasting badge calculation to prevent unnecessary recalculations
  const getFastingBadge = useMemo(() => {
    if (!fastingSession || fastingSession.status !== 'active') {
      return null;
    }
    
    const startTime = new Date(fastingSession.start_time).getTime();
    const elapsed = Math.floor((currentTime - startTime) / 1000); // seconds
    
    // Check if intermittent fasting and determine if in eating window
    const goalDuration = fastingSession.goal_duration_seconds || 0;
    const isIntermittent = goalDuration <= 23 * 3600; // 23 hours or less
    
    if (isIntermittent) {
      const eatingWindow = 8 * 60 * 60; // 8 hours eating window
      const totalCycleTime = goalDuration + eatingWindow;
      const cyclePosition = elapsed % totalCycleTime;
      const isInEatingWindow = cyclePosition >= goalDuration;
      
      if (isInEatingWindow) {
        // Show eating window countdown
        const eatingStartTime = cyclePosition - goalDuration;
        const eatingTimeRemaining = Math.max(0, eatingWindow - eatingStartTime);
        return { 
          time: formatTime(eatingTimeRemaining), 
          isEating: true,
          label: 'Eating'
        };
      } else {
        // Show current fast progress
        return { 
          time: formatTime(cyclePosition), 
          isEating: false,
          label: 'Fasting'
        };
      }
    }
    
    // Regular fasting display - show elapsed time
    return { 
      time: formatTime(elapsed), 
      isEating: false,
      label: 'Fasting'
    };
  }, [fastingSession, currentTime, formatTime]);
  
  // Memoize navigation items to prevent unnecessary re-renders
  const navItems = useMemo(() => [
    { 
      icon: Clock, 
      label: 'Fast', 
      path: '/',
      badge: getFastingBadge?.time || null,
      isEating: getFastingBadge?.isEating || false
    },
    { 
      icon: Footprints, 
      label: 'Walk', 
      path: '/walking',
      badge: walkingSession?.status === 'active' ? (() => {
        const startTime = new Date(walkingSession.start_time).getTime();
        let totalElapsed = Math.floor((currentTime - startTime) / 1000);
        
        // Subtract paused time
        const pausedTime = walkingSession.total_pause_duration || 0;
        let currentPauseTime = 0;
        
        // If currently paused, add current pause duration
        if (walkingSession.session_state === 'paused' && walkingSession.pause_start_time) {
          currentPauseTime = Math.floor((currentTime - new Date(walkingSession.pause_start_time).getTime()) / 1000);
        }
        
        const activeTime = Math.max(0, totalElapsed - pausedTime - currentPauseTime);
        return formatTime(activeTime);
      })() : null,
      isEating: false
    },
    { 
      icon: Utensils, 
      label: 'Food', 
      path: '/food-tracking', 
      isEating: false,
      caloriesBadge: todayTotals.calories > 0 ? Math.round(todayTotals.calories) : null
    },
    { 
      icon: Brain, 
      label: 'Goals', 
      path: '/motivators',
      isEating: false
    },
    { icon: Settings, label: 'Settings', path: '/settings', isEating: false },
  ], [getFastingBadge, walkingSession, formatTime, todayTotals.calories, currentTime]);

  const getConnectionStatus = () => {
    if (!isOnline) return { color: 'bg-red-500', tooltip: 'Offline - Changes will sync when connected', shouldPulse: false };
    return { color: 'bg-green-500', tooltip: 'Connected', shouldPulse: false };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <TooltipProvider>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="bg-ceramic-plate px-4 py-2">
          <div className="flex justify-around gap-1 relative">
            {/* Connection Status Indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 right-1 z-10">
                  <div className={`w-2 h-2 rounded-full ${connectionStatus.color} ${connectionStatus.shouldPulse ? 'animate-pulse' : ''}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{connectionStatus.tooltip}</p>
              </TooltipContent>
            </Tooltip>
            {/* Navigation Items */}
            {navItems.map(({ icon: Icon, label, path, badge, isEating, caloriesBadge }) => {
              const isActive = location.pathname === path;
              
              const getTooltipText = (label: string) => {
                switch (label) {
                  case 'Fast': return 'Start or manage your fasting sessions';
                  case 'Walk': return 'Track your walking sessions and burn calories';
                  case 'Food': return 'Log your meals and track daily intake';
                  case 'Goals': return 'View and create motivational content';
                  case 'Settings': return 'Customize your app preferences';
                  default: return label;
                }
              };
              
              const content = (
                <Link
                  to={path}
                  className={`relative flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 flex-1 min-w-0 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-warm-text hover:bg-ceramic-rim bg-ceramic-base/20 border border-ceramic-rim/30'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                  
                  {/* Timer badge for fasting/walking */}
                  {badge && (
                    <TimerBadge time={badge} isEating={isEating} />
                  )}
                  
                  {/* Calorie badge for food */}
                  {caloriesBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 text-xs rounded-full flex items-center justify-center font-medium bg-amber-500 text-amber-50 px-1">
                      {caloriesBadge}
                    </span>
                  )}
                  
                  {/* Trial countdown badge for Settings */}
                  {label === 'Settings' && inTrial && trialEndsAt && (
                    <TrialTimerBadge trialEndsAt={trialEndsAt} />
                  )}
                </Link>
              );

              return (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    {label === 'Food' ? (
                      <PremiumGate 
                        feature="Food Tracking" 
                        grayOutForFree={true}
                        className="flex-1 min-w-0"
                      >
                        {content}
                      </PremiumGate>
                    ) : (
                      content
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getTooltipText(label)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
};
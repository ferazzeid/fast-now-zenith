import { Brain, Settings, Utensils, Clock, Footprints, Lock, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useProfile } from '@/hooks/useProfile';
import { useFastingSessionQuery } from '@/hooks/optimized/useFastingSessionQuery';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useOptimizedWalkingSession } from '@/hooks/optimized/useOptimizedWalkingSession';
import { TimerBadge } from '@/components/TimerBadge';
import { CalorieBadge } from '@/components/CalorieBadge';
import { TrialTimerBadge } from '@/components/TrialTimerBadge';
import { useConnectionStore } from '@/stores/connectionStore';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';
import { useNavigationPreferences } from '@/hooks/useNavigationPreferences';

export const Navigation = () => {
  const location = useLocation();
  const { timerStatus, formatTime } = useTimerNavigation();
  const { hasActiveNotifications, getHighPriorityNotifications } = useNotificationSystem();
  const { isProfileComplete } = useProfile();
  const { currentSession: fastingSession, refreshActiveSession } = useFastingSessionQuery();
  const { todayTotals } = useFoodEntriesQuery();
  const { currentSession: walkingSession } = useOptimizedWalkingSession();
  const isAnimationsSuspended = false;
  const { isOnline } = useConnectionStore();
  const { isTrial: inTrial, daysRemaining, hasPremiumFeatures, hasFoodAccess, access_level, createSubscription, refetch } = useAccess();
  const { preferences, loading: preferencesLoading } = useNavigationPreferences();
  const { toast } = useToast();
  
  // Removed debug logging to prevent console spam
  
  // Calculate trial end date from days remaining
  const trialEndsAt = daysRemaining ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString() : null;
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

  // Only refresh access data on first mount, not on every navigation
  useEffect(() => {
    console.log('🧭 Navigation mounted - initial access check');
    // Remove aggressive refetch that was poisoning sessions
  }, []);

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
    { icon: User, label: 'Settings', path: '/settings', isEating: false },
  ], [getFastingBadge, walkingSession, formatTime, todayTotals.calories, currentTime]);

  // Filter navigation items based on user preferences
  const visibleItems = useMemo(() => {
    if (preferencesLoading) return navItems; // Show all items while loading
    
    return navItems.filter(item => {
      const path = item.path;
      if (path === "/" && !preferences.fast) return false; // Timer/Fast
      if (path === "/walking" && !preferences.walk) return false;
      if (path === "/food-tracking" && !preferences.food) return false;
      if (path === "/motivators" && !preferences.goals) return false;
      if (path === "/settings") return true; // Always show settings
      return true;
    });
  }, [navItems, preferences, preferencesLoading]);

  return (
    <TooltipProvider>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80" key={`nav-${JSON.stringify(preferences)}`}>
        <div className="bg-ceramic-plate px-4 py-2">
          <div className="flex justify-around gap-1 relative">
            {/* Navigation Items */}
            {visibleItems.map(({ icon: Icon, label, path, badge, isEating, caloriesBadge }) => {
              const isActive = location.pathname === path;
              
              const getTooltipText = (label: string) => {
                switch (label) {
                  case 'Fast': return 'Start or manage your fasting sessions';
                  case 'Walk': return 'Track your walking sessions and burn calories';
                  case 'Food': return 'Log your meals and track daily intake';
                  case 'Goals': return 'View and create motivational content';
                  case 'Settings': return 'Manage your profile, preferences and account';
                  default: return label;
                }
              };

              // Handle premium gating for Food navigation
              const handleFoodClick = (e: React.MouseEvent) => {
                if (access_level !== 'admin' && !hasFoodAccess) {
                  e.preventDefault();
                  e.stopPropagation();
                  toast({
                    title: "Premium Feature",
                    description: "Food tracking requires premium access. Please upgrade to continue.",
                    variant: "destructive",
                  });
                  return;
                }
              };
              
              const hasAccess = access_level === 'admin' || hasFoodAccess;
              const isLocked = label === 'Food' && !hasAccess;
              
              const content = (
                <Link
                  to={path}
                  className={`relative flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-200 flex-1 min-w-0 border ${
                    isActive 
                       ? 'bg-primary text-primary-foreground shadow-lg border-primary/30' 
                       : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 bg-muted/10 border-border hover:border-border-emphasis'
                  } ${isLocked ? 'opacity-50' : ''}`}
                  onClick={label === 'Food' ? handleFoodClick : undefined}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-ui-sm">{label}</span>
                  
                  {/* Lock icon overlay for Food button */}
                  {isLocked && label === 'Food' && (
                    <div className="absolute top-1 right-1">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Timer badge for fasting/walking ONLY */}
                  {badge && (label === 'Fast' || label === 'Walk') && (
                    <TimerBadge time={badge} isEating={isEating} />
                  )}
                  
                  {/* Calorie badge for food ONLY */}
                  {caloriesBadge && label === 'Food' && (
                    <CalorieBadge calories={caloriesBadge} />
                  )}
                  
                  {/* Trial countdown badge ONLY for Settings button */}
                  {label === 'Settings' && inTrial && daysRemaining && (
                    <TrialTimerBadge daysRemaining={daysRemaining} />
                  )}
                </Link>
              );

              return (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    {content}
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
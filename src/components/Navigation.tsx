import { Brain, Settings, Utensils, Clock, Footprints } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useProfile } from '@/hooks/useProfile';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { TimerBadge } from '@/components/TimerBadge';
import { useAnimationControl } from '@/components/AnimationController';

export const Navigation = () => {
  const location = useLocation();
  const { timerStatus, formatTime } = useTimerNavigation();
  const { hasActiveNotifications, getHighPriorityNotifications } = useNotificationSystem();
  const { isProfileComplete } = useProfile();
  const { currentSession: fastingSession, loadActiveSession } = useFastingSession();
  const { todayTotals } = useFoodEntries();
  const { isAnimationsSuspended } = useAnimationControl();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every second for real-time badges, but pause when animations are suspended
  useEffect(() => {
    if (isAnimationsSuspended) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnimationsSuspended]);

  // Load active session on mount and refresh more frequently for better responsiveness
  useEffect(() => {
    loadActiveSession();
    
    // Set up interval to refresh fasting session more frequently when needed
    const interval = setInterval(() => {
      loadActiveSession();
    }, 2000); // Check every 2 seconds for faster badge updates
    
    return () => clearInterval(interval);
  }, [loadActiveSession]);

  // Calculate fasting duration and status for badge - UPDATED FOR REAL-TIME
  const getFastingBadge = () => {
    console.log('DEBUG: getFastingBadge called', { fastingSession, currentTime });
    if (!fastingSession || fastingSession.status !== 'active') {
      console.log('DEBUG: No active fasting session');
      return null;
    }
    
    const startTime = new Date(fastingSession.start_time).getTime();
    const elapsed = Math.floor((currentTime - startTime) / 1000); // seconds
    console.log('DEBUG: Timer calculation', { startTime, elapsed, currentTime });
    
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
  };

  const fastingBadge = getFastingBadge();
  
  const navItems = [
    { 
      icon: Clock, 
      label: 'Fasting', 
      path: '/',
      badge: fastingBadge?.time || null,
      isEating: fastingBadge?.isEating || false
    },
    { 
      icon: Footprints, 
      label: 'Walking', 
      path: '/walking',
      badge: timerStatus.walking.isActive ? formatTime(timerStatus.walking.timeElapsed) : null,
      isEating: false
    },
    { 
      icon: Utensils, 
      label: 'Food', 
      path: '/food-tracking', 
      isEating: false,
      caloriesBadge: todayTotals.calories > 0 ? todayTotals.calories : null
    },
    { 
      icon: Brain, 
      label: 'Goals', 
      path: '/motivators',
      isEating: false
    },
    { icon: Settings, label: 'Settings', path: '/settings', isEating: false },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-ceramic-plate/95 backdrop-blur-sm border-t border-ceramic-rim px-4 py-2 z-40">
      <div className="w-full">
        <div className="flex justify-around gap-1">
          {/* Navigation Items */}
          {navItems.map(({ icon: Icon, label, path, badge, isEating, caloriesBadge }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
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
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
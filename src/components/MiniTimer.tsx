import React, { useState, useEffect } from 'react';
import { Clock, Activity, Timer, Zap, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMiniTimer } from '@/contexts/MiniTimerContext';
import { useNavigate } from 'react-router-dom';

export const MiniTimer: React.FC = () => {
  const { 
    timers, 
    showMiniTimer, 
    position, 
    size, 
    opacity, 
    autoHide, 
    autoHideDelay,
    hasActiveTimers,
    setShowMiniTimer 
  } = useMiniTimer();
  
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide || isHovered) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay, isHovered, timers]);

  // Show when new timers become active
  useEffect(() => {
    if (hasActiveTimers) {
      setIsVisible(true);
    }
  }, [hasActiveTimers]);

  if (!showMiniTimer || !hasActiveTimers || !isVisible) {
    return null;
  }

  const activeTimers = timers.filter(t => t.isActive);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 transition-all duration-300';
    
    const positionClasses = {
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'top-left': 'top-4 left-4', 
      'top-right': 'top-4 right-4'
    }[position];

    return `${baseClasses} ${positionClasses}`;
  };

  const getTimerIcon = (type: string) => {
    switch (type) {
      case 'fasting':
      case 'if':
      case 'if-eating':
        return <Timer className="w-3 h-3" />;
      case 'walking':
        return <Activity className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTimerRoute = (type: string) => {
    switch (type) {
      case 'fasting':
        return '/timer';
      case 'walking':
        return '/walking';
      case 'if':
      case 'if-eating':
        return '/intermittent-fasting';
      default:
        return '/timer';
    }
  };

  const getTimerLabel = (timer: any) => {
    switch (timer.type) {
      case 'fasting':
        return 'Fast';
      case 'walking':
        return timer.isPaused ? 'Paused' : 'Walk';
      case 'if':
        return 'IF Fast';
      case 'if-eating':
        return 'IF Eat';
      default:
        return 'Timer';
    }
  };

  const handleTimerClick = (timer: any) => {
    const route = getTimerRoute(timer.type);
    navigate(route);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMiniTimer(false);
  };

  return (
    <div className={getPositionClasses()}>
      {/* Minimal timer display - no card, just essential info */}
      <div 
        className={cn(
          "bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-2 shadow-lg",
        )}
        style={{ 
          backgroundColor: `hsl(var(--background) / ${opacity})`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleTimerClick(activeTimers[0])}
      >
        {/* Close button (only visible on hover) */}
        {isHovered && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-background/80 hover:bg-background"
            onClick={handleClose}
          >
            <X className="w-2.5 h-2.5" />
          </Button>
        )}

        <div className="flex items-center space-x-2">
          {getTimerIcon(activeTimers[0]?.type)}
          <span className="text-xs font-medium">
            {getTimerLabel(activeTimers[0])}
          </span>
          <div className="font-mono font-bold text-xs">
            {activeTimers[0]?.displayTime?.split(':').slice(0, 2).join(':') || '00:00'}
          </div>
        </div>
        
        {/* Pulse indicator */}
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      </div>
    </div>
  );
};
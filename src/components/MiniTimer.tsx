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
    const baseClasses = 'fixed z-50 transition-all duration-300';
    const sizeClasses = {
      small: 'w-20 h-14',
      medium: 'w-24 h-16', 
      large: 'w-28 h-18'
    }[size];

    const positionClasses = {
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'top-left': 'top-4 left-4', 
      'top-right': 'top-4 right-4'
    }[position];

    return `${baseClasses} ${sizeClasses} ${positionClasses}`;
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
      <Card 
        className={cn(
          "relative cursor-pointer transition-all duration-200 hover:scale-105",
          "backdrop-blur-sm border border-border/50",
          size === 'small' ? 'p-2' : size === 'medium' ? 'p-2.5' : 'p-3'
        )}
        style={{ 
          backgroundColor: `hsl(var(--background) / ${opacity})`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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

        <div className="space-y-1">
          {activeTimers.slice(0, 2).map((timer, index) => (
            <div
              key={timer.id}
              className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded p-1 -m-1"
              onClick={() => handleTimerClick(timer)}
            >
              <div className="flex items-center space-x-1.5">
                {getTimerIcon(timer.type)}
                <span className={cn(
                  "font-medium",
                  size === 'small' ? 'text-xs' : size === 'medium' ? 'text-xs' : 'text-sm'
                )}>
                  {getTimerLabel(timer)}
                </span>
              </div>
              
              <div className={cn(
                "font-mono font-bold text-right",
                size === 'small' ? 'text-xs' : size === 'medium' ? 'text-xs' : 'text-sm',
                timer.isPaused ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {timer.displayTime.split(':').slice(0, 2).join(':')}
              </div>
            </div>
          ))}
          
          {/* Show count if more than 2 timers */}
          {activeTimers.length > 2 && (
            <div className="text-center">
              <span className={cn(
                "text-muted-foreground",
                size === 'small' ? 'text-xs' : 'text-sm'
              )}>
                +{activeTimers.length - 2} more
              </span>
            </div>
          )}
        </div>
        
        {/* Pulse indicator for active timers */}
        <div className="absolute top-1 right-1">
          <div className={cn(
            "rounded-full bg-accent animate-pulse",
            size === 'small' ? 'w-1.5 h-1.5' : 'w-2 h-2'
          )} />
        </div>
      </Card>
    </div>
  );
};
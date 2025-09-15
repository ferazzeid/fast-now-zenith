import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { ChevronDown, Activity, Utensils, Target, Info, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useLocation } from 'react-router-dom';
import { ManualCalorieModal } from '@/components/ManualCalorieModal';
import { DeficitDisplay, StatDisplay } from '@/components/OptimizedComponents';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { GoalMetrics } from '@/components/GoalMetrics';
import { useAppLogo } from '@/hooks/useAppLogo';
import { AccessGate } from '@/components/AccessGate';

import { InlineActivitySelector } from '@/components/InlineActivitySelector';
import { WalkingSessionsBreakdown } from '@/components/WalkingSessionsBreakdown';
import { useGoalCalculations } from '@/hooks/useGoalCalculations';
import { useProfile } from '@/hooks/useProfile';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';

export const DailyStatsPanel = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { deficitData, loading, refreshDeficit } = useDailyDeficitQuery();
  const { fatInGrams, thirtyDayProjection } = useGoalCalculations();
  const { profile } = useProfile();
  const { todayEntries, todayTotals } = useFoodEntriesQuery();
  const { appLogo } = useAppLogo();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  

  // Hide panel on admin and auth pages to prevent menu overlap  
  // IMPORTANT: This check must come AFTER all hooks to avoid React hooks violation
  const shouldHidePanel = location.pathname === '/admin' || location.pathname === '/auth' || location.pathname === '/reset-password' || location.pathname === '/update-password';

  const formatNumber = (num: number) => {
    return Math.round(Math.abs(num)).toLocaleString();
  };

  const getDeficitColor = useMemo(() => (deficit: number) => {
    if (deficit > 0) return 'text-primary';
    if (deficit < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  }, []);

  const getActivityLevelDisplay = useMemo(() => (level: string) => {
    const activityMap: { [key: string]: string } = {
      'sedentary': 'Low Activity',
      'lightly_active': 'Light Activity',
      'moderately_active': 'Moderate Activity',
      'very_active': 'High Activity',
      'extremely_active': 'Very High Activity'
    };
    return activityMap[level] || level;
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientY;
    const swipeDistance = touchStart - touchEnd;
    
    // Swipe down to open (negative distance), swipe up to close (positive distance)
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance < 0 && !isExpanded) {
        setIsExpanded(true);
      } else if (swipeDistance > 0 && isExpanded) {
        setIsExpanded(false);
      }
    }
    
    setTouchStart(null);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Don't close if clicking inside the panel content, modal dialog, or select dropdown
      if (panelRef.current && !panelRef.current.contains(target)) {
        // Also check if click is on modal/dialog content or select dropdown
        const isModalClick = target.closest('[role="dialog"]') || 
                            target.closest('.dialog-content') ||
                            target.closest('[data-radix-portal]') ||
                            target.closest('[data-radix-popper-content-wrapper]') ||
                            target.closest('[role="listbox"]');
        
        if (!isModalClick) {
          setIsExpanded(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      // Use a timeout to prevent immediate closure from the initial click
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isExpanded]);

  // Remove debug logging to fix re-render loop
  // console.log('DailyStatsPanel - shouldHidePanel:', shouldHidePanel);
  // console.log('DailyStatsPanel - deficitData:', deficitData);
  // console.log('DailyStatsPanel - loading:', loading);
  // console.log('DailyStatsPanel - caloriesConsumed:', deficitData.caloriesConsumed);
  
  // Don't render anything on admin pages, but show when we have profile data (even if no calories consumed yet)
  if (shouldHidePanel) {
    return null;
  }

  return (
    <TooltipProvider>
      <div ref={panelRef} className="fixed top-0 left-0 right-0 z-30">{/* Lower z-index than AI chat header */}
        {/* Collapsed View - Always visible thin bar */}
        <div 
          className="cursor-pointer transition-colors select-none"
          onClick={() => setIsExpanded(!isExpanded)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`max-w-md mx-auto px-8 py-3 flex items-center justify-between bg-card hover:bg-card/95 transition-colors ${isExpanded ? 'border-l border-r border-ceramic-shadow' : ''}`}>
            <div className="flex items-center space-x-2">
              {appLogo ? (
                <img 
                  src={appLogo} 
                  alt="App Logo" 
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
                <span className="text-sm font-medium text-warm-text">
                Today's Deficit:
              </span>
              <ClickableTooltip content="Updates every 15 minutes when walking, hourly when idle - optimized for performance">
                <Info className="w-3 h-3 text-primary" />
              </ClickableTooltip>
              <AccessGate feature="food">
                {({ hasAccess }) => (
                  hasAccess ? (
                    <span className={`text-sm font-bold ${getDeficitColor(deficitData.todayDeficit)}`}>
                      {loading && deficitData.todayDeficit === 0 && deficitData.tdee === 0
                        ? '...'
                        : `${formatNumber(deficitData.todayDeficit)} cal`}
                    </span>
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )
                )}
              </AccessGate>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Tap to expand</span>
              <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Expanded View - Detailed breakdown */}
        {isExpanded && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/20 z-[-1]" 
              onClick={() => setIsExpanded(false)}
            />
            <div className="bg-card max-w-md mx-auto z-50 rounded-b-lg border-l border-r border-b border-ceramic-shadow">
              <div className="px-6 py-3 space-y-3">
                {/* Main Deficit Display */}
                <AccessGate feature="food">
                  {({ hasAccess, requestUpgrade }) =>
                    hasAccess ? (
                      <DeficitDisplay
                        deficit={deficitData.todayDeficit}
                        loading={loading}
                        tdee={deficitData.tdee}
                        fatInGrams={fatInGrams}
                        thirtyDayProjection={thirtyDayProjection}
                        userUnits={profile?.units}
                      />
                    ) : (
                      <Card className="p-4 bg-card/80 border border-border/50 relative" onClick={requestUpgrade}>
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center space-x-2">
                            <h3 className="text-lg font-semibold text-muted-foreground">Today's Deficit</h3>
                          </div>
                          <div className="text-3xl font-bold text-muted-foreground">
                            <Lock className="w-8 h-8 mx-auto" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Deficit tracking requires premium
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Unlock detailed calorie deficit analysis, fat loss projections, and more
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  }
                </AccessGate>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3 px-0.5">
                  {/* Calories In with Carbs */}
                  <AccessGate feature="food">
                    {({ hasAccess, requestUpgrade }) => (
                <Card
                  className={`p-3 bg-card/80 border border-border/50 relative ${hasAccess ? '' : 'opacity-50 cursor-pointer'}`}
                        onClick={hasAccess ? undefined : requestUpgrade}
                      >
                        <div className="absolute top-2 right-2">
                          <ClickableTooltip content="Total calories consumed from food today">
                            <Info className="w-5 h-5 text-muted-foreground" />
                          </ClickableTooltip>
                        </div>

                        <div className="flex items-center space-x-2 mb-1 pr-6">
                          <Utensils className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-warm-text">Calories In</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-foreground">
                            {Math.round(deficitData.caloriesConsumed)} cal
                          </div>

                          {/* Dividing line and carbs */}
                          <div className="flex items-center space-x-2">
                            <div className="w-px h-6 bg-border"></div>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium text-foreground">{Math.round(todayTotals.carbs)}g</span>
                              <ClickableTooltip content="Total carbs consumed from food today">
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </ClickableTooltip>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </AccessGate>

                  {/* Calories Out */}
                  <StatDisplay
                    icon={<Activity className="w-4 h-4 text-muted-foreground" />}
                    label="Calories Out"
                    value={deficitData.totalCaloriesBurned}
                    tooltip={`Total calories burned today: Base (${formatNumber(deficitData.tdee)}) + Walking (${formatNumber(deficitData.walkingCalories)}) + Manual (${formatNumber(deficitData.manualCalories)}) = ${formatNumber(deficitData.totalCaloriesBurned)}`}
                  />
                </div>


                {/* Unified Metabolism & Walking Card */}
                <Card className="p-3 bg-card/80 border border-border/50">
                  {/* Base Daily Burn Section */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-warm-text">Base Daily Burn</span>
                      <ClickableTooltip content={`Your Total Daily Energy Expenditure (TDEE) based on BMR (${formatNumber(deficitData.bmr)}) × activity multiplier for ${getActivityLevelDisplay(deficitData.activityLevel)}. This already includes your selected activity level.`}>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {formatNumber(deficitData.tdee)} cal
                    </div>
                  </div>
                  
                  {/* Activity Level Selector */}
                  <div className="mb-3">
                    <InlineActivitySelector currentDisplayLevel={deficitData.activityLevel} />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-ceramic-shadow/50 my-3"></div>

                  {/* Activity Section with Sessions Breakdown */}
                  <WalkingSessionsBreakdown 
                    totalCalories={deficitData.walkingCalories + deficitData.manualCalories}
                    walkingCalories={deficitData.walkingCalories}
                    manualCalories={deficitData.manualCalories}
                    onRefresh={refreshDeficit}
                  />
                </Card>


                  {/* Goal Metrics */}
                  <AccessGate feature="food">
                    {({ hasAccess, requestUpgrade }) => (
                      <div
                        onClick={hasAccess ? undefined : requestUpgrade}
                        className={hasAccess ? '' : 'opacity-50 cursor-pointer'}
                      >
                        <GoalMetrics />
                      </div>
                    )}
                  </AccessGate>



                  {/* Manual Calorie Burn Addition */}
                 <div className="mt-2">
                   <ManualCalorieModal onCalorieAdded={refreshDeficit} />
                 </div>

                 {/* Bottom Close Button */}
                 <div className="flex justify-center pt-2">
                   <button
                     onClick={() => setIsExpanded(false)}
                     className="flex items-center justify-center p-2 rounded-full bg-card hover:bg-card/80 transition-colors"
                     aria-label="Close expanded view"
                   >
                     <ChevronDown className="w-5 h-5 text-muted-foreground rotate-180" />
                   </button>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
});

DailyStatsPanel.displayName = 'DailyStatsPanel';
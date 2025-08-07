import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { ChevronDown, Activity, Utensils, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useLocation } from 'react-router-dom';
import { ManualCalorieModal } from '@/components/ManualCalorieModal';
import { DeficitDisplay, StatDisplay } from '@/components/OptimizedComponents';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { GoalMetrics } from '@/components/GoalMetrics';

import { InlineActivitySelector } from '@/components/InlineActivitySelector';
import { WalkingSessionsBreakdown } from '@/components/WalkingSessionsBreakdown';
import { useGoalCalculations } from '@/hooks/useGoalCalculations';
import { useProfile } from '@/hooks/useProfile';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { Info } from 'lucide-react';

export const DailyStatsPanel = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { deficitData, loading, refreshDeficit } = useDailyDeficitQuery();
  const { fatInGrams, thirtyDayProjection } = useGoalCalculations();
  const { profile } = useProfile();
  const { todayEntries, todayTotals } = useFoodEntries();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  

  // Hide panel on admin and auth pages to prevent menu overlap  
  // IMPORTANT: This check must come AFTER all hooks to avoid React hooks violation
  const shouldHidePanel = location.pathname === '/admin' || location.pathname === '/auth' || location.pathname === '/reset-password' || location.pathname === '/update-password';

  const formatNumber = (num: number) => {
    return Math.round(Math.abs(num)).toLocaleString();
  };

  const getDeficitColor = useMemo(() => (deficit: number) => {
    if (deficit > 0) return 'text-green-600 dark:text-green-400';
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
          <div className={`max-w-md mx-auto px-8 py-3 flex items-center justify-between bg-card hover:bg-card/95 transition-colors ${isExpanded ? 'border-l border-r border-muted-foreground' : ''}`}>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-warm-text">
                Today's Deficit:
              </span>
              <ClickableTooltip content="Updates every 15 minutes when walking, hourly when idle - optimized for performance">
                <Info className="w-3 h-3 text-muted-foreground" />
              </ClickableTooltip>
              <span className={`text-sm font-bold ${getDeficitColor(deficitData.todayDeficit)}`}>
                {loading && deficitData.todayDeficit === 0 && deficitData.tdee === 0 ? '...' : `${formatNumber(deficitData.todayDeficit)} cal deficit`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Tap to expand</span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
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
            <div className="bg-card max-w-md mx-auto z-50 rounded-b-lg border-l border-r border-b border-muted-foreground">
              <div className="px-8 py-4 space-y-4">
                {/* Main Deficit Display */}
                <DeficitDisplay 
                  deficit={deficitData.todayDeficit}
                  loading={loading}
                  tdee={deficitData.tdee}
                  fatInGrams={fatInGrams}
                  thirtyDayProjection={thirtyDayProjection}
                  userUnits={profile?.units}
                />

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Calories In with Carbs */}
                  <Card className="p-3 bg-card border-border relative">
                    <div className="absolute top-2 right-2">
                      <ClickableTooltip content="Total calories consumed from food today">
                        <Info className="w-5 h-5 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2 pr-6">
                      <Utensils className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-warm-text">Calories In</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary">
                        {Math.round(deficitData.caloriesConsumed)} cal
                      </div>
                      
                      {/* Dividing line and carbs */}
                      <div className="flex items-center space-x-2">
                        <div className="w-px h-6 bg-border"></div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-primary">{Math.round(todayTotals.carbs)}g</span>
                          <ClickableTooltip content="Total carbs consumed from food today">
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </ClickableTooltip>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Calories Out */}
                  <StatDisplay
                    icon={<Activity className="w-4 h-4 text-primary" />}
                    label="Calories Out"
                    value={Math.round(deficitData.tdee + deficitData.walkingCalories + deficitData.manualCalories)}
                    tooltip="Total calories burned today: Base Daily Burn + Walking + Manual Activities"
                  />
                </div>

                {/* Nutrition Overview */}
                <div className="space-y-4">
                  {/* Planned with Limits */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Planned Calorie with Limit */}
                    <Card className="p-3 bg-card border-border relative">
                      <div className="absolute top-2 right-2">
                        <ClickableTooltip content="Calories planned to be consumed today, often from go-to food items">
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </ClickableTooltip>
                      </div>
                      <div className="text-xs font-medium text-warm-text mb-1">Planned</div>
                      <div className="text-lg font-bold text-primary">{Math.round((todayEntries || []).filter(entry => !entry.consumed).reduce((sum, entry) => sum + entry.calories, 0))}</div>
                      <div className="text-xs text-muted-foreground">Calorie</div>
                      {/* Limit value in gray */}
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{profile?.daily_calorie_goal || 2000} limit</span>
                          <ClickableTooltip content="Ideally you shouldn't go higher than this value for the day. Not a hard stop but ideal for long-term results.">
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </ClickableTooltip>
                        </div>
                      </div>
                    </Card>

                    {/* Planned Carbs with Limit */}
                    <Card className="p-3 bg-card border-border relative">
                      <div className="absolute top-2 right-2">
                        <ClickableTooltip content="Carbs calculated from planned food items in your daily plan">
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </ClickableTooltip>
                      </div>
                      <div className="text-xs font-medium text-warm-text mb-1">Planned</div>
                      <div className="text-lg font-bold text-primary">{Math.round((todayEntries || []).filter(entry => !entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0))}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                      {/* Limit value in gray */}
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{profile?.daily_carb_goal || 150}g limit</span>
                          <ClickableTooltip content="Sensitive value especially for ketosis. Critical to respect daily for best results - highly advisable.">
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </ClickableTooltip>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Unified Metabolism & Walking Card */}
                <Card className="p-3 bg-card border-border">
                  {/* Base Daily Burn Section */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-warm-text">Base Daily Burn</span>
                      <ClickableTooltip content="Calories your body burns naturally based on your metabolism and activity level">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                    <div className="text-sm font-bold text-warm-text">
                      {formatNumber(deficitData.tdee)} cal
                    </div>
                  </div>
                  
                  {/* Activity Level Selector */}
                  <div className="mb-3">
                    <InlineActivitySelector currentDisplayLevel={deficitData.activityLevel} />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-3"></div>

                  {/* Walking Section with Sessions Breakdown */}
                  <WalkingSessionsBreakdown 
                    totalCalories={deficitData.walkingCalories}
                    onRefresh={refreshDeficit}
                  />
                </Card>

                 {/* Manual Activities (if applicable) */}
                 {deficitData.manualCalories > 0 && (
                   <Card className="p-3 bg-card border-border relative">
                     {/* Tooltip icon positioned in top-right corner */}
                     <div className="absolute top-2 right-2">
                       <ClickableTooltip 
                         content="Calories burned from manually logged activities today"
                       >
                         <Info className="w-5 h-5 text-muted-foreground" />
                       </ClickableTooltip>
                     </div>
                     
                     <div className="flex items-center justify-between pr-6">
                       <div className="flex items-center space-x-2">
                         <Activity className="w-4 h-4 text-green-500" />
                         <span className="text-sm font-medium text-warm-text">Manual Activities</span>
                       </div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatNumber(deficitData.manualCalories)} cal
                        </div>
                     </div>
                   </Card>
                  )}

                  {/* Goal Metrics */}
                  <GoalMetrics />



                  {/* Manual Calorie Burn Addition */}
                 <div className="mt-4">
                   <ManualCalorieModal onCalorieAdded={refreshDeficit} />
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
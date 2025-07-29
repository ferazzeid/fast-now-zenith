import { useState, useEffect, useRef } from 'react';
import { ChevronDown, TrendingDown, TrendingUp, Activity, Utensils, Clock, Target, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDailyDeficit } from '@/hooks/useDailyDeficit';
import { useLocation, useNavigate } from 'react-router-dom';
import { ManualCalorieModal } from '@/components/ManualCalorieModal';

export const DailyStatsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { deficitData, loading, refreshDeficit } = useDailyDeficit();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide panel on admin and auth pages to prevent menu overlap  
  // IMPORTANT: This check must come AFTER all hooks to avoid React hooks violation
  const shouldHidePanel = location.pathname === '/admin' || location.pathname === '/auth' || location.pathname === '/reset-password' || location.pathname === '/update-password';

  const formatNumber = (num: number) => {
    return Math.abs(num).toLocaleString();
  };

  const getDeficitColor = (deficit: number) => {
    if (deficit > 0) return 'text-green-600 dark:text-green-400';
    if (deficit < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getDeficitIcon = (deficit: number) => {
    return deficit > 0 ? TrendingDown : TrendingUp;
  };

  const getActivityLevelDisplay = (level: string) => {
    const activityMap: { [key: string]: string } = {
      'sedentary': 'Low Activity',
      'lightly_active': 'Light Activity',
      'moderately_active': 'Moderate Activity',
      'very_active': 'High Activity',
      'extremely_active': 'Very High Activity'
    };
    return activityMap[level] || level;
  };

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
      
      // Don't close if clicking inside the panel content or modal dialog
      if (panelRef.current && !panelRef.current.contains(target)) {
        // Also check if click is on modal/dialog content
        const isModalClick = target.closest('[role="dialog"]') || 
                            target.closest('.dialog-content') ||
                            target.closest('[data-radix-portal]');
        
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

  // Debug logging to understand why deficit panel isn't showing
  console.log('DailyStatsPanel - shouldHidePanel:', shouldHidePanel);
  console.log('DailyStatsPanel - deficitData:', deficitData);
  console.log('DailyStatsPanel - caloriesConsumed:', deficitData.caloriesConsumed);
  
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
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between bg-ceramic-plate/95 backdrop-blur-sm border-b border-ceramic-rim hover:bg-ceramic-plate/98 transition-colors">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-warm-text">
                Today's Deficit:
              </span>
              <span className={`text-sm font-bold ${getDeficitColor(deficitData.todayDeficit)}`}>
                {loading ? '...' : `${formatNumber(deficitData.todayDeficit)} cal deficit`}
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
            <div className="bg-ceramic-plate border-b border-ceramic-rim max-w-md mx-auto z-50">
              <div className="px-4 py-4 space-y-4">
                {/* Main Deficit Display */}
                <Card className="p-4 bg-ceramic-base border-ceramic-rim">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      {(() => {
                        const DeficitIcon = getDeficitIcon(deficitData.todayDeficit);
                        return <DeficitIcon className={`w-6 h-6 ${getDeficitColor(deficitData.todayDeficit)}`} />;
                      })()}
                      <h3 className="text-lg font-semibold text-warm-text">Today's Deficit</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-6 h-6 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your calorie deficit for today. A positive number means you're burning more than you consume (weight loss).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className={`text-3xl font-bold ${getDeficitColor(deficitData.todayDeficit)}`}>
                      {loading ? '...' : `${formatNumber(deficitData.todayDeficit)} cal`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deficitData.todayDeficit > 0 ? 'Calorie deficit (weight loss)' : 'Calorie surplus (weight gain)'}
                    </p>
                  </div>
                </Card>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Calories In */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-2">
                      <Utensils className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-warm-text">Calories In</span>
                       <Tooltip>
                         <TooltipTrigger>
                           <button className="p-2 hover:bg-accent rounded-md">
                             <Info className="w-4 h-4 text-muted-foreground" />
                           </button>
                         </TooltipTrigger>
                        <TooltipContent>
                          <p>Total calories consumed from food today</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatNumber(deficitData.caloriesConsumed)} cal
                    </div>
                  </Card>

                  {/* Calories Out */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-warm-text">Calories Out</span>
                       <Tooltip>
                         <TooltipTrigger>
                           <button className="p-2 hover:bg-accent rounded-md">
                             <Info className="w-4 h-4 text-muted-foreground" />
                           </button>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Total calories burned today: Base Daily Burn + Walking + Manual Activities</p>
                         </TooltipContent>
                      </Tooltip>
                    </div>
                     <div className="text-lg font-bold text-primary">
                       {formatNumber(deficitData.tdee + deficitData.walkingCalories + deficitData.manualCalories)} cal
                     </div>
                  </Card>

                  {/* Base Daily Burn (TDEE) */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="text-xs text-warm-text">Base Daily Burn</span>
                       <Tooltip>
                         <TooltipTrigger>
                           <button className="p-2 hover:bg-accent rounded-md">
                             <Info className="w-4 h-4 text-muted-foreground" />
                           </button>
                         </TooltipTrigger>
                        <TooltipContent>
                          <p>Calories your body burns naturally based on your metabolism and activity level</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatNumber(deficitData.tdee)} cal
                    </div>
                     <div className="text-xs text-muted-foreground mt-1">
                       {getActivityLevelDisplay(deficitData.activityLevel)}
                     </div>
                  </Card>

                  {/* Walking */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-3 h-3 text-primary" />
                      <span className="text-xs text-warm-text">Walking Burn</span>
                       <Tooltip>
                         <TooltipTrigger>
                           <button className="p-2 hover:bg-accent rounded-md">
                             <Info className="w-4 h-4 text-muted-foreground" />
                           </button>
                         </TooltipTrigger>
                        <TooltipContent>
                          <p>Total calories burned from walking today (includes active sessions)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatNumber(deficitData.walkingCalories)} cal
                    </div>
                    <div className="flex items-center justify-between mt-1">
                       <div className="text-xs text-muted-foreground">
                        All walking sessions today
                      </div>
                    </div>
                  </Card>
                </div>

                 {/* Manual Activities (if applicable) */}
                 {deficitData.manualCalories > 0 && (
                   <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <Activity className="w-4 h-4 text-green-500" />
                         <span className="text-sm font-medium text-warm-text">Manual Activities</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <button className="p-2 hover:bg-accent rounded-md">
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                           <TooltipContent>
                             <p>Calories burned from manually logged activities today</p>
                           </TooltipContent>
                         </Tooltip>
                       </div>
                       <div className="text-sm font-bold text-green-600 dark:text-green-400">
                         {formatNumber(deficitData.manualCalories)} cal
                       </div>
                     </div>
                   </Card>
                 )}

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
};
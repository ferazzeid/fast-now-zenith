import { useState, useEffect, useRef } from 'react';
import { ChevronDown, TrendingDown, TrendingUp, Activity, Utensils, Clock, Target, Info, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDailyDeficit } from '@/hooks/useDailyDeficit';
import { useLocation, useNavigate } from 'react-router-dom';

export const DailyStatsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { deficitData, loading } = useDailyDeficit();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide panel on admin pages to prevent menu overlap
  // IMPORTANT: This check must come AFTER all hooks to avoid React hooks violation
  const shouldHidePanel = location.pathname === '/admin';

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
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);

  // Don't render anything on admin pages, but ensure consistent hook calls
  if (shouldHidePanel) {
    return null;
  }

  return (
    <TooltipProvider>
      <div ref={panelRef} className="fixed top-0 left-0 right-0 z-40">
        {/* Collapsed View - Always visible thin bar */}
        <div 
          className="bg-ceramic-plate/95 backdrop-blur-sm border-b border-ceramic-rim px-4 py-3 cursor-pointer hover:bg-ceramic-plate/98 transition-colors select-none"
          onClick={() => setIsExpanded(!isExpanded)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]" 
              onClick={() => setIsExpanded(false)}
            />
            <div className="bg-ceramic-plate/98 backdrop-blur-sm border-b border-ceramic-rim">
              <div className="max-w-md mx-auto px-4 py-4 space-y-4">
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
                          <Info className="w-4 h-4 text-muted-foreground" />
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
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-medium text-warm-text">Calories In</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total calories consumed from food today</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatNumber(deficitData.caloriesConsumed)} cal
                    </div>
                  </Card>

                  {/* Calories Out */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-warm-text">Calories Out</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total calories burned today: Base Daily Burn + Walking + Fasting Bonus</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(deficitData.tdee + deficitData.walkingCalories + deficitData.fastingBonus)} cal
                    </div>
                  </Card>

                  {/* Base Daily Burn (TDEE) */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="text-xs text-warm-text">Base Daily Burn</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Calories your body burns naturally based on your metabolism and activity level</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {formatNumber(deficitData.tdee)} cal
                    </div>
                    <button 
                      className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-warm-text transition-colors"
                      onClick={() => navigate('/settings')}
                    >
                      <span>{getActivityLevelDisplay(deficitData.activityLevel)}</span>
                      <Settings className="w-3 h-3" />
                    </button>
                  </Card>

                  {/* Walking */}
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-warm-text">Walking Burn</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total calories burned from walking today (includes active sessions)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatNumber(deficitData.walkingCalories)} cal
                    </div>
                    <div className="text-xs text-muted-foreground">
                      All walking sessions today
                    </div>
                  </Card>
                </div>

                {/* Fasting Bonus (if applicable) */}
                {deficitData.fastingBonus > 0 && (
                  <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-warm-text">Fasting Bonus</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>5% metabolic boost while actively fasting</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {formatNumber(deficitData.fastingBonus)} cal
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
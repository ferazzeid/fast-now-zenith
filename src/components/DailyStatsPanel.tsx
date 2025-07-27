import { useState, useEffect, useRef } from 'react';
import { ChevronDown, TrendingDown, TrendingUp, Activity, Utensils, Clock, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useDailyDeficit } from '@/hooks/useDailyDeficit';
import { useLocation } from 'react-router-dom';

export const DailyStatsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { deficitData, loading } = useDailyDeficit();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Hide panel on admin pages to prevent menu overlap
  if (location.pathname === '/admin') {
    return null;
  }

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

  return (
    <div ref={panelRef} className="fixed top-0 left-0 right-0 z-50">
      {/* Collapsed View - Always visible thin bar */}
      <div 
        className="bg-ceramic-plate/95 backdrop-blur-sm border-b border-ceramic-rim px-4 py-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-warm-text">
              Today's Deficit:
            </span>
            <span className={`text-sm font-bold ${getDeficitColor(deficitData.todayDeficit)}`}>
              {loading ? '...' : `${deficitData.todayDeficit > 0 ? '+' : ''}${formatNumber(deficitData.todayDeficit)} cal`}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
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
                </div>
                <div className={`text-3xl font-bold ${getDeficitColor(deficitData.todayDeficit)}`}>
                  {loading ? '...' : `${deficitData.todayDeficit > 0 ? '+' : ''}${formatNumber(deficitData.todayDeficit)}`}
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
                </div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(deficitData.caloriesConsumed)}
                </div>
              </Card>

              {/* Calories Out */}
              <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-warm-text">Calories Out</span>
                </div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(deficitData.tdee + deficitData.walkingCalories + deficitData.fastingBonus)}
                </div>
              </Card>

              {/* TDEE */}
              <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-3 h-3 text-primary" />
                  <span className="text-xs text-warm-text">TDEE</span>
                </div>
                <div className="text-sm font-semibold text-primary">
                  {formatNumber(deficitData.tdee)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {deficitData.activityLevel.replace('_', ' ')}
                </div>
              </Card>

              {/* Walking */}
              <Card className="p-3 bg-ceramic-base border-ceramic-rim">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-warm-text">Walking</span>
                </div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +{formatNumber(deficitData.walkingCalories)}
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
                  </div>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    +{formatNumber(deficitData.fastingBonus)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  5% metabolic boost while fasting
                </p>
              </Card>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, RefreshCw, TrendingDown, Target, Flame, Coffee, CalendarIcon } from 'lucide-react';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { ClickableTooltip } from './ClickableTooltip';
import { DeficitAnalysisButton } from './DeficitAnalysisButton';
import { ProfileCompletionPrompt } from './ProfileCompletionPrompt';
import { PremiumGatedDeficitAnalysis } from './PremiumGatedDeficitAnalysis';
// Simplified components - using basic UI instead of missing imports
import { InlineActivitySelector } from './InlineActivitySelector';

export const DailyStatsPanel = () => {
  const { deficit, isLoading, refetch } = useDailyDeficitQuery();
  const { profile } = useProfile();
  const location = useLocation();
  const [showDeficitModal, setShowDeficitModal] = useState(false);

  const isProfileComplete = () => {
    return !!(profile?.weight && profile?.height && profile?.age);
  };

  if (!isProfileComplete()) {
    return (
      <div className="w-full max-w-md mx-auto mb-4 px-4">
        <div>Profile incomplete - please complete your profile</div>
      </div>
    );
  }

  const openModal = () => {
    if (isLoading || !deficit) return;
    
    setShowDeficitModal(true);
  };

  const getDeficitColor = () => {
    const percentage = deficit?.percentage || 0;
    if (percentage >= 20) return 'text-success';
    if (percentage >= 10) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto mb-4 px-4">
        {/* Main Deficit Display Card */}
        <Card className="bg-ceramic-plate border-ceramic-rim shadow-ceramic hover:shadow-ceramic-hover transition-all duration-300 mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-warm-text">Today's Fat Loss</h3>
                <ClickableTooltip content="This shows your daily caloric deficit - the amount your body needs to burn stored fat today.">
                  <Info className="w-4 h-4 text-muted-foreground hover:text-warm-text cursor-help" />
                </ClickableTooltip>
              </div>
              <InlineActivitySelector 
                currentDisplayLevel={profile?.activity_level || 'sedentary'}
              />
            </div>

            <div className="space-y-4">
              {/* Primary deficit display with circular progress */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-20 h-20 rounded-full border-4 border-primary mb-2"></div>
                  
                  {/* Main calorie number */}
                  <div className={`text-2xl font-bold ${getDeficitColor()}`}>
                    {isLoading ? '...' : Math.round(deficit?.calories || 0)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
                  </div>
                  
                  {/* Limit value in gray */}
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{profile?.daily_calorie_goal || 2000} limit</span>
                      <ClickableTooltip content="Ideally you shouldn't go higher than this value for the day. Not a hard stop but ideal for long-term results.">
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                  </div>
                </div>

                <div className="ml-4 text-right space-y-2">
                  {/* Fat burned indicator */}
                  <div className="text-sm">
                    Fat: {Math.round((deficit?.calories || 0) / 7.5)}g
                  </div>
                  
                  {/* Carbs consumed */}
                  <div className="text-xs text-muted-foreground">
                    Carbs: 0g
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">{profile?.daily_carb_goal || 150}g limit</span>
                      <ClickableTooltip content="Sensitive value especially for ketosis. Critical to respect daily for best results - highly advisable.">
                        <Info className="w-3 h-3 text-muted-foreground ml-1" />
                      </ClickableTooltip>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress indicators */}
              <div className="space-y-2">
                <div className="text-sm">Progress: {deficit?.percentage || 0}%</div>
                <div className="text-sm">Projected loss: {Math.round((deficit?.calories || 0) * 30 / 7700)}kg</div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex-1 h-8 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <div className="flex-1">
                  <PremiumGatedDeficitAnalysis />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Secondary stats for wider screens */}
        <div className="space-y-2">
          {/* Daily overview compact card */}
          <Card className="bg-ceramic-base/50 border-ceramic-rim/50 p-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 text-primary" />
                <span className="text-warm-text">Daily Overview</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-primary"></div>
                <span className={`font-semibold ${getDeficitColor()}`}>
                  {isLoading ? 'Loading...' : `${Math.round(deficit?.calories || 0)} kcal`}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-ceramic-base/30 border-ceramic-rim/30 p-2">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border border-primary mx-auto mb-1"></div>
                <div className="text-xs text-muted-foreground">Fat Loss Progress</div>
              </div>
            </Card>
            
            <Card className="bg-ceramic-base/30 border-ceramic-rim/30 p-2">
              <div className="text-center">
                <div className="text-sm font-semibold text-warm-text mb-1">
                  {Math.round((deficit?.calories || 0) / 7.5)}g
                </div>
                <div className="text-xs text-muted-foreground">Fat Burned</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Deficit Analysis Modal */}
      {showDeficitModal && (
        <PremiumGatedDeficitAnalysis />
      )}
    </>
  );
};
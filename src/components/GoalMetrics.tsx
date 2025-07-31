import React from 'react';
import { Calendar, Target, TrendingUp, Scale } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoalCalculations } from '@/hooks/useGoalCalculations';
import { useProfile } from '@/hooks/useProfile';

export const GoalMetrics = () => {
  const { profile } = useProfile();
  const { 
    weeksToGoal, 
    currentWeight, 
    goalWeight, 
    weightToLose, 
    fatInGrams, 
    thirtyDayProjection 
  } = useGoalCalculations();

  if (!currentWeight || !goalWeight) {
    return null;
  }

  const units = profile?.units === 'metric' ? 'kg' : 'lbs';

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Weight Progress */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Goal Progress</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-primary">
            {weightToLose?.toFixed(1) || 0} {units}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentWeight} → {goalWeight} {units}
          </div>
        </div>
      </Card>

      {/* Time to Goal */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Time to Goal</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-primary">
            {weeksToGoal ? `${weeksToGoal}w` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            at current deficit
          </div>
        </div>
      </Card>

      {/* Today's Fat Loss */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Fat Burned</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-primary">
            {fatInGrams}g
          </div>
          <div className="text-xs text-muted-foreground">
            today's deficit
          </div>
        </div>
      </Card>

      {/* 30-Day Projection */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">30-Day Loss</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-primary">
            {thirtyDayProjection}g
          </div>
          <div className="text-xs text-muted-foreground">
            projected fat loss
          </div>
        </div>
      </Card>
    </div>
  );
};
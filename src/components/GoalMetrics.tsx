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

  const weightUnits = profile?.units === 'metric' ? 'kg' : 'lbs';
  
  // Convert weights to display units
  const displayCurrentWeight = profile?.units === 'metric' 
    ? currentWeight 
    : currentWeight ? (currentWeight * 2.20462).toFixed(1) : currentWeight;
  const displayGoalWeight = profile?.units === 'metric'
    ? goalWeight
    : goalWeight ? (goalWeight * 2.20462).toFixed(1) : goalWeight;
  const displayWeightToLose = profile?.units === 'metric'
    ? weightToLose?.toFixed(1)
    : weightToLose ? (weightToLose * 2.20462).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Weight Progress */}
      <Card className="p-3 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Goal Progress</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-foreground">
            {displayWeightToLose || 0} {weightUnits}
          </div>
          <div className="text-xs text-muted-foreground">
            {displayCurrentWeight} → {displayGoalWeight} {weightUnits}
          </div>
        </div>
      </Card>

      {/* Time to Goal */}
      <Card className="p-3 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Time to Goal</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-foreground">
            {weeksToGoal ? `${weeksToGoal}w` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            at current deficit
          </div>
        </div>
      </Card>

      {/* Today's Fat Loss */}
      <Card className="p-3 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Fat Burned</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-foreground">
            {fatInGrams}g
          </div>
          <div className="text-xs text-muted-foreground">
            today's deficit
          </div>
        </div>
      </Card>

      {/* 30-Day Projection */}
      <Card className="p-3 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">30-Day Loss</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold text-foreground">
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
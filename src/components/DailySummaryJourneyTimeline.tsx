import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingDown } from "lucide-react";

interface DailySummaryJourneyTimelineProps {
  currentDeficit: number;
  goalCalculations: {
    weeksToGoal: number | null;
    dailyDeficitNeeded: number | null;
    currentWeight: number | null;
    goalWeight: number | null;
    weightToLose: number | null;
    thirtyDayProjection: number;
  };
}

export const DailySummaryJourneyTimeline = ({ 
  currentDeficit, 
  goalCalculations 
}: DailySummaryJourneyTimelineProps) => {
  const [timeframe, setTimeframe] = useState<'30' | '90'>('90');

  const days = parseInt(timeframe);
  const today = new Date();
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago as start
  const endDate = new Date(today.getTime() + (days - 30) * 24 * 60 * 60 * 1000);

  // Calculate progress percentage (30 days into the journey)
  const progressPercentage = (30 / days) * 100;

  // Calculate weight projections
  const currentProjection = currentDeficit > 0 ? (currentDeficit * days) / 7.7 / 1000 : 0; // Convert to kg
  const projectedWeight = goalCalculations.currentWeight ? 
    goalCalculations.currentWeight - currentProjection : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Journey Timeline
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Select value={timeframe} onValueChange={(value: '30' | '90') => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Visualization */}
          <div className="relative">
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Start</span>
              <span className="font-medium text-primary">Today ({Math.round(progressPercentage)}%)</span>
              <span>End</span>
            </div>
          </div>

          {/* Journey Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Days Completed</p>
              <p className="text-2xl font-bold">30 / {days}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Pace</p>
              <p className="text-xl font-semibold text-primary">
                {currentDeficit > 0 ? `${currentDeficit} cal/day` : 'No deficit'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Days Remaining</p>
              <p className="text-2xl font-bold">{days - 30}</p>
            </div>
          </div>

          {/* Weight Projections */}
          {goalCalculations.currentWeight && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Weight Projections
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Current Weight</p>
                  <p className="font-semibold">{goalCalculations.currentWeight} kg</p>
                </div>
                
                {projectedWeight && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Projected Weight ({days}d)</p>
                    <p className="font-semibold text-green-600">
                      {projectedWeight.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (-{currentProjection.toFixed(1)} kg)
                    </p>
                  </div>
                )}
                
                {goalCalculations.goalWeight && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Goal Weight</p>
                    <p className="font-semibold text-blue-600">{goalCalculations.goalWeight} kg</p>
                    {goalCalculations.weeksToGoal && (
                      <p className="text-xs text-muted-foreground">
                        ETA: {goalCalculations.weeksToGoal} weeks
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Milestones */}
          <div className="space-y-2">
            <h4 className="font-medium">Upcoming Milestones</h4>
            <div className="space-y-2 text-sm">
              {days >= 60 && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span>60-Day Mark</span>
                  <span className="text-muted-foreground">{60 - 30} days away</span>
                </div>
              )}
              {days >= 90 && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span>90-Day Completion</span>
                  <span className="text-muted-foreground">{90 - 30} days away</span>
                </div>
              )}
              {goalCalculations.weeksToGoal && goalCalculations.weeksToGoal * 7 <= days && (
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-green-800 dark:text-green-200">Goal Weight</span>
                  <span className="text-green-600 dark:text-green-400">
                    ~{Math.round(goalCalculations.weeksToGoal * 7)} days away
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
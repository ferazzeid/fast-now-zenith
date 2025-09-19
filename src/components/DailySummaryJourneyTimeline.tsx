import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingDown, Flame } from "lucide-react";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { JourneyActivationCard } from "@/components/JourneyActivationCard";

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
  const { activeJourney, getCurrentDay, getTotalFatBurned, getAverageDeficit } = useJourneyTracking();

  // If no active journey, show activation card
  if (!activeJourney) {
    return (
      <JourneyActivationCard 
        currentWeight={goalCalculations.currentWeight}
        goalWeight={goalCalculations.goalWeight}
      />
    );
  }

  const currentDay = getCurrentDay();
  const totalDays = 90; // Fixed to 90-day journey
  const daysRemaining = Math.max(0, totalDays - currentDay);
  const progressPercentage = (currentDay / totalDays) * 100;
  
  // Calculate projections based on current deficit
  const dailyFatBurn = currentDeficit > 0 ? (currentDeficit / 7700) * 1000 : 0; // grams per day
  const totalFatBurned = getTotalFatBurned();
  const avgDeficit = getAverageDeficit();
  
  // Weight projections
  const totalDeficitSoFar = currentDay * (avgDeficit || currentDeficit);
  const weightLossSoFar = totalDeficitSoFar > 0 ? totalDeficitSoFar / 7700 : 0;
  const currentProjectedWeight = activeJourney.current_weight_at_start - weightLossSoFar;
  
  const projectedFinalWeight = activeJourney.current_weight_at_start - ((avgDeficit || currentDeficit) * totalDays) / 7700;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          90-Day Journey Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Started on {new Date(activeJourney.start_date).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Visualization */}
          <div className="relative">
            <div className="w-full bg-muted h-3 rounded-full">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Day 1</span>
              <span className="font-medium text-primary">
                Day {currentDay} ({Math.round(progressPercentage)}%)
              </span>
              <span>Day 90</span>
            </div>
          </div>

          {/* Journey Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Days Completed</p>
              <p className="text-2xl font-bold">{currentDay} / 90</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Daily Deficit</p>
              <p className="text-xl font-semibold text-primary">
                {currentDeficit > 0 ? `${currentDeficit} cal` : 'No deficit'}
              </p>
            </div>

            <div className="space-y-1 flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fat Burned Today</p>
                <p className="text-xl font-semibold text-orange-600">
                  {dailyFatBurn.toFixed(0)}g
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Days Remaining</p>
              <p className="text-2xl font-bold">{daysRemaining}</p>
            </div>
          </div>

          {/* Total Progress */}
          <div className="p-4 bg-accent/20 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Total Progress
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Fat Burned</p>
                <p className="font-semibold text-orange-600">{totalFatBurned.toFixed(0)}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Daily Deficit</p>
                <p className="font-semibold">{avgDeficit || currentDeficit} cal</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight Lost</p>
                <p className="font-semibold text-green-600">{weightLossSoFar.toFixed(1)} kg</p>
              </div>
            </div>
          </div>

          {/* Weight Projections */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Weight Projections
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Starting Weight</p>
                <p className="font-semibold">{activeJourney.current_weight_at_start} kg</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Current Projected</p>
                <p className="font-semibold text-green-600">
                  {currentProjectedWeight.toFixed(1)} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  (-{weightLossSoFar.toFixed(1)} kg)
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Final Projected (90d)</p>
                <p className="font-semibold text-blue-600">
                  {projectedFinalWeight.toFixed(1)} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: {activeJourney.target_weight} kg
                </p>
              </div>
            </div>
          </div>

          {/* Key Milestones */}
          <div className="space-y-2">
            <h4 className="font-medium">Upcoming Milestones</h4>
            <div className="space-y-2 text-sm">
              {currentDay < 30 && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span>30-Day Mark</span>
                  <span className="text-muted-foreground">{30 - currentDay} days away</span>
                </div>
              )}
              {currentDay < 60 && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span>60-Day Mark</span>
                  <span className="text-muted-foreground">{60 - currentDay} days away</span>
                </div>
              )}
              {currentDay < 90 && (
                <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                  <span className="text-primary">Journey Completion</span>
                  <span className="text-primary font-medium">
                    {90 - currentDay} days away
                  </span>
                </div>
              )}
              {currentDay >= 90 && (
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-green-800 dark:text-green-200">Journey Complete! 🎉</span>
                  <span className="text-green-600 dark:text-green-400">
                    Well done!
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
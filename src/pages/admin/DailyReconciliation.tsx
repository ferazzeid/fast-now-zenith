import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBaseQuery } from "@/hooks/useBaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminSubnav } from "@/components/AdminSubnav";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { TrendingUp, Footprints, Activity, Timer, Utensils, Target, Calendar, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useDailyDeficitQuery } from "@/hooks/optimized/useDailyDeficitQuery";
import { useGoalCalculations } from "@/hooks/useGoalCalculations";
import { useFastingContext } from "@/hooks/useFastingContext";
import { useWalkingContext } from "@/hooks/useWalkingContext";
import { useFoodContext } from "@/hooks/useFoodContext";
import { useOptimizedManualCalorieBurns } from "@/hooks/optimized/useOptimizedManualCalorieBurns";
import { DailySummaryJourneyTimeline } from "@/components/DailySummaryJourneyTimeline";
import { DailySummaryGoalsSection } from "@/components/DailySummaryGoalsSection";

// Component interfaces are now handled by individual section components

export default function DailyReconciliation() {
  usePageSEO({
    title: "Daily Summary – Admin Operations",
    description: "Review the day and track progress.",
    canonicalPath: "/admin/reconciliation",
  });

  // Check if reconciliation is enabled - use consistent query key
  const { data: isReconciliationEnabled, isLoading: isCheckingAccess } = useBaseQuery(
    ['daily-reconciliation-enabled'], // Match the settings component query key
    async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_reconciliation_enabled')
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch reconciliation setting:', error);
        return false;
      }

      return data?.setting_value === 'true';
    },
    {
      staleTime: 10 * 1000,
      gcTime: 30 * 1000,
    }
  );

  // Load today's data using existing hooks
  const { deficitData, loading: deficitLoading } = useDailyDeficitQuery();
  const goalCalculations = useGoalCalculations();
  const { context: fastingContext, refreshContext: refreshFasting } = useFastingContext();
  const { context: walkingContext, refreshContext: refreshWalking } = useWalkingContext();
  const { context: foodContext, refreshContext: refreshFood } = useFoodContext();
  const { manualBurns, todayTotal: manualCaloriesTotal, loading: manualLoading } = useOptimizedManualCalorieBurns();

  const refreshAllData = async () => {
    await Promise.all([
      refreshFasting(),
      refreshWalking(),
      refreshFood()
    ]);
  };

  if (isCheckingAccess) {
    return (
      <AdminHealthCheck>
        <main className="container mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Checking access...</p>
          </div>
        </main>
      </AdminHealthCheck>
    );
  }

  if (!isReconciliationEnabled) {
    return (
      <AdminHealthCheck>
        <main className="container mx-auto p-6 space-y-8">
          <AdminSubnav />
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Daily Summary is currently disabled. Enable it in the Operations settings to access this feature.</span>
              <Button asChild variant="outline" size="sm" className="ml-4">
                <Link to="/admin/operations" className="flex items-center gap-2">
                  Go to Operations
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </AdminHealthCheck>
    );
  }

  const isLoading = deficitLoading || manualLoading;

  if (isLoading) {
    return (
      <AdminHealthCheck>
        <main className="container mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading today's data...</p>
          </div>
        </main>
      </AdminHealthCheck>
    );
  }

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-6 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]">
        <AdminSubnav />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Daily Summary</h1>
              <p className="text-muted-foreground">Review the day</p>
            </div>
          </div>

          {/* Today's Deficit & Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Deficit & Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Today's Deficit</p>
                  <p className="text-2xl font-bold text-primary">{deficitData.todayDeficit} cal</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Calories Burned</p>
                  <p className="text-lg font-semibold">{deficitData.totalCaloriesBurned} cal</p>
                  <p className="text-xs text-muted-foreground">
                    TDEE: {deficitData.tdee} + Walking: {deficitData.walkingCalories} + Manual: {deficitData.manualCalories}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Calories Consumed</p>
                  <p className="text-lg font-semibold">{deficitData.caloriesConsumed} cal</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">30-Day Projection</p>
                  <p className="text-lg font-semibold text-green-600">{goalCalculations.thirtyDayProjection}g fat loss</p>
                  {goalCalculations.weeksToGoal && (
                    <p className="text-xs text-muted-foreground">
                      Goal in {goalCalculations.weeksToGoal} weeks
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities (Walking & External) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Footprints className="h-5 w-5" />
                Activities (Walking & External)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walkingContext?.isCurrentlyWalking && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Currently Walking</span>
                      <span className="text-green-600">
                        {walkingContext.currentWalkingDuration.toFixed(1)} min 
                        {walkingContext.isPaused ? ' (Paused)' : ''}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Today's Walking</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Total Time: <span className="font-medium">{walkingContext?.totalWalkingTimeToday?.toFixed(1) || 0} min</span></p>
                      <p className="text-sm">Sessions: <span className="font-medium">{walkingContext?.totalWalkingSessions || 0}</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">External Activities</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Activities: <span className="font-medium">{manualBurns.length}</span></p>
                      <p className="text-sm">Calories: <span className="font-medium">{manualCaloriesTotal} cal</span></p>
                    </div>
                  </div>
                </div>

                {manualBurns.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Today's External Activities</h5>
                    <div className="space-y-1">
                      {manualBurns.slice(0, 3).map((burn) => (
                        <div key={burn.id} className="text-xs text-muted-foreground">
                          {burn.activity_name}: {burn.calories_burned} cal at {new Date(burn.created_at).toLocaleTimeString()}
                        </div>
                      ))}
                      {manualBurns.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{manualBurns.length - 3} more activities</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fasting Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Fasting Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fastingContext?.isCurrentlyFasting ? (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Currently Fasting: {fastingContext.currentFastDuration.toFixed(1)} hours
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Goal: {fastingContext.fastingGoal} hours • 
                      {fastingContext.timeUntilGoal > 0 
                        ? ` ${fastingContext.timeUntilGoal.toFixed(1)} hours remaining`
                        : ' Goal achieved!'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Not currently fasting</p>
              )}
              
              {fastingContext && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Completed Fasts</p>
                    <p className="font-medium">{fastingContext.totalFastsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average Duration</p>
                    <p className="font-medium">{fastingContext.averageFastDuration.toFixed(1)} hours</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Food Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Calories Today</p>
                    <p className="text-xl font-semibold">
                      {foodContext?.todayCalories || 0} / {foodContext?.calorieGoal || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {foodContext?.caloriesRemaining || 0} remaining
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Carbs Today</p>
                    <p className="text-xl font-semibold">
                      {foodContext?.todayCarbs || 0}g / {foodContext?.carbGoal || 0}g
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {foodContext?.carbsRemaining || 0}g remaining
                    </p>
                  </div>
                </div>

                {foodContext?.recentEntries && foodContext.recentEntries.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Recent Meals</h5>
                    <div className="space-y-1">
                      {foodContext.recentEntries.map((entry, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          {entry.name}: {entry.calories} cal, {entry.carbs}g carbs at {entry.time}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goals & Progress */}
          <DailySummaryGoalsSection 
            goalCalculations={goalCalculations}
            refreshData={refreshAllData}
          />

          {/* Journey Timeline */}
          <DailySummaryJourneyTimeline 
            currentDeficit={deficitData.todayDeficit}
            goalCalculations={goalCalculations}
          />
        </div>
      </main>
    </AdminHealthCheck>
  );
}
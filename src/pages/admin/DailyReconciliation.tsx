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
import { useOptimizedProfile } from "@/hooks/optimized/useOptimizedProfile";
import { DailySummaryVerticalTimeline } from "@/components/DailySummaryVerticalTimeline";
import { DailySummaryGoalsSection } from "@/components/DailySummaryGoalsSection";
import { DayCountdownTimer } from "@/components/DayCountdownTimer";

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
  const { profile, updateProfile } = useOptimizedProfile();

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
      <main className="container mx-auto p-6 space-y-6 overflow-x-hidden bg-background min-h-[calc(100vh-80px)] pb-20">
        <AdminSubnav />

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Daily Summary</h1>
            <div className="scale-125 origin-left">
              <DayCountdownTimer />
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Deficit</p>
                    <p className="text-2xl font-bold text-primary">{Math.round(deficitData.todayDeficit)} cal</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">30-Day Weight Loss</p>
                    <p className="text-2xl font-bold text-green-600">{Math.round(goalCalculations.thirtyDayProjection / 1000 * 10) / 10} kg</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Projected 30D</p>
                    <p className="text-lg font-semibold">
                      {goalCalculations.currentWeight ? 
                        Math.round((goalCalculations.currentWeight - (goalCalculations.thirtyDayProjection / 1000)) * 10) / 10 
                        : '--'} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Weight</p>
                    <p className="text-lg font-semibold">
                      {goalCalculations.currentWeight ? Math.round(goalCalculations.currentWeight * 10) / 10 : '--'} kg
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="ml-2 h-6 text-xs bg-muted/50"
                        onClick={() => {
                          const newWeight = prompt('Enter your current weight (kg):', goalCalculations.currentWeight?.toString());
                          if (newWeight && !isNaN(Number(newWeight))) {
                            updateProfile({ weight: Number(newWeight) });
                          }
                        }}
                      >
                        Update
                      </Button>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Calories Consumed</p>
                    <p className="text-lg font-semibold">{Math.round(deficitData.caloriesConsumed)} cal</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Calories Target</p>
                    <p className="text-lg font-semibold">{Math.round(profile?.daily_calorie_goal || 0)} cal</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Carbs Consumed</p>
                    <p className="text-lg font-semibold">{Math.round(foodContext?.todayCarbs || 0)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carbs Target</p>
                    <p className="text-lg font-semibold">{Math.round(profile?.daily_carb_goal || 0)}g</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Footprints className="h-5 w-5" />
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Walking Sessions */}
                {walkingContext?.totalWalkingSessions > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Walking Sessions</h4>
                    <div className="space-y-1">
                      {Array.from({ length: walkingContext.totalWalkingSessions || 0 }, (_, i) => {
                        // Calculate session duration (simplified for demo - could be enhanced with real session data)
                        const avgDuration = Math.round((walkingContext.totalWalkingTimeToday || 0) / (walkingContext.totalWalkingSessions || 1));
                        const calories = Math.round(avgDuration * 5); // Rough calculation: 5 cal/min
                        return (
                          <div key={i} className="flex justify-between items-center py-1">
                            <span className="text-sm">Walking Session {i + 1}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium">{avgDuration} minutes</span>
                              <span className="text-xs text-muted-foreground ml-2">~{calories} cal</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual Activities */}
                {manualBurns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">External Activities</h4>
                    <div className="space-y-1">
                      {manualBurns.map((burn, i) => (
                        <div key={burn.id} className="flex justify-between items-center py-1">
                          <span className="text-sm">{burn.activity_name}</span>
                          <span className="text-sm font-medium">{burn.calories_burned} calories</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Walking</p>
                      <p className="font-semibold">{Math.round(walkingContext?.totalWalkingTimeToday || 0)} min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">External</p>
                      <p className="font-semibold">{Math.round(manualCaloriesTotal)} cal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Burned</p>
                      <p className="font-semibold text-green-600">{Math.round(deficitData.totalCaloriesBurned)} cal</p>
                    </div>
                  </div>
                </div>

                {/* No Activities Message */}
                {(!walkingContext?.totalWalkingSessions || walkingContext.totalWalkingSessions === 0) && manualBurns.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No activities logged today</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <span className="text-lg font-bold text-primary">Ongoing</span>
                    <span className="text-sm text-muted-foreground">• Extended fast</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-green-600">
                      {fastingContext.currentFastDuration && !isNaN(fastingContext.currentFastDuration) 
                        ? Math.round(fastingContext.currentFastDuration) 
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">hours completed</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <span className="text-lg font-medium text-muted-foreground">Not Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">No fasting session in progress</p>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Goals & Progress */}
          <DailySummaryGoalsSection 
            goalCalculations={goalCalculations}
            refreshData={refreshAllData}
          />

          {/* Journey Timeline */}
          <DailySummaryVerticalTimeline 
            currentDeficit={deficitData.todayDeficit}
            goalCalculations={goalCalculations}
          />
        </div>
      </main>
    </AdminHealthCheck>
  );
}
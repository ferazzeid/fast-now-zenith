import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBaseQuery } from "@/hooks/useBaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminSubnav } from "@/components/AdminSubnav";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { CalendarDays, Users, Utensils, Footprints, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReconciliationTestProtocol } from "@/components/ReconciliationTestProtocol";

interface DailyStats {
  date: string;
  totalUsers: number;
  activeUsers: number;
  foodEntries: number;
  walkingSessions: number;
  manualCalorieBurns: number;
  issues: {
    overlappingWalkingSessions: number;
    duplicateFoodEntries: number;
    missingProfileData: number;
    invalidCalorieValues: number;
  };
}

interface UserActivity {
  userId: string;
  displayName: string;
  foodEntries: number;
  walkingSessions: number;
  manualBurns: number;
  totalCalories: number;
  issues: string[];
}

export default function DailyReconciliation() {
  usePageSEO({
    title: "Daily Reconciliation – Admin Operations",
    description: "Review and reconcile daily user activities and data.",
    canonicalPath: "/admin/reconciliation",
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Check if reconciliation is enabled
  const { data: isReconciliationEnabled, isLoading: isCheckingAccess } = useBaseQuery(
    ['reconciliation-enabled'],
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
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  );

  // Fetch daily statistics
  const { data: dailyStats, isLoading: isLoadingStats, refetch: refetchStats } = useBaseQuery<DailyStats | null>(
    ['daily-stats', selectedDate],
    async () => {
      if (!isReconciliationEnabled) return null;

      // Get all food entries for the selected date
      const { data: foodEntries, error: foodError } = await supabase
        .from('food_entries')
        .select('id, user_id, calories, name, source_date')
        .eq('source_date', selectedDate);

      if (foodError) throw foodError;

      // Get all walking sessions for the selected date
      const { data: walkingSessions, error: walkingError } = await supabase
        .from('walking_sessions')
        .select('id, user_id, start_time, end_time, session_state')
        .gte('start_time', `${selectedDate}T00:00:00`)
        .lt('start_time', `${selectedDate}T23:59:59`);

      if (walkingError) throw walkingError;

      // Get all manual calorie burns for the selected date
      const { data: manualBurns, error: manualError } = await supabase
        .from('manual_calorie_burns')
        .select('id, user_id, calories_burned, activity_name, created_at')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lt('created_at', `${selectedDate}T23:59:59`);

      if (manualError) throw manualError;

      // Calculate statistics and detect issues
      const allUserIds = new Set([
        ...foodEntries.map(e => e.user_id),
        ...walkingSessions.map(s => s.user_id),
        ...manualBurns.map(b => b.user_id)
      ]);

      // Issue detection
      const issues = {
        overlappingWalkingSessions: 0,
        duplicateFoodEntries: 0,
        missingProfileData: 0,
        invalidCalorieValues: 0,
      };

      // Check for overlapping walking sessions per user
      const userSessions = walkingSessions.reduce((acc, session) => {
        if (!acc[session.user_id]) acc[session.user_id] = [];
        acc[session.user_id].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      Object.values(userSessions).forEach((sessions: any[]) => {
        for (let i = 0; i < sessions.length - 1; i++) {
          const current = sessions[i];
          const next = sessions[i + 1];
          if (current.end_time && new Date(current.end_time) > new Date(next.start_time)) {
            issues.overlappingWalkingSessions++;
          }
        }
      });

      // Check for invalid calorie values
      issues.invalidCalorieValues = foodEntries.filter(entry => 
        entry.calories < 0 || entry.calories > 10000
      ).length;

      return {
        date: selectedDate,
        totalUsers: allUserIds.size,
        activeUsers: allUserIds.size, // All users with any activity
        foodEntries: foodEntries.length,
        walkingSessions: walkingSessions.length,
        manualCalorieBurns: manualBurns.length,
        issues,
      };
    },
    {
      enabled: !!isReconciliationEnabled && !!selectedDate,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }
  );

  const handleAnalyzeDay = async () => {
    setIsAnalyzing(true);
    try {
      await refetchStats();
    } finally {
      setIsAnalyzing(false);
    }
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
            <AlertDescription>
              Daily Reconciliation is currently disabled. Enable it in the Operations settings to access this feature.
            </AlertDescription>
          </Alert>
        </main>
      </AdminHealthCheck>
    );
  }

  const totalIssues = dailyStats ? Object.values(dailyStats.issues).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]">
        <AdminSubnav />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Daily Reconciliation</h1>
              <p className="text-muted-foreground">Review and validate daily user activities</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              EXPERIMENTAL
            </Badge>
          </div>

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reconciliation-date">Date to Reconcile</Label>
                  <Input
                    id="reconciliation-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-48"
                  />
                </div>
                <Button 
                  onClick={handleAnalyzeDay}
                  disabled={isAnalyzing || isLoadingStats}
                  className="self-end"
                >
                  {isAnalyzing && <Clock className="h-4 w-4 animate-spin mr-2" />}
                  Analyze Day
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Overview */}
          {dailyStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{dailyStats.activeUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Food Entries</p>
                        <p className="text-2xl font-bold">{dailyStats.foodEntries}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Footprints className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Walking Sessions</p>
                        <p className="text-2xl font-bold">{dailyStats.walkingSessions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Manual Burns</p>
                        <p className="text-2xl font-bold">{dailyStats.manualCalorieBurns}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Issues Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {totalIssues > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    Data Quality Issues
                  </CardTitle>
                  <CardDescription>
                    {totalIssues === 0 
                      ? "No data quality issues detected for this date."
                      : `${totalIssues} issue${totalIssues === 1 ? '' : 's'} detected that may require attention.`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overlapping Walking Sessions</span>
                        <Badge variant={dailyStats.issues.overlappingWalkingSessions > 0 ? "destructive" : "secondary"}>
                          {dailyStats.issues.overlappingWalkingSessions}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Invalid Calorie Values</span>
                        <Badge variant={dailyStats.issues.invalidCalorieValues > 0 ? "destructive" : "secondary"}>
                          {dailyStats.issues.invalidCalorieValues}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Duplicate Food Entries</span>
                        <Badge variant={dailyStats.issues.duplicateFoodEntries > 0 ? "destructive" : "secondary"}>
                          {dailyStats.issues.duplicateFoodEntries}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Missing Profile Data</span>
                        <Badge variant={dailyStats.issues.missingProfileData > 0 ? "destructive" : "secondary"}>
                          {dailyStats.issues.missingProfileData}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testing Protocol */}
              <ReconciliationTestProtocol />
            </>
          )}

          {!dailyStats && selectedDate && !isLoadingStats && !isAnalyzing && (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Date to Begin</h3>
                <p className="text-muted-foreground">
                  Click "Analyze Day" to review activities and detect potential issues.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AdminHealthCheck>
  );
}
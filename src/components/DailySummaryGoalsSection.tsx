import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { useBaseQuery } from "@/hooks/useBaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface DailySummaryGoalsSectionProps {
  goalCalculations: {
    weeksToGoal: number | null;
    dailyDeficitNeeded: number | null;
    currentWeight: number | null;
    goalWeight: number | null;
    weightToLose: number | null;
    thirtyDayProjection: number;
  };
  refreshData: () => Promise<void>;
}

interface GoalMotivator {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
}

export const DailySummaryGoalsSection = ({ 
  goalCalculations, 
  refreshData 
}: DailySummaryGoalsSectionProps) => {
  const { toast } = useToast();
  const [confirmedGoals, setConfirmedGoals] = useState<string[]>([]);

  // Fetch user's personal motivators/goals
  const { data: goalMotivators, isLoading, refetch } = useBaseQuery<GoalMotivator[]>(
    ['user-goal-motivators'],
    async () => {
      const { data, error } = await supabase
        .from('motivators')
        .select('id, title, content, category, is_active')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleConfirmGoal = (goalId: string) => {
    setConfirmedGoals(prev => [...prev, goalId]);
    toast({
      title: "Goal Confirmed",
      description: "Goal marked as still relevant for your journey.",
    });
  };

  const handleCreateNewGoal = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Goal creation interface will be available soon.",
    });
  };

  const isGoalConfirmed = (goalId: string) => confirmedGoals.includes(goalId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Weight Goal Progress */}
          {goalCalculations.currentWeight && goalCalculations.goalWeight && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Weight Loss Goal
                </h4>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Current</p>
                  <p className="font-semibold">{goalCalculations.currentWeight} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Goal</p>
                  <p className="font-semibold">{goalCalculations.goalWeight} kg</p>
                </div>
                  <div>
                    <p className="text-muted-foreground">To Lose</p>
                    <p className="font-semibold">{Math.round(goalCalculations.weightToLose || 0)} kg</p>
                  </div>
                {goalCalculations.weeksToGoal && (
                  <div>
                    <p className="text-muted-foreground">ETA</p>
                    <p className="font-semibold text-green-600">{goalCalculations.weeksToGoal} weeks</p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {!isGoalConfirmed('weight-goal') ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConfirmGoal('weight-goal')}
                      className="text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Still relevant
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Needs Update
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Goal confirmed as relevant</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User's Personal Goals */}
          {goalMotivators && goalMotivators.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Your Personal Goals</h4>
              <div className="space-y-2">
                {goalMotivators.slice(0, 5).map((motivator) => (
                  <div 
                    key={motivator.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{motivator.title}</h5>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {motivator.content.substring(0, 100)}...
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {motivator.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {!isGoalConfirmed(motivator.id) ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleConfirmGoal(motivator.id)}
                          className="text-xs ml-2"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Still relevant
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600 ml-2">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show message if no goals found */}
          {goalMotivators && goalMotivators.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No personal goals found.</p>
              <p className="text-sm text-muted-foreground">Create some motivators in the Motivators section to see them here.</p>
            </div>
          )}

          {/* Create New Goal */}
          <div className="border-t pt-4">
            <Button 
              variant="outline" 
              onClick={handleCreateNewGoal}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Goal
            </Button>
          </div>

          {/* Goal Relevance Summary */}
          {confirmedGoals.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ {confirmedGoals.length} goal{confirmedGoals.length === 1 ? '' : 's'} confirmed as relevant to your journey
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

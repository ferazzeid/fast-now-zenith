import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Flame, TrendingDown, Clock, CheckCircle, Circle } from "lucide-react";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useGoalCalculations } from "@/hooks/useGoalCalculations";

export const NinetyDayTimeline = () => {
  const { 
    activeJourney, 
    getCurrentDay, 
    getTotalFatBurned, 
    getAverageDeficit 
  } = useJourneyTracking();
  
  const goalCalculations = useGoalCalculations();

  if (!activeJourney) return null;

  const currentDay = getCurrentDay();
  const totalDays = 90;
  const progressPercentage = Math.min((currentDay / totalDays) * 100, 100);
  
  // Calculate projections
  const currentDeficit = goalCalculations.currentDeficit || 0;
  const avgDeficit = getAverageDeficit();
  const totalFatBurned = getTotalFatBurned();
  
  // Weight calculations
  const totalDeficitSoFar = currentDay * (avgDeficit || currentDeficit);
  const weightLossSoFar = totalDeficitSoFar > 0 ? totalDeficitSoFar / 7700 : 0;
  const currentProjectedWeight = activeJourney.current_weight_at_start - weightLossSoFar;
  const projectedFinalWeight = activeJourney.current_weight_at_start - ((avgDeficit || currentDeficit) * totalDays) / 7700;

  // Generate timeline nodes for display (showing key milestones)
  const getTimelineNodes = () => {
    const nodes = [];
    const keyDays = [1, 3, 7, 14, 21, 30, 45, 60, 75, 90];
    
    for (const day of keyDays) {
      const isCompleted = day <= currentDay;
      const isCurrentDay = day === currentDay;
      const isMilestone = [3, 30, 60, 90].includes(day);
      
      nodes.push({
        day,
        isCompleted,
        isCurrentDay,
        isMilestone,
        label: day === 3 ? "3-Day Fast" : 
               day === 30 ? "30-Day Mark" :
               day === 60 ? "60-Day Mark" :
               day === 90 ? "Program Complete" :
               `Day ${day}`
      });
    }
    
    return nodes;
  };

  const timelineNodes = getTimelineNodes();

  return (
    <div className="space-y-6">
      {/* Program Overview */}
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Days Completed</span>
                <span className="font-semibold">{currentDay} / 90</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Started {new Date(activeJourney.start_date).toLocaleDateString()}</span>
                <span>{Math.round(progressPercentage)}% complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Weight Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Starting</span>
                <span className="text-sm font-medium">{activeJourney.current_weight_at_start} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Current Projected</span>
                <span className="text-sm font-medium text-green-600">
                  {currentProjectedWeight.toFixed(1)} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Target</span>
                <span className="text-sm font-medium">{activeJourney.target_weight} kg</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Weight Lost</span>
                  <span className="text-sm font-semibold text-green-600">
                    -{weightLossSoFar.toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Daily Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Current Deficit</span>
                <span className="text-sm font-medium">
                  {currentDeficit > 0 ? `${currentDeficit} cal` : 'No deficit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Average Deficit</span>
                <span className="text-sm font-medium">{avgDeficit || 0} cal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Total Fat Burned</span>
                <span className="text-sm font-medium text-orange-600">
                  {totalFatBurned.toFixed(0)}g
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Days Remaining</span>
                  <span className="text-sm font-semibold">
                    {Math.max(0, totalDays - currentDay)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Program Timeline
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your daily progress through key milestones
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            
            <div className="space-y-6">
              {timelineNodes.map((node, index) => (
                <div key={node.day} className="relative flex items-center gap-4">
                  {/* Timeline node */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    node.isCurrentDay 
                      ? 'bg-primary border-primary text-primary-foreground animate-pulse shadow-lg' 
                      : node.isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-background border-muted-foreground text-muted-foreground'
                  }`}>
                    {node.isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Node content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${node.isCurrentDay ? 'text-primary' : ''}`}>
                        {node.label}
                      </h4>
                      {node.isMilestone && (
                        <Badge variant={node.isCompleted ? "default" : "outline"} className="text-xs">
                          Milestone
                        </Badge>
                      )}
                      {node.isCurrentDay && (
                        <Badge variant="default" className="text-xs bg-primary">
                          Today
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {node.day === 3 && "Optional initiation fast completion"}
                      {node.day === 30 && "First major milestone - review progress"}
                      {node.day === 60 && "Two-thirds complete - extended fast opportunity"}
                      {node.day === 90 && "Program completion and final review"}
                      {![3, 30, 60, 90].includes(node.day) && (
                        node.isCompleted 
                          ? "Day completed - data locked" 
                          : node.isCurrentDay
                          ? "Active tracking day"
                          : "Upcoming milestone"
                      )}
                    </div>
                  </div>
                  
                  {/* Projected weight for key days */}
                  {[30, 60, 90].includes(node.day) && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {node.day <= currentDay 
                          ? `${(activeJourney.current_weight_at_start - (node.day * (avgDeficit || currentDeficit)) / 7700).toFixed(1)} kg`
                          : `~${(activeJourney.current_weight_at_start - (node.day * (avgDeficit || currentDeficit)) / 7700).toFixed(1)} kg`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {node.day <= currentDay ? 'Achieved' : 'Projected'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            90-Day Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-accent/20 rounded-lg">
              <h4 className="font-medium mb-2">If Current Trend Continues</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Final projected weight:</span>
                  <span className="font-semibold">{projectedFinalWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Total weight loss:</span>
                  <span className="font-semibold text-green-600">
                    {(activeJourney.current_weight_at_start - projectedFinalWeight).toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>vs Target ({activeJourney.target_weight} kg):</span>
                  <span className={`font-semibold ${projectedFinalWeight <= activeJourney.target_weight ? 'text-green-600' : 'text-yellow-600'}`}>
                    {projectedFinalWeight <= activeJourney.target_weight ? '✓ On track' : '⚠ Adjust needed'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Success Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Days completed:</span>
                  <span className="font-semibold">{currentDay} / 90</span>
                </div>
                <div className="flex justify-between">
                  <span>Consistency rate:</span>
                  <span className="font-semibold">{Math.round((currentDay/90) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average daily burn:</span>
                  <span className="font-semibold text-orange-600">
                    {totalFatBurned > 0 ? (totalFatBurned / Math.max(currentDay, 1)).toFixed(0) : 0}g/day
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
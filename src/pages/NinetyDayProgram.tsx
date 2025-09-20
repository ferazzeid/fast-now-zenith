import React, { useState } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Flame, TrendingDown, Play, X, RotateCcw, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { NinetyDayOnboarding } from "@/components/NinetyDayOnboarding";
import { NinetyDayTimeline } from "@/components/NinetyDayTimeline";
import { ResponsivePageHeader } from "@/components/ResponsivePageHeader";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useToast } from "@/hooks/use-toast";

export default function NinetyDayProgram() {
  usePageSEO({
    title: "90-Day Program Timeline – Track Your Journey",
    description: "Structured 90-day weight loss program with daily tracking, projections, and milestone achievements.",
    canonicalPath: "/90-day-program",
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const { activeJourney, isStartingJourney, endJourney, isEndingJourney, getCurrentDay } = useJourneyTracking();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetProgram = async () => {
    try {
      await endJourney();
      setShowResetConfirmation(false);
      toast({
        title: "Program Reset Successfully",
        description: "Your 90-day program has been reset. You can start a new journey anytime.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset program. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = () => {
    if (!activeJourney) return;

    const exportData = {
      journey: activeJourney,
      currentDay: getCurrentDay(),
      exportDate: new Date().toISOString(),
      programType: "90-day-timeline"
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `90-day-program-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your 90-day program data has been downloaded as a JSON file.",
    });
  };

  // If user has an active journey, show the timeline
  if (activeJourney) {
    const currentDay = getCurrentDay();
    const progressPercentage = Math.min((currentDay / 90) * 100, 100);

    return (
      <div className="max-w-md mx-auto pt-10 pb-40 safe-bottom">
        <div className="absolute right-4 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/motivators")}
            className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/70 hover:scale-110 transition-all duration-200"
            title="Close program"
          >
            <X className="w-8 h-8 text-warm-text" />
          </Button>
        </div>

        <ResponsivePageHeader 
          title="90-Day Program Timeline"
          subtitle="Track your daily progress and projections"
        />

        {/* Program Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Active Program</h3>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(activeJourney.start_date).toLocaleDateString()} • Day {currentDay} of 90
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowResetConfirmation(true)}
                className="flex-1"
                disabled={isEndingJourney}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isEndingJourney ? "Resetting..." : "Reset Program"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <NinetyDayTimeline />
        
        <ConfirmationModal
          isOpen={showResetConfirmation}
          onClose={() => setShowResetConfirmation(false)}
          onConfirm={handleResetProgram}
          title="Reset 90-Day Program"
          description="⚠️ WARNING: This will permanently delete all your program data, progress, and projections. This action cannot be undone. Are you sure you want to reset your 90-day program?"
          confirmText="Reset Program"
          cancelText="Keep Program"
          variant="destructive"
          isLoading={isEndingJourney}
        />
      </div>
    );
  }

  // Show onboarding if user clicked to start
  if (showOnboarding) {
    return (
      <NinetyDayOnboarding 
        onClose={() => setShowOnboarding(false)}
        onStart={() => {
          setShowOnboarding(false);
          // Journey will be started in onboarding component
        }}
      />
    );
  }

  // Landing page for users without active journey
  return (
    <div className="max-w-md mx-auto pt-10 pb-40 safe-bottom">
      <div className="absolute right-4 top-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/motivators")}
          className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/70 hover:scale-110 transition-all duration-200"
          title="Close program"
        >
          <X className="w-8 h-8 text-warm-text" />
        </Button>
      </div>

      <ResponsivePageHeader 
        title="90-Day Program Timeline"
        subtitle="Your structured journey to success"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Program Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Program Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The 90-Day Program Timeline is a structured approach to achieving your weight loss goals through 
              consistent daily tracking, milestone achievements, and data-driven projections.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-8 h-6 flex items-center justify-center text-xs">3</Badge>
                <span className="text-sm">Optional 3-day initiation fast</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-8 h-6 flex items-center justify-center text-xs">60</Badge>
                <span className="text-sm">60-hour extended fast milestone</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Daily caloric deficit tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Real-time weight projections</span>
              </div>
              <div className="flex items-center gap-3">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Walking goals and activity tracking</span>
              </div>
            </div>

            <Button 
              onClick={() => setShowOnboarding(true)}
              className="w-full mt-6"
              size="lg"
              disabled={isStartingJourney}
            >
              <Play className="h-4 w-4 mr-2" />
              {isStartingJourney ? "Starting..." : "Launch 90-Day Program"}
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</div>
                <div>
                  <h4 className="font-medium">Set Your Goals</h4>
                  <p className="text-sm text-muted-foreground">Define starting weight, target weight, and program preferences</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</div>
                <div>
                  <h4 className="font-medium">Daily Tracking</h4>
                  <p className="text-sm text-muted-foreground">Log your daily activities, fasting, walking, and food intake</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</div>
                <div>
                  <h4 className="font-medium">Track Progress</h4>
                  <p className="text-sm text-muted-foreground">See real-time projections and compare with actual results</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">4</div>
                <div>
                  <h4 className="font-medium">Achieve Milestones</h4>
                  <p className="text-sm text-muted-foreground">Celebrate 30, 60, and 90-day achievements</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">5</div>
                <div>
                  <h4 className="font-medium">Review Results</h4>
                  <p className="text-sm text-muted-foreground">Compare projected vs actual outcomes at program completion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
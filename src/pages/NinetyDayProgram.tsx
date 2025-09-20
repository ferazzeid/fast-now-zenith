import React, { useState } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Flame, TrendingDown, Play, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { NinetyDayOnboarding } from "@/components/NinetyDayOnboarding";
import { NinetyDayTimeline } from "@/components/NinetyDayTimeline";

export default function NinetyDayProgram() {
  usePageSEO({
    title: "90-Day Program Timeline – Track Your Journey",
    description: "Structured 90-day weight loss program with daily tracking, projections, and milestone achievements.",
    canonicalPath: "/90-day-program",
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const { activeJourney, isStartingJourney } = useJourneyTracking();

  // If user has an active journey, show the timeline
  if (activeJourney) {
    return (
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">90-Day Program Timeline</h1>
            <p className="text-muted-foreground mt-1">Track your daily progress and projections</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/motivators" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Goals
            </Link>
          </Button>
        </div>

        <NinetyDayTimeline />
      </main>
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
    <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">90-Day Program Timeline</h1>
          <p className="text-muted-foreground mt-1">Your structured journey to success</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/motivators" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Goals
          </Link>
        </Button>
      </div>

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
    </main>
  );
}
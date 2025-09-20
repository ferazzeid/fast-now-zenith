import React from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { FastingDailyTimeline } from "@/components/FastingDailyTimeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus } from "lucide-react";

export default function FastingTimeline() {
  const navigate = useNavigate();

  usePageSEO({
    title: "Fasting Timeline – Track Your Progress",
    description: "View your complete fasting journey with our interactive timeline showing extended fasts and intermittent fasting sessions.",
    canonicalPath: "/fasting-timeline",
  });

  const handleDateClick = (date: string) => {
    console.log('Date clicked:', date);
    // TODO: Open detailed view for specific date
  };

  const handleStartFast = () => {
    navigate('/');
  };

  return (
    <main className="container mx-auto p-6 space-y-8 min-h-screen bg-background">
      <header className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Fasting Timeline</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Track your fasting journey across time. See your progress, plan ahead, and never miss a fast.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Main Timeline */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <FastingDailyTimeline onDateClick={handleDateClick} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={handleStartFast}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Fast
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/fasting-history')}
                className="w-full"
              >
                View History
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/intermittent-fasting-history')}
                className="w-full"
              >
                IF History
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline Legend</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning/20 border border-warning" />
                <span>Fast in Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20 border border-success" />
                <span>Completed Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive" />
                <span>Cancelled Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-primary/50" />
                <span>Today</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">How It Works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Past 30 days show your fasting history</p>
              <p>• Today is highlighted with a blue ring</p>
              <p>• Next 7 days show planned fasts</p>
              <p>• Click any date for detailed information</p>
              <p>• Multiple fasts per day show a counter badge</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
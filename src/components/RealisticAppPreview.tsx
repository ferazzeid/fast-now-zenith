import { Timer, Utensils, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const RealisticAppPreview = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="space-y-4 max-h-full overflow-auto">
      {/* Simulated Timer Section */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-medium">Fasting Timer</h3>
            <p className="text-sm text-muted-foreground">14:32:15 elapsed</p>
          </div>
        </div>
      </Card>

      {/* Offline Component Display */}
      {children}

      {/* Simulated Food Tracking */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium">Today's Meals</h3>
              <p className="text-sm text-muted-foreground">1,245 calories logged</p>
            </div>
          </div>
          <Button size="sm" variant="outline">Add Food</Button>
        </div>
      </Card>

      {/* Simulated Walking Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-medium">Walking Stats</h3>
            <p className="text-sm text-muted-foreground">8,432 steps today</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
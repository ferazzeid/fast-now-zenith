import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingDown } from "lucide-react";

interface DailySummaryVerticalTimelineProps {
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

export const DailySummaryVerticalTimeline = ({ 
  currentDeficit, 
  goalCalculations 
}: DailySummaryVerticalTimelineProps) => {
  const [timeframe, setTimeframe] = useState<'30' | '90'>('90');

  const days = parseInt(timeframe);
  
  // Generate timeline data
  const generateTimelineData = () => {
    const data = [];
    const dailyWeightLoss = currentDeficit / 7700; // kg per day from deficit
    
    for (let day = 0; day <= days; day++) {
      const isToday = day === 30;
      const isPast = day < 30;
      const isFuture = day > 30;
      
      let projectedWeight = goalCalculations.currentWeight;
      if (projectedWeight && currentDeficit > 0) {
        projectedWeight = projectedWeight - (dailyWeightLoss * day);
      }
      
      let description = "";
      if (day === 0) description = "Journey start";
      else if (isToday) description = "Today";
      else if (day === 30) description = "1 month mark";
      else if (day === 60) description = "2 months mark";
      else if (day === 90) description = "3 months complete";
      else if (isFuture && projectedWeight) {
        description = `${Math.round(projectedWeight)}kg projected`;
      }
      
      data.push({
        day,
        projectedWeight: projectedWeight ? Math.round(projectedWeight) : null,
        description,
        isToday,
        isPast,
        isFuture
      });
    }
    
    return data;
  };

  const timelineData = generateTimelineData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Journey Timeline
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Select value={timeframe} onValueChange={(value: '30' | '90') => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {timelineData.map((item) => (
              <div key={item.day} className="relative flex items-center gap-4">
                {/* Timeline dot */}
                <div 
                  className={`relative z-10 w-3 h-3 rounded-full border-2 ${
                    item.isToday 
                      ? 'bg-primary border-primary' 
                      : item.isPast 
                      ? 'bg-muted border-muted-foreground' 
                      : 'bg-background border-muted-foreground'
                  }`}
                />
                
                {/* Timeline content */}
                <div className={`flex-1 py-1 ${item.isToday ? 'font-semibold' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${item.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      Day {item.day}
                    </span>
                    {item.projectedWeight && (
                      <span className="text-sm font-medium">
                        {item.projectedWeight}kg
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`text-xs mt-1 ${
                      item.isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
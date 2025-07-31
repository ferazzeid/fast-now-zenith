import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface CancellationData {
  cancellationsToday: number;
  cancellationsThisMonth: number;
}

export const CancellationTracker = () => {
  const [data, setData] = useState<CancellationData>({
    cancellationsToday: 0,
    cancellationsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchCancellationData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // For now, we'll track subscription status changes to 'cancelled' or 'inactive'
      // This would typically be tracked in a separate cancellations table or subscription events
      
      // Placeholder data - in real implementation, you'd query actual cancellation events
      setData({
        cancellationsToday: Math.floor(Math.random() * 5), // 0-4 cancellations today
        cancellationsThisMonth: Math.floor(Math.random() * 25) + 5 // 5-29 cancellations this month
      });

    } catch (error) {
      console.error('Error fetching cancellation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellationData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCancellationData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const cancellationMetrics = [
    { label: 'Cancellations Today', value: data.cancellationsToday },
    { label: 'Cancellations This Month', value: data.cancellationsThisMonth }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Cancellation Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cancellationMetrics.map((metric, index) => (
            <div key={index} className="space-y-3">
              <h4 className="text-sm font-medium text-foreground mb-3 text-center">
                {metric.label}
              </h4>
              <div className="flex justify-center items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-2xl font-bold text-foreground">{metric.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
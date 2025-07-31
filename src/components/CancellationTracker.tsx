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
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Fetch cancellations from usage_analytics where event_type includes 'cancel' or 'subscription_ended'
      const { data: todayCancellations } = await supabase
        .from('usage_analytics')
        .select('id')
        .eq('event_type', 'subscription_cancelled')
        .gte('created_at', startOfDay.toISOString());

      const { data: monthCancellations } = await supabase
        .from('usage_analytics')
        .select('id')
        .eq('event_type', 'subscription_cancelled')
        .gte('created_at', startOfMonth.toISOString());

      setData({
        cancellationsToday: todayCancellations?.length || 0,
        cancellationsThisMonth: monthCancellations?.length || 0
      });
    } catch (error) {
      console.error('Error fetching cancellation data:', error);
      setData({
        cancellationsToday: 0,
        cancellationsThisMonth: 0
      });
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
    { 
      title: 'Cancellations Today',
      items: [
        { label: 'Count', value: data.cancellationsToday }
      ]
    },
    { 
      title: 'This Month',
      items: [
        { label: 'Count', value: data.cancellationsThisMonth }
      ]
    }
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
              <h4 className="text-xs font-medium text-foreground mb-3 text-center">
                {metric.title}
              </h4>
              <div className="space-y-2">
                {metric.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
// Removed Button and icon imports - no longer needed for rotation controls
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { FastingSliderHeader } from "@/components/FastingSliderHeader";
import { useFastingHoursQuery, FastingHour, fastingHoursKey } from "@/hooks/optimized/useFastingHoursQuery";
import { useContentRotation } from '@/hooks/useContentRotation';
import { AdminPersonalLogInterface } from './AdminPersonalLogInterface';
import { AdminInsightDisplay } from './AdminInsightDisplay';
import { useAccess } from '@/hooks/useAccess';
import { useNavigate } from 'react-router-dom';
import { useOptimizedAdminPersonalLog } from '@/hooks/optimized/useOptimizedAdminPersonalLog';

import { useQueryClient } from '@tanstack/react-query';

interface FastingTimelineV2Props {
  currentHour?: number;
  className?: string;
}

const MAX_HOUR = 72;

export const FastingTimelineV2: React.FC<FastingTimelineV2Props> = ({ currentHour = 1, className }) => {
  const navigate = useNavigate();
  const { data: hours, isLoading } = useFastingHoursQuery();
  const queryClient = useQueryClient();
  const { isAdmin } = useAccess();
  const { isEnabled: isPersonalLogEnabled } = useOptimizedAdminPersonalLog();
  const [selectedHour, setSelectedHour] = useState<number>(Math.min(Math.max(currentHour || 1, 0), MAX_HOUR));
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!hasUserInteracted) {
      setSelectedHour(Math.min(Math.max(currentHour || 1, 0), MAX_HOUR));
    }
  }, [currentHour, hasUserInteracted]);

  const handleHourChange = (h: number) => {
    const clamped = Math.min(Math.max(h, 0), MAX_HOUR);
    setSelectedHour(clamped);
    setHasUserInteracted(true);
    setIsTransitioning(true);
    
    // Force immediate content refresh by resetting rotation
    setTimeout(() => setIsTransitioning(false), 100);
  };

  const hourMap = useMemo(() => {
    const map = new Map<number, FastingHour>();
    (hours || []).forEach((h) => map.set(h.hour, h));
    return map;
  }, [hours]);

  const selected = hourMap.get(selectedHour);

  const rotation = useContentRotation({
    fastingHour: selected || null,
    autoRotate: true,
    rotationInterval: 10000 // Much slower - 10 seconds
  });

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'metabolic': return 'Metabolic Changes';
      case 'physiological': return 'Physical Effects';
      case 'mental': return 'Mental State';
      case 'stage': return 'Stage';
      case 'encouragement': return 'Encouragement';
      default: return '';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <FastingSliderHeader currentHour={selectedHour} className="mb-3" onHourChange={handleHourChange} />

      {/* Details panel - boxed */}
      <Card className="mt-4 p-4" role="region" aria-live="polite">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Display Stage and Encouragement (original two-field system) */}
            <div className="min-h-[80px] relative">
              {/* Hour Number Indicator - Admin Only */}
              {isAdmin && (
                <div className="absolute bottom-2 right-2 bg-muted/20 text-foreground border border-muted rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold z-10">
                  {selectedHour}
                </div>
              )}

              <div className="relative pr-10">
                {/* Stage Title */}
                {selected?.stage && (
                  <div className="font-semibold text-foreground mb-2 text-sm">
                    {selected.stage}
                  </div>
                )}
                
                {/* Encouragement Content */}
                <div 
                  key={`${selectedHour}-encouragement`}
                  className="text-sm text-muted-foreground animate-fade-in"
                  style={{
                    animation: isTransitioning ? 'fade-in 0.3s ease-in-out' : 'fade-in 0.8s ease-in-out'
                  }}
                >
                  {rotation.currentContent}
                </div>
              </div>
            </div>
            
            {/* Read More Link */}
            {selected?.read_more_url && (
              <div className="pt-2 border-t border-border/50">
                <button
                  onClick={() => {
                    // Navigate to content page using React Router
                    navigate(`/content/fasting-hour-${selected.hour}`);
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Read more
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Admin Insight Display - Shows how it appears to regular users */}
      {selected?.admin_personal_log && isPersonalLogEnabled && (
        <AdminInsightDisplay 
          content={selected.admin_personal_log}
        />
      )}

      {/* Admin Personal Log Interface */}
      {isAdmin && isPersonalLogEnabled && (
        <AdminPersonalLogInterface
          key={`admin-log-${selectedHour}-${selected?.admin_personal_log}`} // Force re-render when data changes
          currentHour={selectedHour}
          existingLog={selected?.admin_personal_log}
          onLogSaved={async () => {
            // Force a complete data refresh to ensure UI updates
            queryClient.removeQueries({ queryKey: fastingHoursKey });
            await queryClient.invalidateQueries({ queryKey: fastingHoursKey });
            await queryClient.refetchQueries({ queryKey: fastingHoursKey });
            // Timeline refresh after log save
          }}
         />
      )}
    </div>
  );
};

export default FastingTimelineV2;
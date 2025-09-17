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
import { FullCoverageContentDisplay } from './FullCoverageContentDisplay';
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

      {/* Full Coverage Content Display */}
      <div className="mt-4" role="region" aria-live="polite">
        {isLoading ? (
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FullCoverageContentDisplay
              key={`content-${selectedHour}-${rotation.currentContent}`}
              stage={selected?.stage}
              content={rotation.currentContent}
              isTransitioning={isTransitioning}
              showAdminHour={isAdmin}
              adminHour={selectedHour}
              className="mt-0"
            />
            
            {/* Read More Link */}
            {selected?.read_more_url && (
              <div className="px-2">
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
      </div>

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
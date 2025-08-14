import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { FastingSliderHeader } from "@/components/FastingSliderHeader";
import { useFastingHoursQuery, FastingHour, fastingHoursKey } from "@/hooks/optimized/useFastingHoursQuery";
import { useContentRotation } from '@/hooks/useContentRotation';
import { AdminPersonalLogInterface } from './AdminPersonalLogInterface';
import { CacheDebugButton } from './CacheDebugButton';
import { useQueryClient } from '@tanstack/react-query';

interface FastingTimelineV2Props {
  currentHour?: number;
  className?: string;
}

const MAX_HOUR = 72;

export const FastingTimelineV2: React.FC<FastingTimelineV2Props> = ({ currentHour = 1, className }) => {
  const { data: hours, isLoading } = useFastingHoursQuery();
  const queryClient = useQueryClient();
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
      <div className="mt-4 rounded-md border bg-card p-4" role="region" aria-live="polite">
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
            {rotation.totalVariants > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rotation.goToPrevious}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rotation.toggleRotation}
                  className="h-6 w-6 p-0"
                >
                  {rotation.isRotating ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rotation.goToNext}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="min-h-[80px] relative">
              {/* Hour Number Indicator */}
              <div className="absolute bottom-2 right-2 bg-primary/10 text-primary border border-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold z-10">
                {selectedHour}
              </div>

              {rotation.totalVariants > 1 ? (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      {getContentTypeLabel(rotation.currentType)}
                    </h4>
                    <div className="text-xs text-muted-foreground">
                      {rotation.currentIndex + 1} of {rotation.totalVariants}
                    </div>
                  </div>
                  <div 
                    key={`${selectedHour}-${rotation.currentIndex}-${rotation.currentType}`}
                    className="text-sm text-foreground animate-fade-in pr-10"
                    style={{
                      animation: isTransitioning ? 'fade-in 0.3s ease-in-out' : 'fade-in 0.8s ease-in-out'
                    }}
                  >
                    {rotation.currentContent}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground pr-10">
                  {selected?.physiological_effects || selected?.body_state || "We'll add details for this hour soon."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Personal Log Interface */}
      <AdminPersonalLogInterface
        currentHour={selectedHour}
        existingLog={selected?.admin_personal_log}
        onLogSaved={async () => {
          // Force a complete data refresh to ensure UI updates
          await queryClient.refetchQueries({ queryKey: fastingHoursKey });
          console.log('🔄 TIMELINE REFRESH: Forced refetch after log save for hour', selectedHour);
        }}
      />
      
      {/* Debug button for admin */}
      <CacheDebugButton />
    </div>
  );
};

export default FastingTimelineV2;
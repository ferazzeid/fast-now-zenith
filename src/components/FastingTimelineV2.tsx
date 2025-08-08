import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { FastingSliderHeader } from "@/components/FastingSliderHeader";
import { useFastingHoursQuery, FastingHour } from "@/hooks/optimized/useFastingHoursQuery";
import { useContentRotation } from '@/hooks/useContentRotation';

interface FastingTimelineV2Props {
  currentHour?: number;
  className?: string;
}

const MAX_HOUR = 72;

export const FastingTimelineV2: React.FC<FastingTimelineV2Props> = ({ currentHour = 1, className }) => {
  const { data: hours, isLoading } = useFastingHoursQuery();
  const [selectedHour, setSelectedHour] = useState<number>(Math.min(Math.max(currentHour || 1, 1), MAX_HOUR));
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    if (!hasUserInteracted) {
      setSelectedHour(Math.min(Math.max(currentHour || 1, 1), MAX_HOUR));
    }
  }, [currentHour, hasUserInteracted]);

  const handleHourChange = (h: number) => {
    const clamped = Math.min(Math.max(h, 1), MAX_HOUR);
    setSelectedHour(clamped);
    setHasUserInteracted(true);
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
    rotationInterval: 3000
  });

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'metabolic': return 'Metabolic Changes';
      case 'physiological': return 'Physical Effects';
      case 'mental': return 'Mental State';
      case 'benefits': return 'Benefits & Challenges';
      case 'snippet': return 'Quick Summary';
      default: return 'Information';
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
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {selected?.title || "Stay focused and hydrated"}
              </div>
              
              {rotation.totalVariants > 1 && (
                <div className="flex items-center gap-2">
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
            </div>

            {selected?.stage && (
              <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                {selected.stage}
              </div>
            )}

            {rotation.totalVariants > 1 ? (
              <div className="min-h-[80px]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    {getContentTypeLabel(rotation.currentType)}
                  </h4>
                  <div className="flex gap-1">
                    {Array.from({ length: rotation.totalVariants }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => rotation.goToIndex(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === rotation.currentIndex 
                            ? 'bg-primary' 
                            : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground transition-all duration-300">
                  {rotation.currentContent}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {selected?.body_state || "We'll add details for this hour soon."}
              </div>
            )}

            {selected?.encouragement && (
              <div className="text-sm italic text-primary/80">
                "{selected.encouragement}"
              </div>
            )}

            {selected?.tips && selected.tips.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {selected.tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FastingTimelineV2;
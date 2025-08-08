import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";


import { FastingSliderHeader } from "@/components/FastingSliderHeader";
import { useFastingHoursQuery, FastingHour } from "@/hooks/optimized/useFastingHoursQuery";


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

            <div className="text-sm font-medium">
              {selected?.title || "Stay focused and hydrated"}
            </div>
            <div className="text-sm text-muted-foreground">
              {selected?.body_state || "We'll add details for this hour soon."}
            </div>


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

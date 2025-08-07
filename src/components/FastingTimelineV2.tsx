import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


import { FastingSliderHeader } from "@/components/FastingSliderHeader";
import { useFastingHoursQuery, FastingHour } from "@/hooks/optimized/useFastingHoursQuery";
import { useSearchParams } from "react-router-dom";

interface FastingTimelineV2Props {
  currentHour?: number;
  className?: string;
}

const MAX_HOUR = 72;


export const FastingTimelineV2: React.FC<FastingTimelineV2Props> = ({ currentHour = 1, className }) => {
  const { data: hours, isLoading } = useFastingHoursQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHour, setSelectedHour] = useState<number>(Math.min(Math.max(currentHour || 1, 1), MAX_HOUR));

  // Initialize from URL (?hour=) and respond to external nav changes
  useEffect(() => {
    const p = searchParams.get("hour");
    const parsed = p ? parseInt(p, 10) : NaN;
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, 1), MAX_HOUR);
      if (clamped !== selectedHour) setSelectedHour(clamped);
    }
  }, [searchParams]);

  // Keep URL in sync when user changes the slider/hour
  useEffect(() => {
    const current = searchParams.get("hour");
    const next = String(selectedHour);
    if (current !== next) {
      const sp = new URLSearchParams(searchParams);
      sp.set("hour", next);
      setSearchParams(sp, { replace: true });
    }
  }, [selectedHour]);

  const hourMap = useMemo(() => {
    const map = new Map<number, FastingHour>();
    (hours || []).forEach((h) => map.set(h.hour, h));
    return map;
  }, [hours]);

  const selected = hourMap.get(selectedHour);

  return (
    <div className={cn("w-full", className)}>
      <FastingSliderHeader currentHour={selectedHour} className="mb-3" />


      {/* Details panel */}
      <Card className="mt-4">
        <CardContent className="pt-4" role="region" aria-live="polite" aria-labelledby="hour-heading">
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
                <h3 id="hour-heading" className="text-base font-semibold">Hour {selectedHour}</h3>
                <div className="flex gap-2">
                  {hourMap.get(selectedHour)?.ketosis_milestone && (
                    <Badge variant="outline">Ketosis</Badge>
                  )}
                  {hourMap.get(selectedHour)?.autophagy_milestone && (
                    <Badge variant="outline">Autophagy</Badge>
                  )}
                  {hourMap.get(selectedHour)?.fat_burning_milestone && (
                    <Badge variant="outline">Fat Burning</Badge>
                  )}
                </div>
              </div>

              <div className="text-sm font-medium">
                {selected?.title || "Stay focused and hydrated"}
              </div>
              <div className="text-sm text-muted-foreground">
                {selected?.body_state || "We'll add details for this hour soon."}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {selected?.phase && (
                  <Badge variant="secondary">{selected.phase.replace("_", " ")}</Badge>
                )}
                {selected?.difficulty && (
                  <Badge variant={selected.difficulty === "hard" ? "destructive" : "outline"}>
                    {selected.difficulty}
                  </Badge>
                )}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default FastingTimelineV2;

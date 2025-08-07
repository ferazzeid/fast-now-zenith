import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { FastingSliderHeader } from "@/components/FastingSliderHeader";
import { useFastingHoursQuery, FastingHour } from "@/hooks/optimized/useFastingHoursQuery";
import { useSearchParams } from "react-router-dom";

interface FastingTimelineV2Props {
  currentHour?: number;
  className?: string;
}

const MAX_HOUR = 72;

const dayMarkers = [24, 48, 72];
const notableHours = [
  ...Array.from({ length: 24 }, (_, i) => i + 1),
  30, 36, 42, 48, 54, 60, 66, 72,
];

function getPercent(hour: number) {
  const h = Math.min(Math.max(hour, 1), MAX_HOUR);
  return ((h - 1) / (MAX_HOUR - 1)) * 100;
}

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

      {/* Slider */}
      <div className="relative">
        <Slider
          min={1}
          max={MAX_HOUR}
          step={1}
          value={[selectedHour]}
          onValueChange={(v) => setSelectedHour(v[0])}
          aria-label="Fasting hour selector"
          aria-valuetext={`Hour ${selectedHour}`}
        />

        {/* Progress indicator overlay (subtle) */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-primary/10"
          style={{ width: `${getPercent(selectedHour)}%` }}
          aria-hidden
        />

        {/* Notable hour dots */}
        <div className="relative mt-3 h-6">
          {notableHours.map((h) => (
            <div
              key={h}
              className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2"
              style={{ left: `${getPercent(h)}%` }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-4 h-4 rounded-full border bg-background shadow-sm hover-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      h <= selectedHour ? "border-primary bg-primary/20" : "border-muted bg-muted"
                    )}
                    aria-label={`Hour ${h}`}
                    onClick={() => setSelectedHour(h)}
                  />
                </PopoverTrigger>
                <PopoverContent sideOffset={8} className="w-64 p-3" align="center">
                  <div className="text-sm font-medium mb-1">Hour {h}</div>
                  <div className="text-xs text-muted-foreground">
                    {hourMap.get(h)?.title || "No details yet"}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ))}

          {/* Day markers */}
          {dayMarkers.map((h) => (
            <div
              key={`day-${h}`}
              className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground"
              style={{ left: `${getPercent(h)}%` }}
              aria-hidden
            >
              Day {h / 24}
            </div>
          ))}
        </div>
      </div>

      {/* Details panel */}
      <Card className="mt-4">
        <CardContent className="pt-4">
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
                <h3 className="text-base font-semibold">Hour {selectedHour}</h3>
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

import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimerModeSelectorProps {
  currentMode: 'fasting' | 'walking' | 'if';
  onModeSelect: (mode: 'fasting' | 'walking' | 'if') => void;
  timerStatus: {
    fasting: { isActive: boolean; elapsedTime: number };
    walking: { isActive: boolean; elapsedTime: number };
    if: { isActive: boolean; elapsedTime: number };
  };
  formatTime: (seconds: number) => string;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  showIF?: boolean;
}

export const TimerModeSelector: React.FC<TimerModeSelectorProps> = ({
  currentMode,
  onModeSelect,
  timerStatus,
  formatTime,
  sheetOpen,
  onSheetOpenChange,
  showIF = false,
}) => {
  const getActiveTimerCount = () => {
    let count = 0;
    if (timerStatus.fasting.isActive) count++;
    if (timerStatus.walking.isActive) count++;
    if (showIF && timerStatus.if.isActive) count++;
    return count;
  };

  const activeCount = getActiveTimerCount();

  return (
    <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-9 px-3"
        >
          <Clock className="w-4 h-4 mr-2" />
          Timer Mode
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-w-md mx-auto">
        <div className="space-y-4 py-4">
          <h3 className="text-lg font-semibold text-center">Select Timer Mode</h3>
          
          <div className="space-y-3">
            {/* Extended Fasting Mode */}
            <Button
              variant={currentMode === 'fasting' ? "default" : "outline"}
              className="w-full h-auto p-4 text-left justify-start"
              onClick={() => onModeSelect('fasting')}
            >
              <div className="flex items-center w-full">
                <Timer className="w-6 h-6 mr-3" />
                <div className="flex-1">
                  <div className="font-medium">Extended Fast</div>
                  <div className="text-sm text-muted-foreground">
                    Long-term fasting sessions
                  </div>
                  {timerStatus.fasting.isActive && (
                    <div className="text-sm text-primary font-medium">
                      Active: {formatTime(timerStatus.fasting.elapsedTime)}
                    </div>
                  )}
                </div>
              </div>
            </Button>

            {/* Intermittent Fasting Mode */}
            {showIF && (
              <Button
                variant={currentMode === 'if' ? "default" : "outline"}
                className="w-full h-auto p-4 text-left justify-start"
                onClick={() => onModeSelect('if')}
              >
                <div className="flex items-center w-full">
                  <Zap className="w-6 h-6 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">Intermittent Fast</div>
                    <div className="text-sm text-muted-foreground">
                      Daily fasting windows (16:8, OMAD)
                    </div>
                    {timerStatus.if.isActive && (
                      <div className="text-sm text-primary font-medium">
                        Active: {formatTime(timerStatus.if.elapsedTime)}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            )}

            {/* Walking Mode */}
            <Button
              variant={currentMode === 'walking' ? "default" : "outline"}
              className="w-full h-auto p-4 text-left justify-start"
              onClick={() => onModeSelect('walking')}
            >
              <div className="flex items-center w-full">
                <Clock className="w-6 h-6 mr-3" />
                <div className="flex-1">
                  <div className="font-medium">Walking</div>
                  <div className="text-sm text-muted-foreground">
                    Track walking sessions
                  </div>
                  {timerStatus.walking.isActive && (
                    <div className="text-sm text-primary font-medium">
                      Active: {formatTime(timerStatus.walking.elapsedTime)}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
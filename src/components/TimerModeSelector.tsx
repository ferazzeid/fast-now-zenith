import { Clock, FootprintsIcon, ChevronUp } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimerMode } from '@/hooks/useTimerNavigation';

interface TimerModeSelectorProps {
  currentMode: TimerMode;
  onModeSelect: (mode: TimerMode) => void;
  timerStatus: {
    fasting: { isActive: boolean; timeElapsed: number };
    walking: { isActive: boolean; timeElapsed: number };
  };
  formatTime: (seconds: number) => string;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
}

export const TimerModeSelector = ({ 
  currentMode, 
  onModeSelect, 
  timerStatus, 
  formatTime,
  sheetOpen,
  onSheetOpenChange
}: TimerModeSelectorProps) => {
  const timerModes = [
    {
      id: 'fasting' as const,
      title: 'Fasting Timer',
      description: 'Track your fasting session',
      icon: Clock,
      color: 'text-primary',
      status: timerStatus.fasting
    },
    {
      id: 'walking' as const,
      title: 'Walking Timer',
      description: 'Track your walking session',
      icon: FootprintsIcon,
      color: 'text-accent',
      status: timerStatus.walking
    }
  ];

  const activeCount = (timerStatus.fasting.isActive ? 1 : 0) + (timerStatus.walking.isActive ? 1 : 0);

  return (
    <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
      <SheetTrigger asChild>
        <div className="relative flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-warm-text hover:bg-ceramic-rim">
          {/* Main Timer Button */}
          <div className="relative flex items-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Clock className="w-5 h-5 mb-1" />
                {activeCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs p-0"
                  >
                    {activeCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">Timer</span>
            </div>
            
            {/* Integrated Arrow Section */}
            <div className="ml-1 pl-1 border-l border-muted-foreground/20">
              <ChevronUp className="w-3 h-3 opacity-60" />
            </div>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-w-md mx-auto rounded-t-xl border-x border-t bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-xs mx-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center text-sm">Select Timer Mode</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2 pb-4">
            {timerModes.map(({ id, title, description, icon: Icon, color, status }) => (
              <Button
                key={id}
                variant={currentMode === id ? "default" : "outline"}
                className="h-auto p-3 flex items-center gap-3 text-left relative justify-start"
                onClick={() => onModeSelect(id)}
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <div className="flex-1">
                  <div className={`font-medium text-sm ${currentMode === id ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {title}
                  </div>
                  <div className={`text-xs ${currentMode === id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {description}
                  </div>
                </div>
                
                {status.isActive && (
                  <div className="flex flex-col items-end">
                    <Badge variant="secondary" className="mb-1 text-xs">
                      Active
                    </Badge>
                    <div className="text-xs font-mono">
                      {formatTime(status.timeElapsed)}
                    </div>
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
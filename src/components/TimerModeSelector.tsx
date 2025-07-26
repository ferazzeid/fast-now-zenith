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
}

export const TimerModeSelector = ({ 
  currentMode, 
  onModeSelect, 
  timerStatus, 
  formatTime 
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
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-warm-text hover:bg-ceramic-rim"
        >
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
          <ChevronUp className="w-3 h-3 opacity-60 mt-0.5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle className="text-center">Select Timer Mode</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 mt-6 pb-6">
          {timerModes.map(({ id, title, description, icon: Icon, color, status }) => (
            <Button
              key={id}
              variant={currentMode === id ? "default" : "outline"}
              className="h-auto p-4 flex items-center gap-4 text-left relative"
              onClick={() => onModeSelect(id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              </div>
              
              {status.isActive && (
                <div className="flex flex-col items-end">
                  <Badge variant="secondary" className="mb-1">
                    Active
                  </Badge>
                  <div className="text-sm font-mono">
                    {formatTime(status.timeElapsed)}
                  </div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
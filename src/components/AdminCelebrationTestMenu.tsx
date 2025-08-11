import React, { useState } from 'react';
import { Settings, Sparkles, Circle, Waves, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { cn } from '@/lib/utils';

type AnimationType = 'ring-pulse' | 'particle-burst' | 'color-wave' | 'fireworks';

interface AdminCelebrationTestMenuProps {
  isVisible?: boolean;
}

export const AdminCelebrationTestMenu: React.FC<AdminCelebrationTestMenuProps> = ({
  isVisible = true
}) => {
  console.log('🎉 AdminCelebrationTestMenu render:', { isVisible });
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeCelebration, setActiveCelebration] = useState<{
    type: 'hourly' | 'completion';
    hours: number;
    message: string;
    animationType: AnimationType;
  } | null>(null);

  if (!isVisible) return null;

  const celebrationTypes = [
    {
      type: 'hourly' as const,
      animationType: 'ring-pulse' as AnimationType,
      icon: Circle,
      name: 'Hourly Ring Pulse',
      description: 'Pulsing ring animation for hourly milestones',
      hours: 24,
      message: 'Keep going strong!'
    },
    {
      type: 'completion' as const,
      animationType: 'particle-burst' as AnimationType,
      icon: Sparkles,
      name: 'Completion Sparkles',
      description: 'Sparkle burst for fast completion',
      hours: 48,
      message: 'Fast completed successfully!'
    },
    {
      type: 'hourly' as const,
      animationType: 'color-wave' as AnimationType,
      icon: Waves,
      name: 'Color Wave',
      description: 'Colorful wave animation',
      hours: 12,
      message: 'Halfway milestone reached!'
    },
    {
      type: 'completion' as const,
      animationType: 'fireworks' as AnimationType,
      icon: Zap,
      name: 'Fireworks',
      description: 'Explosive celebration for major achievements',
      hours: 72,
      message: 'Incredible achievement unlocked!'
    }
  ];

  const triggerCelebration = (celebration: typeof celebrationTypes[0]) => {
    setActiveCelebration({
      type: celebration.type,
      hours: celebration.hours,
      message: celebration.message,
      animationType: celebration.animationType
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setActiveCelebration(null);
    }, 3000);
  };

  return (
    <>
      {/* Floating Admin Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="outline"
                size="icon"
                className={cn(
                  "w-12 h-12 rounded-full shadow-lg bg-primary/10 border-primary/30",
                  "hover:bg-primary/20 transition-all duration-200",
                  isOpen && "bg-primary/20"
                )}
              >
                <Settings className="w-5 h-5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Admin: Test Celebrations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Test Menu */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40">
          <Card className="w-80 bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-primary">Celebration Tester</CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">Admin Only</Badge>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {celebrationTypes.map((celebration, index) => {
                  const IconComponent = celebration.icon;
                  return (
                    <Button
                      key={index}
                      onClick={() => triggerCelebration(celebration)}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-primary/10"
                      disabled={activeCelebration !== null}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{celebration.name}</div>
                          <div className="text-xs text-muted-foreground">{celebration.description}</div>
                          <div className="text-xs text-primary/70 mt-1">
                            {celebration.hours}h • {celebration.type}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Test different celebration animations for fasting milestones
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Celebration Overlay */}
      {activeCelebration && (
        <CelebrationOverlay
          isVisible={true}
          type={activeCelebration.type}
          hours={activeCelebration.hours}
          message={activeCelebration.message}
          animationType={activeCelebration.animationType}
        />
      )}
    </>
  );
};
import React, { useState } from 'react';
import { Settings, Sparkles, Circle, Waves, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CeramicAnimationType } from '@/components/CeramicCelebrationEffects';

interface AdminCelebrationTestMenuProps {
  isVisible?: boolean;
  onTriggerCelebration?: (event: { type: 'hourly' | 'completion'; hours: number; message: string; }) => void;
}

export const AdminCelebrationTestMenu: React.FC<AdminCelebrationTestMenuProps> = ({
  isVisible = true,
  onTriggerCelebration
}) => {
  console.log('🎉 AdminCelebrationTestMenu render:', { isVisible, hasCallback: !!onTriggerCelebration });
  
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) return null;

  const celebrationTypes = [
    {
      type: 'hourly' as const,
      animationType: 'ring-pulse' as CeramicAnimationType,
      icon: Circle,
      name: 'Hourly Ring Pulse',
      description: 'Pulsing ring animation for hourly milestones',
      hours: 24,
      message: '24 hours of fasting completed!'
    },
    {
      type: 'completion' as const,
      animationType: 'particle-burst' as CeramicAnimationType,
      icon: Sparkles,
      name: 'Completion Sparkles',
      description: 'Sparkle burst for fast completion',
      hours: 48,
      message: '🏆 Goal completed! 48 hour fast achieved!'
    },
    {
      type: 'hourly' as const,
      animationType: 'color-wave' as CeramicAnimationType,
      icon: Waves,
      name: 'Color Wave',
      description: 'Colorful wave animation',
      hours: 12,
      message: '12 hours of fasting completed!'
    },
    {
      type: 'completion' as const,
      animationType: 'fireworks' as CeramicAnimationType,
      icon: Zap,
      name: 'Fireworks',
      description: 'Explosive celebration for major achievements',
      hours: 72,
      message: '🏆 Goal completed! 72 hour fast achieved!'
    }
  ];

  const handleTestCelebration = (celebration: typeof celebrationTypes[0]) => {
    console.log('🎉 Testing celebration animation:', celebration);
    
    if (onTriggerCelebration) {
      // Trigger the ceramic timer celebration using the passed callback
      onTriggerCelebration({
        type: celebration.type,
        hours: celebration.hours,
        message: celebration.message
      });
    } else {
      console.warn('No onTriggerCelebration callback provided to AdminCelebrationTestMenu');
    }
  };

  return (
    <>
      {/* Floating Admin Button - Moved to top-right */}
      <div className="fixed top-4 right-4 z-50">
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
            <TooltipContent side="bottom">
              <p>Admin: Test Celebrations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Test Menu */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-50">
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
                      onClick={() => handleTestCelebration(celebration)}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-primary/10"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{celebration.name}</div>
                          <div className="text-xs text-muted-foreground">{celebration.description}</div>
                          <div className="text-xs text-primary/70 mt-1">
                            {celebration.hours}h • {celebration.type} • {celebration.animationType}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Test ceramic timer celebration animations • Animations appear on the ceramic timer below
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
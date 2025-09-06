import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { Utensils, Info, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useAccess } from '@/hooks/useAccess';

interface PremiumGatedCaloriesInProps {
  calories: number;
  carbs: number;
}

export const PremiumGatedCaloriesIn = ({ calories, carbs }: PremiumGatedCaloriesInProps) => {
  const { isAdmin, hasFoodAccess } = useAccess();
  const hasAccess = isAdmin || hasFoodAccess;
  
  return (
    <PremiumGate feature="Food Tracking" grayOutForFree={true} showUpgrade={false}>
      <Card className="p-3 bg-card border-border relative">
        <div className="absolute top-2 right-2">
          <ClickableTooltip content="Total calories consumed from food today">
            <Info className="w-5 h-5 text-muted-foreground" />
          </ClickableTooltip>
        </div>
        
        <div className="flex items-center space-x-2 mb-1 pr-6">
          <Utensils className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-warm-text">Calories In</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-muted-foreground">
            {Math.round(calories)} cal
          </div>
          
          {/* Dividing line and carbs */}
          <div className="flex items-center space-x-2">
            <div className="w-px h-6 bg-border"></div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-muted-foreground">{Math.round(carbs)}g</span>
              <ClickableTooltip content="Total carbs consumed from food today">
                <Info className="w-3 h-3 text-muted-foreground" />
              </ClickableTooltip>
            </div>
          </div>
        </div>
      </Card>
    </PremiumGate>
  );
};
import React from 'react';
import { Crown, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export const PremiumUpgradeModal = ({ isOpen, onClose, feature }: PremiumUpgradeModalProps) => {
  const { createSubscription, inTrial } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    try {
      await createSubscription();
      toast({
        title: "Redirecting to checkout",
        description: "Opening payment page..."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const features = [
    "Food tracking & calorie analysis",
    "AI-powered deficit analysis", 
    "Unlimited walking sessions",
    "Custom motivator creation",
    "Advanced goal metrics",
    "Priority customer support"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md bg-background border-border" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Premium Feature</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {inTrial 
                ? `"${feature}" requires a premium subscription. Your trial is still active but this feature needs an upgrade.`
                : `Your trial has expired. Upgrade to premium to access "${feature}" and all premium features.`
              }
            </p>

            {/* Features List - Mobile Optimized */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Premium includes:</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade Button - Compact */}
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 text-sm py-2"
            >
              <Crown className="w-3 h-3 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
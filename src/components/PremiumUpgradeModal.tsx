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
      <Card className="w-full max-w-lg bg-background border-border" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Premium Feature</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-base text-muted-foreground leading-relaxed">
              {inTrial 
                ? `"${feature}" requires a premium subscription. Your trial is still active but this feature needs an upgrade.`
                : `Your trial has expired. Upgrade to premium to access "${feature}" and all premium features.`
              }
            </p>

            {/* Features List */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-foreground">Premium includes:</h3>
              <div className="grid grid-cols-1 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 py-3"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </Card>
    </div>
  );
};
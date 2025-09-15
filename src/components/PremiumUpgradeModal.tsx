import React from 'react';
import { Crown, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export const PremiumUpgradeModal = ({ isOpen, onClose, feature }: PremiumUpgradeModalProps) => {
  const { createSubscription, isTrial } = useAccess();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]" onClick={onClose}>
      <div 
        className="bg-background rounded-2xl p-6 w-full max-w-sm border border-border" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Premium Feature</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 rounded-full hover:bg-muted/50 hover:scale-110 transition-all duration-200">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground text-center">
            {isTrial 
              ? "This feature requires a premium subscription."
              : "Your trial has expired. Upgrade to premium to access this feature."
            }
          </p>

          {/* Upgrade Button */}
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
};
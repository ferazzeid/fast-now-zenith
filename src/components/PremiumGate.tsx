import { ReactNode } from 'react';
import { Lock, Crown, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMultiPlatformSubscription } from '@/hooks/useMultiPlatformSubscription';
import { useToast } from '@/hooks/use-toast';
import { detectPlatform, getPlatformDisplayName } from '@/utils/platformDetection';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  className?: string;
  showUpgrade?: boolean;
}

export const PremiumGate = ({ children, feature, className = "", showUpgrade = true }: PremiumGateProps) => {
  const { subscribed, subscription_tier, requests_used, request_limit, createSubscription, platform } = useMultiPlatformSubscription();
  const { toast } = useToast();

  // Check if user has access to the feature
  const hasAccess = subscribed || subscription_tier === 'api_user' || (requests_used < request_limit);

  const handleUpgrade = async () => {
    try {
      const result = await createSubscription();
      const platformName = getPlatformDisplayName(platform as any);
      
      if (platform === 'web') {
        toast({
          title: "Redirecting to checkout",
          description: "Opening Stripe payment page..."
        });
      } else {
        toast({
          title: `${platformName} Purchase Required`,
          description: `Use ${platformName} billing to purchase premium subscription.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Grayed out content */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-4 max-w-xs">
          <div className="flex justify-center mb-2">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Premium Feature</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {feature} requires a premium subscription or your own API key.
          </p>
          {showUpgrade && (
            <div className="space-y-2">
              <Button 
                size="sm" 
                onClick={handleUpgrade}
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade to Premium
              </Button>
              <div className="text-xs text-muted-foreground">
                Or add your OpenAI API key in Settings
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
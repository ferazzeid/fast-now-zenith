import { ReactNode } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  className?: string;
  showUpgrade?: boolean;
}

export const PremiumGate = ({ children, feature, className = "", showUpgrade = true }: PremiumGateProps) => {
  const { subscribed, subscription_tier, requests_used, request_limit, createSubscription } = useSubscription();
  const { toast } = useToast();

  // Check if user has access to the feature
  const hasAccess = subscribed || subscription_tier === 'api_user' || (requests_used < request_limit);

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
import { ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { Lock, Crown, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMultiPlatformSubscription } from '@/hooks/useMultiPlatformSubscription';
import { useToast } from '@/hooks/use-toast';
import { detectPlatform, getPlatformDisplayName } from '@/utils/platformDetection';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';
import { cn } from '@/lib/utils';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  className?: string;
  showUpgrade?: boolean;
  grayOutForFree?: boolean;
}

export const PremiumGate = ({ children, feature, className = "", showUpgrade = true, grayOutForFree = false }: PremiumGateProps) => {
  const { subscribed, subscription_tier, requests_used, request_limit, createSubscription, platform, loading } = useMultiPlatformSubscription();
  const { toast } = useToast();
  const { testRole, isTestingMode } = useRoleTestingContext();

  // Use test role if in testing mode, otherwise use actual subscription data
  const effectiveRole = isTestingMode ? testRole : subscription_tier;
  const effectiveRequestsUsed = isTestingMode && testRole === 'free_user' ? 15 : requests_used;
  const effectiveRequestLimit = isTestingMode && testRole === 'free_user' ? 15 : request_limit;
  const effectiveSubscribed = isTestingMode ? (testRole === 'paid_user' || testRole === 'api_user') : subscribed;

  // Check if user has access to the feature
  const hasAccess = effectiveRole === 'api_user' || 
                   effectiveSubscribed || 
                   (effectiveRequestsUsed < effectiveRequestLimit) ||
                   effectiveRole === 'admin';
  
  // Debug logging to understand access decisions
  console.log('[PremiumGate] Access check:', {
    feature,
    effectiveRole,
    effectiveSubscribed,
    effectiveRequestsUsed,
    effectiveRequestLimit,
    hasAccess,
    loading,
    isTestingMode,
    testRole
  });

  // Show content while loading to prevent flashing
  if (loading) {
    return <>{children}</>;
  }

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

  // For free users, show grayed out content with click handler
  if (!hasAccess && (effectiveRole === 'free_user' || grayOutForFree)) {
    const handleGrayedClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast({
        title: "Premium Feature",
        description: `${feature} requires a premium subscription or your own OpenAI API key.`,
        action: showUpgrade ? (
          <Button 
            size="sm" 
            onClick={handleUpgrade}
            className="mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
          >
            <Crown className="w-4 h-4 mr-1" />
            Upgrade to Premium
          </Button>
        ) : undefined
      });
    };

    // Use cloneElement to preserve original element structure and classes
    if (isValidElement(children)) {
      const originalChild = children as ReactElement<any>;
      
      return (
        <div className="relative inline-block">
          {cloneElement(originalChild, {
            className: cn(
              originalChild.props.className,
              "opacity-40 grayscale pointer-events-none select-none cursor-not-allowed",
              className
            ),
            onClick: handleGrayedClick,
            disabled: true
          })}
          {/* Small lock indicator */}
          <div className="absolute top-1 right-1 pointer-events-none z-10">
            <div className="bg-background/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border/30">
              <Lock className="w-3 h-3 text-foreground/70" />
            </div>
          </div>
        </div>
      );
    }

    // Fallback for non-React elements
    return (
      <div 
        className={`relative inline-flex w-fit h-fit ${className} cursor-not-allowed`}
        onClick={handleGrayedClick}
      >
        <div className="opacity-40 grayscale pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute top-1 right-1 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border/30">
            <Lock className="w-3 h-3 text-foreground/70" />
          </div>
        </div>
      </div>
    );
  }

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
      <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-lg">
        <div className="text-center p-4 max-w-xs">
          <div className="flex justify-center mb-2">
            <Lock className="w-8 h-8 text-foreground/80" />
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
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
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
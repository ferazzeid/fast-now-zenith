
import React, { ReactNode, ReactElement, cloneElement, isValidElement, useEffect, useRef } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useToast } from '@/hooks/use-toast';
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
  const { subscribed, subscription_tier, isPaidUser, hasPremiumFeatures, loading, createSubscription } = useUnifiedSubscription();
  
  // For trial detection, we need to check the status
  const inTrial = subscription_tier === 'paid_user' && !subscribed; // In trial if paid but not subscribed
  const { toast } = useToast();
  const { testRole, isTestingMode } = useRoleTestingContext();

  // For role testing, only affect feature access, NOT display logic
  // The unified subscription already handles test role overrides internally
  const hasAccess = subscription_tier === 'admin' || hasPremiumFeatures;

  // Throttled debug logging to understand access decisions (logs on change or every 10s)
  const lastSnapshotRef = useRef<string>("");
  const lastLogTsRef = useRef<number>(0);
  useEffect(() => {
    const snapshot = JSON.stringify({
      feature,
      subscription_tier,
      isPaidUser,
      hasPremiumFeatures,
      hasAccess,
      loading,
      isTestingMode,
      testRole,
      inTrial
    });
    const now = Date.now();
    if (snapshot !== lastSnapshotRef.current || now - lastLogTsRef.current > 10000) {
      console.info('[PremiumGate] Access check:', {
        feature,
        subscription_tier,
        isPaidUser,
        hasPremiumFeatures,
        hasAccess,
        loading,
        isTestingMode,
        testRole,
        inTrial
      });
      lastSnapshotRef.current = snapshot;
      lastLogTsRef.current = now;
    }
  }, [feature, subscription_tier, isPaidUser, hasPremiumFeatures, hasAccess, loading, isTestingMode, testRole, inTrial]);

  // Show content while loading to prevent flashing
  if (loading) {
    return <>{children}</>;
  }

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

  if (!hasAccess && (subscription_tier === 'free_user' || grayOutForFree)) {
    const handleGrayedClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const trialMessage = inTrial 
        ? "This feature requires a premium subscription. Your trial is still active but this feature needs an upgrade."
        : "Your trial has expired. Upgrade to premium to access this feature.";
      
      toast({
        title: "Premium Feature",
        description: trialMessage,
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

    return (
      <div className={cn("relative", className)}>
        {/* Content dimmed but layout preserved */}
        <div className="grayscale opacity-50 pointer-events-none select-none">
          {children}
        </div>

        {/* Click-catcher overlay to trigger upgrade toast */}
        <div
          className="absolute inset-0 z-10"
          onClick={handleGrayedClick}
          aria-hidden="true"
        />

        {/* Corner lock that doesn't affect layout - smaller and less intrusive */}
        <div className="absolute top-1 right-1 z-20 rounded-full bg-background/90 border border-border p-0.5 shadow-sm pointer-events-none">
          <Lock className="w-2.5 h-2.5 text-muted-foreground" />
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
            {inTrial 
              ? "Your trial doesn't include this feature. Upgrade to premium to unlock it."
              : "Your trial has expired. Upgrade to premium to access this feature."
            }
          </p>
          {showUpgrade && (
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
            >
              <Crown className="w-4 h-4 mr-1" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

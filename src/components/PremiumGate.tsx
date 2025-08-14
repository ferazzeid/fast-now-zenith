
import React, { ReactNode, ReactElement, cloneElement, isValidElement, useEffect, useRef } from 'react';
import { Lock, Crown, Utensils, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useToast } from '@/hooks/use-toast';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';
import { cn } from '@/lib/utils';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  className?: string;
  showUpgrade?: boolean;
  grayOutForFree?: boolean;
}

export const PremiumGate = ({ children, feature, className = "", showUpgrade = true, grayOutForFree = false }: PremiumGateProps) => {
  const { subscribed, subscription_tier, isPaidUser, hasPremiumFeatures, loading, createSubscription, inTrial } = useUnifiedSubscription();
  const { toast } = useToast();
  const { testRole, isTestingMode } = useRoleTestingContext();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

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

  // Helper function to replace icons in children
  const replaceIconsInChildren = (children: ReactNode): ReactNode => {
    return React.Children.map(children, (child) => {
      if (isValidElement(child)) {
        // Check if this is a Utensils or Mic icon and replace with Lock
        if (child.type === Utensils || child.type === Mic) {
          return cloneElement(child, { 
            ...child.props,
            children: undefined
          } as any, <Lock className={child.props.className} />);
        }
        
        // If this element has children, recursively process them
        if (child.props?.children) {
          return cloneElement(child, {
            ...child.props,
            children: replaceIconsInChildren(child.props.children)
          } as any);
        }
      }
      return child;
    });
  };

  if (!hasAccess && (subscription_tier === 'free_user' || grayOutForFree)) {
    const handleGrayedClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (showUpgrade) {
        if (inTrial) {
          toast({
            title: "Premium Feature",
            description: `"${feature}" requires a premium subscription. Your trial is active but this feature needs an upgrade.`,
            action: (
              <Button 
                size="sm" 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
              >
                Upgrade
              </Button>
            )
          });
        } else {
          setShowUpgradeModal(true);
        }
      }
    };

    const modifiedChildren = replaceIconsInChildren(children);

    return (
      <>
        <div 
          className={cn("opacity-50 cursor-pointer", className)}
          onClick={handleGrayedClick}
        >
          {modifiedChildren}
        </div>
        
        <PremiumUpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={feature}
        />
      </>
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

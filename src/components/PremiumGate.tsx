
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
  const { testRole, isTestingMode } = useRoleTestingContext();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // For role testing, only affect feature access, NOT display logic
  // The unified subscription already handles test role overrides internally
  const hasAccess = subscription_tier === 'admin' || hasPremiumFeatures;

  // Show content while loading to prevent flashing
  if (loading) {
    return <>{children}</>;
  }

  // Helper function to replace icons in children
  const replaceIconsInChildren = (children: ReactNode): ReactNode => {
    return React.Children.map(children, (child) => {
      if (isValidElement(child)) {
        // Check if this is a Utensils or Mic icon and replace with Lock
        if (child.type === Utensils || child.type === Mic) {
          return <Lock className={child.props.className} />;
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

  // If user has access, show content normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // For locked features, show grayed out with modal on click
  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showUpgrade) {
      setShowUpgradeModal(true);
    }
  };

  const modifiedChildren = replaceIconsInChildren(children);

  return (
    <>
      <div 
        className={cn("opacity-50 cursor-pointer", className)}
        onClick={handleLockedClick}
        style={{ 
          display: 'contents' // Preserves layout structure
        }}
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
};

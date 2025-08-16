
import React, { ReactNode, ReactElement, cloneElement, isValidElement, useEffect, useRef } from 'react';
import { Lock, Crown, Utensils, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';

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
  const { access_level, hasPremiumFeatures, loading, createSubscription } = useAccess();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // Check access based on level
  const hasAccess = access_level !== 'free';

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

  // For locked features, show grayed out and intercept all clicks
  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showUpgrade) {
      setShowUpgradeModal(true);
    }
  };

  // Helper function to disable onClick handlers in children
  const disableClicksInChildren = (children: ReactNode): ReactNode => {
    return React.Children.map(children, (child) => {
      if (isValidElement(child)) {
        // Remove all click handlers and add our interceptor
        const disabledProps = { 
          ...child.props, 
          onClick: handleLockedClick,
          onDoubleClick: undefined,
          onMouseDown: undefined,
          onMouseUp: undefined,
        };
        
        // Check if this is a Utensils or Mic icon and replace with Lock
        if (child.type === Utensils || child.type === Mic) {
          return <Lock className={child.props.className} onClick={handleLockedClick} />;
        }
        
        // If this element has children, recursively process them
        if (child.props?.children) {
          return cloneElement(child, {
            ...disabledProps,
            children: disableClicksInChildren(child.props.children)
          } as any);
        }
        
        return cloneElement(child, disabledProps);
      }
      return child;
    });
  };

  const modifiedChildren = disableClicksInChildren(children);

  return (
    <>
      <div 
        className={cn("opacity-50 cursor-pointer", className)}
        onClick={handleLockedClick}
        style={{ position: 'relative' }}
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

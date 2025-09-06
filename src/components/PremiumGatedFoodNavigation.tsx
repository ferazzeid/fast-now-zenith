import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { Lock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { showFoodTrackingLimitError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface PremiumGatedFoodNavigationProps {
  children: React.ReactNode;
  path: string;
  isActive: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const PremiumGatedFoodNavigation = ({ 
  children, 
  path, 
  isActive, 
  className = '', 
  onClick 
}: PremiumGatedFoodNavigationProps) => {
  const { access_level, hasFoodAccess, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasFoodAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasFoodAccess;
  
  // Check if user has access to food tracking
  const hasAccess = effectiveLevel === 'admin' || effectiveHasFoodAccess;
  
  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      showFoodTrackingLimitError(toast, createSubscription);
      return;
    }
    onClick?.(e);
  };

  const content = (
    <Link
      to={path}
      className={`${className} ${!hasAccess ? 'opacity-50' : ''}`}
      onClick={handleClick}
    >
      {children}
      {/* Lock icon overlay for free users */}
      {!hasAccess && (
        <div className="absolute top-1 right-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </Link>
  );

  return (
    <PremiumGate feature="Food Tracking" grayOutForFree={true} showUpgrade={false}>
      {content}
    </PremiumGate>
  );
};
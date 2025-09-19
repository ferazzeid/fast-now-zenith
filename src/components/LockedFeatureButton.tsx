import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';

interface LockedFeatureButtonProps {
  children: React.ReactNode;
  hasAccess: boolean;
  onUpgradeClick?: () => void;
  className?: string;
}

export const LockedFeatureButton = ({ 
  children, 
  hasAccess, 
  onUpgradeClick,
  className = ""
}: LockedFeatureButtonProps) => {
  const { createSubscription } = useAccess();

  const handleClick = () => {
    if (!hasAccess) {
      if (onUpgradeClick) {
        onUpgradeClick();
      } else if (createSubscription) {
        createSubscription();
      }
    }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Render the locked version of the child component */}
      <div className="relative">
        {children}
        
        {/* Lock overlay */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-full flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
          onClick={handleClick}
        >
          <Lock className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
      </div>
    </div>
  );
};

// Premium placeholder button for free users
export const PremiumPlaceholderButton = ({ onUpgradeClick }: { onUpgradeClick?: () => void }) => {
  const { createSubscription } = useAccess();

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else if (createSubscription) {
      createSubscription();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/70 transition-all duration-200 flex flex-col items-center justify-center gap-1"
    >
      <Lock className="w-5 h-5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground font-medium">Premium</span>
    </Button>
  );
};
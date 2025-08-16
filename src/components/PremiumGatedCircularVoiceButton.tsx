import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Mic } from 'lucide-react';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useAccess } from '@/hooks/useAccess';
import { showAIRequestLimitError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';

interface PremiumGatedCircularVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumGatedCircularVoiceButton = (props: PremiumGatedCircularVoiceButtonProps) => {
  const { access_level, hasPremiumFeatures, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasPremiumFeatures = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasPremiumFeatures;

  // Check if user has access to voice features
  const hasAccess = effectiveLevel === 'admin' || effectiveHasPremiumFeatures;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const size = props.size || 'md';

  if (!hasAccess) {
    return (
      <Button
        onClick={() => {
          showAIRequestLimitError(
            { current_tier: 'free', limit_reached: true }, 
            toast, 
            createSubscription
          );
        }}
        disabled={props.isDisabled}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          transition-all 
          duration-200 
          bg-green-500 hover:bg-green-600
          text-white
          opacity-50
        `}
        title="Voice Input (Premium Feature)"
      >
        <Lock className={iconSizes[size]} />
      </Button>
    );
  }

  return <CircularVoiceButton {...props} />;
};
import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { AIVoiceButton } from '@/components/AIVoiceButton';
import { Button } from '@/components/ui/button';
import { Lock, Mic } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { showAIRequestLimitError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';

export const PremiumGatedAIVoiceButton = () => {
  const { access_level, hasPremiumFeatures, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasPremiumFeatures = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasPremiumFeatures;

  // Check if user has access to AI voice features
  const hasAccess = effectiveLevel === 'admin' || effectiveHasPremiumFeatures;

  if (!hasAccess) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          showAIRequestLimitError(
            { current_tier: 'free', limit_reached: true }, 
            toast, 
            createSubscription
          );
        }}
        className="ai-voice-button w-8 h-8 p-0 rounded-full bg-ai hover:bg-ai/90 hover:scale-110 transition-all duration-200 opacity-50"
        title="AI Voice Assistant (Premium Feature)"
      >
        <Lock className="w-4 h-4 text-white" />
      </Button>
    );
  }

  return <AIVoiceButton />;
};
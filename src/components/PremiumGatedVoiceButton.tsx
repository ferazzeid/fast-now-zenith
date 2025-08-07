import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';

interface PremiumGatedVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumGatedVoiceButton = (props: PremiumGatedVoiceButtonProps) => {
  return (
    <PremiumGate feature="Voice Input" grayOutForFree={true}>
      <CircularVoiceButton {...props} />
    </PremiumGate>
  );
};
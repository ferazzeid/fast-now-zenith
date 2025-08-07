import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';

interface PremiumGatedRegenerateButtonProps {
  prompt: string;
  filename: string;
  bucket?: string;
  onImageGenerated: (imageUrl: string) => void;
  disabled?: boolean;
  className?: string;
  motivatorId?: string;
}

export const PremiumGatedRegenerateButton = (props: PremiumGatedRegenerateButtonProps) => {
  return (
    <PremiumGate feature="AI Image Generation" grayOutForFree={true}>
      <RegenerateImageButton {...props} />
    </PremiumGate>
  );
};
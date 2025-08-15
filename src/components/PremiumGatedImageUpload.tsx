import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { ImageUpload } from '@/components/ImageUpload';

interface PremiumGatedImageUploadProps {
  onImageUpload: (url: string) => void;
  onImageRemove?: () => void;
  currentImageUrl?: string;
  aiGenerationPrompt?: string;
}

export const PremiumGatedImageUpload = ({ onImageRemove = () => {}, ...props }: PremiumGatedImageUploadProps) => {
  return (
    <PremiumGate feature="Image Upload" grayOutForFree={true}>
      <ImageUpload {...props} onImageRemove={onImageRemove} />
    </PremiumGate>
  );
};
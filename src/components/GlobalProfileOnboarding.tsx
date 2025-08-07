import React, { useState } from 'react';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { ProfileOnboardingFlow } from '@/components/ProfileOnboardingFlow';
import { onboardingContent } from '@/data/onboardingContent';

interface GlobalProfileOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalProfileOnboarding = ({ isOpen, onClose }: GlobalProfileOnboardingProps) => {
  const content = onboardingContent.profile;

  return (
    <PageOnboardingModal
      isOpen={isOpen}
      onClose={onClose}
      title={content.title}
      subtitle={content.subtitle}
      heroQuote={content.heroQuote}
    >
      {/* Profile setup flow */}
      <div className="mt-6 bg-muted/20 rounded-xl border border-border/50 p-6">
        <ProfileOnboardingFlow onComplete={onClose} onSkip={onClose} />
      </div>
    </PageOnboardingModal>
  );
};
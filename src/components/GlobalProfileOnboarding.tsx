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

  // Make modal non-dismissible during onboarding
  const handleClose = () => {
    // Prevent closing until onboarding is complete
    // Only ProfileOnboardingFlow can call onClose when profile is completed
  };

  return (
    <PageOnboardingModal
      isOpen={isOpen}
      onClose={handleClose}
      title={content.title}
      subtitle={content.subtitle}
      showCloseButton={false}
    >
      {/* Profile setup flow */}
      <div className="mt-6 bg-muted/20 rounded-xl border border-subtle p-6">
        <ProfileOnboardingFlow onComplete={onClose} onSkip={onClose} />
      </div>
    </PageOnboardingModal>
  );
};
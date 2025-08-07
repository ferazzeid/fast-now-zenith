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
      {content.sections.map((section, index) => (
        <div key={index} className="bg-muted/30 rounded-xl border border-border/50 p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <section.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-warm-text">{section.title}</h3>
              <p className="text-sm text-warm-text/80 leading-relaxed">{section.description}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Profile setup flow */}
      <div className="mt-6 bg-muted/20 rounded-xl border border-border/50 p-6">
        <ProfileOnboardingFlow onComplete={onClose} onSkip={onClose} />
      </div>
    </PageOnboardingModal>
  );
};
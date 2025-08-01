import { ReactNode } from 'react';
import { X, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  heroQuote?: string;
  children: ReactNode;
}

export const PageOnboardingModal = ({ isOpen, onClose, title, subtitle, heroQuote, children }: PageOnboardingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Full screen overlay */}
      <div className="min-h-screen pb-20 pt-4 px-4 flex flex-col">
        {/* Header with large close button */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1 mr-4">
            <h1 className="text-3xl font-bold text-warm-text mb-2">{title}</h1>
            {subtitle && (
              <p className="text-lg text-warm-text/80 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border border-ceramic-rim hover:bg-ceramic-plate hover:scale-110 transition-all duration-200 flex-shrink-0"
            title="Close onboarding"
          >
            <X className="w-8 h-8 text-warm-text" />
          </Button>
        </div>

        {/* Hero Quote */}
        {heroQuote && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-ceramic-plate/80 backdrop-blur-sm rounded-2xl border border-ceramic-rim p-6 relative">
              <Quote className="w-8 h-8 text-warm-text/40 absolute top-4 left-4" />
              <blockquote className="text-xl italic text-warm-text/90 leading-relaxed pl-12">
                "{heroQuote}"
              </blockquote>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <div className="bg-ceramic-plate/60 backdrop-blur-sm rounded-2xl border border-ceramic-rim p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
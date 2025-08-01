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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Mobile-optimized modal container */}
      <div className="w-full max-w-md max-h-[90vh] bg-ceramic-plate/90 backdrop-blur-sm rounded-2xl border border-ceramic-rim overflow-hidden flex flex-col">
        {/* Header with close button */}
        <div className="flex justify-between items-start p-4 border-b border-ceramic-rim/30">
          <div className="flex-1 mr-3">
            <h1 className="text-xl font-bold text-warm-text mb-1">{title}</h1>
            {subtitle && (
              <p className="text-sm text-warm-text/80 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-ceramic-plate/80 hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200 flex-shrink-0"
            title="Close onboarding"
          >
            <X className="w-8 h-8 text-warm-text" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Hero Quote */}
          {heroQuote && (
            <div className="bg-ceramic-plate/50 rounded-xl border border-ceramic-rim/50 p-4 relative">
              <Quote className="w-5 h-5 text-warm-text/40 absolute top-3 left-3" />
              <blockquote className="text-sm italic text-warm-text/90 leading-relaxed pl-8">
                "{heroQuote}"
              </blockquote>
            </div>
          )}

          {/* Content sections */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
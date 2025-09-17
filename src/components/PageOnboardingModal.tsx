import { ReactNode } from 'react';
import { X, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  heroQuote?: string;
  backgroundImage?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export const PageOnboardingModal = ({ isOpen, onClose, title, subtitle, heroQuote, backgroundImage, children, showCloseButton = true }: PageOnboardingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Mobile-optimized modal container */}
      <div className="w-full max-w-md max-h-[90vh] bg-card/90 backdrop-blur-sm rounded-2xl border border-normal overflow-hidden flex flex-col relative">
        {/* Background Image */}
        {backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 rounded-2xl"
            style={{
              backgroundImage: `url('${backgroundImage}')`
            }}
          />
        )}
        {/* Header with optional close button */}
        <div className="flex justify-between items-start p-4 border-b border-border/30 relative z-10">
          <div className={`${showCloseButton ? 'flex-1 mr-3' : 'w-full'}`}>
            <h1 className="text-xl font-bold text-warm-text mb-1">{title}</h1>
            {subtitle && (
              <p className="text-sm text-warm-text/80 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-muted/50 hover:bg-muted/70 hover:scale-110 transition-all duration-200 flex-shrink-0"
              title="Close onboarding"
            >
              <X className="w-8 h-8 text-warm-text" />
            </Button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 relative z-10">
          {/* Hero Quote */}
          {heroQuote && (
            <div className="bg-muted/30 rounded-xl border border-subtle p-4 relative mt-4">
              <Quote className="w-5 h-5 text-warm-text/40 absolute top-3 left-3" />
              <blockquote className="text-sm italic text-warm-text/90 leading-relaxed pl-8">
                "{heroQuote}"
              </blockquote>
            </div>
          )}

          {/* Content sections */}
          <div className="space-y-4 mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
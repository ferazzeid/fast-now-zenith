import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const PageOnboardingModal = ({ isOpen, onClose, title, children }: PageOnboardingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Full screen overlay */}
      <div className="min-h-screen pb-20 pt-4 px-4 flex flex-col">
        {/* Header with large close button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-warm-text">{title}</h1>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border border-ceramic-rim hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
            title="Close onboarding"
          >
            <X className="w-8 h-8 text-warm-text" />
          </Button>
        </div>

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
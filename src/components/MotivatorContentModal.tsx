import React from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';

interface MotivatorContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  motivator: {
    title: string;
    content?: string;
    imageUrl?: string;
    category?: string;
  };
}

export const MotivatorContentModal: React.FC<MotivatorContentModalProps> = ({
  isOpen,
  onClose,
  motivator
}) => {
  const isSavedQuote = motivator.category === 'saved_quote';

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={motivator.title}
      size="lg"
    >
      <div className="space-y-4">
        {motivator.imageUrl && (
          <div className="w-full h-48 rounded-lg overflow-hidden">
            <MotivatorImageWithFallback
              src={motivator.imageUrl}
              alt={motivator.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {motivator.content && (
          <div className={`text-sm leading-relaxed ${isSavedQuote ? 'text-gray-200' : 'text-foreground'}`}>
            <p className="whitespace-pre-wrap">{motivator.content}</p>
          </div>
        )}
      </div>
    </UniversalModal>
  );
};
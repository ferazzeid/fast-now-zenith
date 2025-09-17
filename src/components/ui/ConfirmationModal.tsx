import React from 'react';
import { X } from 'lucide-react';
import { UniversalModal } from './universal-modal';
import { Button } from './button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false
}) => {
  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="standard"
      size="sm"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="soft"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full hover:scale-110 transition-all duration-200"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </UniversalModal>
  );
};
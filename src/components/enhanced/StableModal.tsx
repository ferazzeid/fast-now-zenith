import React, { useEffect, useState } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';

interface StableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const StableModal = ({ isOpen, onClose, title, children, className }: StableModalProps) => {
  const [internalKey, setInternalKey] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      // Reset component state when modal opens
      setInternalKey(prev => prev + 1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <UniversalModal
      key={internalKey}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className={className}
    >
      {children}
    </UniversalModal>
  );
};
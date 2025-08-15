import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'lg' | 'xl';
}

export const StableEditModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  footer,
  size = 'sm' 
}: StableEditModalProps) => {
  
  console.log('🔒 StableEditModal: Rendering with isOpen:', isOpen);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      console.log('🔒 StableEditModal: Locking body scroll');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('🔒 StableEditModal: Unlocking body scroll');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-[425px]',
    lg: 'max-w-[600px]', 
    xl: 'max-w-[800px]'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Completely block overlay clicks - no closing allowed
    e.preventDefault();
    e.stopPropagation();
    console.log('🔒 StableEditModal: Overlay click blocked - modal stays open');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Block escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔒 StableEditModal: Escape key blocked - modal stays open');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop - absolutely no closing allowed */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={handleOverlayClick}
      />
      
      {/* Modal content */}
      <div 
        className={`
          relative bg-background border rounded-lg shadow-lg p-0 mx-4 
          ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {/* No X button - force manual close only */}
        </div>
        
        {/* Content */}
        <div className="px-6 pb-4">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
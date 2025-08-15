import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  
  // Prevent any automatic closing mechanisms
  const handleInteraction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  // Only allow manual closing through the onClose prop
  const handleOpenChange = (open: boolean) => {
    // Only close if explicitly set to false from parent component
    if (!open) {
      console.log('🔒 StableEditModal: Manual close requested');
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'sm:max-w-[425px]',
    lg: 'sm:max-w-[600px]',
    xl: 'sm:max-w-[800px]'
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
      // Disable all automatic closing mechanisms
      modal={true}
    >
      <DialogContent 
        className={`${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        onEscapeKeyDown={(e) => {
          console.log('🔒 StableEditModal: Escape key blocked');
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          console.log('🔒 StableEditModal: Outside click blocked');
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          console.log('🔒 StableEditModal: Outside interaction blocked');
          e.preventDefault();
        }}
        onClick={handleInteraction}
        onKeyDown={handleInteraction}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        {footer && (
          <DialogFooter className="gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
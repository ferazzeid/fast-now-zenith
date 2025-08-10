import React from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Clock, X, Edit3 } from 'lucide-react';

interface ImprovedWalkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  onManualAdjust: () => void;
  duration: string;
  distance?: string;
  calories?: number;
}

export const ImprovedWalkingModal = ({ 
  isOpen, 
  onClose, 
  onFinish, 
  onManualAdjust,
  duration,
  distance,
  calories 
}: ImprovedWalkingModalProps) => {
  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Walking Session Complete"
      variant="standard"
      size="md"
      showCloseButton={false}
      footer={
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 text-xs"
            size="sm"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={onManualAdjust}
            className="flex-1 text-xs"
            size="sm"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Adjust
          </Button>
          <Button 
            onClick={onFinish}
            className="flex-1 text-xs"
            size="sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            Finish
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-center">
        <div className="text-2xl font-bold text-primary">{duration}</div>
        {distance && (
          <div className="text-sm text-muted-foreground">Distance: {distance}</div>
        )}
        {calories && (
          <div className="text-sm text-muted-foreground">Estimated calories: {calories}</div>
        )}
        <p className="text-sm text-muted-foreground">
          Would you like to manually adjust this session or finish as is?
        </p>
      </div>
    </UniversalModal>
  );
};
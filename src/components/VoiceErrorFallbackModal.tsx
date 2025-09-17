import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UniversalModal } from '@/components/ui/universal-modal';
import { AlertCircle, Plus, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { capitalizeFoodName } from '@/utils/textUtils';

interface VoiceErrorFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalTranscription: string;
  errorType: 'no_foods_found' | 'analysis_failed' | 'transcription_failed';
  onManualEntry: (foodName: string) => void;
  onRetry: () => void;
}

export const VoiceErrorFallbackModal = ({
  isOpen,
  onClose,
  originalTranscription,
  errorType,
  onManualEntry,
  onRetry
}: VoiceErrorFallbackModalProps) => {
  const [manualFoodName, setManualFoodName] = useState(originalTranscription || '');
  const { toast } = useToast();

  const getErrorMessage = () => {
    switch (errorType) {
      case 'no_foods_found':
        return "I could hear you clearly but couldn't identify specific foods from what you said.";
      case 'analysis_failed':
        return "I had trouble analyzing the nutritional information for the foods you mentioned.";
      case 'transcription_failed':
        return "I had difficulty understanding your voice input clearly.";
      default:
        return "I encountered an issue processing your voice input.";
    }
  };

  const handleManualEntry = () => {
    if (!manualFoodName.trim()) {
      toast({
        title: "Food name required",
        description: "Please enter a food name to continue.",
        variant: "destructive"
      });
      return;
    }

    onManualEntry(capitalizeFoodName(manualFoodName.trim()));
    onClose();
  };

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Voice Processing Issue"
      className="max-w-md"
    >
      <div className="space-y-4">
        {/* Error explanation */}
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                Processing Issue
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {getErrorMessage()}
              </p>
            </div>
          </div>
        </Card>

        {/* Original transcription display */}
        {originalTranscription && (
          <Card className="p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">What I heard:</div>
            <div className="text-sm font-medium">"{originalTranscription}"</div>
          </Card>
        )}

        {/* Manual entry option */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Would you like to add this food manually?</div>
          <div className="flex gap-2">
            <Input
              value={manualFoodName}
              onChange={(e) => setManualFoodName(e.target.value)}
              placeholder="Enter food name..."
              className="flex-1"
            />
            <Button onClick={handleManualEntry} size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className="flex-1 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Try Voice Again
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </UniversalModal>
  );
};
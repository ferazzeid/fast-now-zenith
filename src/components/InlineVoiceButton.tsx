import React, { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumGate } from '@/components/PremiumGate';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { extractNumber } from '@/utils/numberExtraction';

interface InlineVoiceButtonProps {
  onTranscription: (text: string) => void;
  parseNumbers?: boolean; // Whether to extract numbers from transcription
  className?: string;
}

export const InlineVoiceButton = ({ 
  onTranscription, 
  parseNumbers = false,
  className = ""
}: InlineVoiceButtonProps) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleVoiceTranscription = (transcription: string) => {
    if (parseNumbers) {
      // Extract numbers from voice input for amount fields
      const number = extractNumber(transcription);
      if (number !== null) {
        onTranscription(number.toString());
      } else {
        // If no number found, use the full transcription
        onTranscription(transcription);
      }
    } else {
      // For text fields like food name, use full transcription
      onTranscription(transcription);
    }
    setShowVoiceModal(false);
  };

  return (
    <>
      <PremiumGate feature="Voice Input" showUpgrade={false}>
        <button
          type="button"
          onClick={() => setShowVoiceModal(true)}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 flex items-center justify-center z-10 ${className}`}
        >
          <Mic className="w-3 h-3" />
        </button>
      </PremiumGate>

      {/* Voice Input Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-ceramic-plate rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <h4 className="font-semibold text-warm-text mb-2">Voice Input</h4>
              <p className="text-sm text-muted-foreground">
                {parseNumbers ? "Say a number (e.g., 'one hundred', '150')" : "Speak the food name"}
              </p>
            </div>
            
            <div className="space-y-4">
              <PremiumGate feature="Voice Input" grayOutForFree={true}>
                <div className="flex justify-center">
                  <CircularVoiceButton
                    onTranscription={handleVoiceTranscription}
                    size="lg"
                  />
                </div>
              </PremiumGate>
              
              <Button
                variant="outline"
                onClick={() => setShowVoiceModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
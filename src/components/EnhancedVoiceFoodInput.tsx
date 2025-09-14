import React, { useState } from 'react';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { PremiumGate } from '@/components/PremiumGate';
import { parseVoiceFoodInput, FoodParsingResult } from '@/utils/voiceParsing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedVoiceFoodInputProps {
  onFoodParsed: (result: FoodParsingResult) => void;
  onProcessingStateChange?: (state: 'idle' | 'listening' | 'analyzing') => void;
  className?: string;
}

export const EnhancedVoiceFoodInput = ({ 
  onFoodParsed, 
  onProcessingStateChange,
  className = ""
}: EnhancedVoiceFoodInputProps) => {
  const { toast } = useToast();

  const handleVoiceTranscription = async (transcription: string) => {
    // Enhanced voice food input processing
    
    onProcessingStateChange?.('analyzing');
    
    try {
      // Parse the voice input for food information
      const parsedResult = parseVoiceFoodInput(transcription);
      
      // Return the parsed result without nutrition estimation
      onFoodParsed(parsedResult.foodName ? parsedResult : { originalText: transcription, foodName: transcription });

      if (parsedResult.foodName) {
        toast({
          title: "✓ Food Recognized",
          description: `${parsedResult.foodName}${parsedResult.amount ? ` (${parsedResult.amount}${parsedResult.unit})` : ''}`,
          className: "bg-green-600 text-white border-0",
          duration: 2000,
        });
      }

    } catch (error) {
      console.error('❌ EnhancedVoiceFoodInput: Voice food parsing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not process voice input';
      toast({
        title: "Processing Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      onProcessingStateChange?.('idle');
    }
  };

  const handleRecordingStateChange = (isRecording: boolean) => {
    if (isRecording) {
      onProcessingStateChange?.('listening');
    } else {
      // Reset to idle when recording stops (but not when processing starts)
      setTimeout(() => onProcessingStateChange?.('idle'), 100);
    }
  };

  const handleVoiceError = (error: string) => {
    // Reset processing state on any voice error
    onProcessingStateChange?.('idle');
  };

  return (
    <div className={`relative ${className}`}>
      <PremiumGate feature="Smart Voice Input" showUpgrade={false}>
        <CircularVoiceButton
          onTranscription={handleVoiceTranscription}
          onRecordingStateChange={handleRecordingStateChange}
          onError={handleVoiceError}
          size="sm"
        />
      </PremiumGate>
    </div>
  );
};
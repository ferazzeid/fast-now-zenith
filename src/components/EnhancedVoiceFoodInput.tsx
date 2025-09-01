import React, { useState } from 'react';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { PremiumGate } from '@/components/PremiumGate';
import { parseVoiceFoodInput, FoodParsingResult } from '@/utils/voiceParsing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedVoiceFoodInputProps {
  onFoodParsed: (result: FoodParsingResult & { 
    nutrition?: { 
      calories: number; 
      carbs: number; 
      protein: number; 
      fat: number; 
      confidence: number; 
    } 
  }) => void;
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
    console.log('🎯 EnhancedVoiceFoodInput: Received transcription:', transcription);
    
    onProcessingStateChange?.('analyzing');
    
    try {
      // Parse the voice input for food information
      const parsedResult = parseVoiceFoodInput(transcription);
      
      // If we have enough information, try to get nutritional estimates
      if (parsedResult.foodName) {
        try {
          const { data: nutritionData, error } = await supabase.functions.invoke('estimate-food-nutrition', {
            body: { 
              foodName: parsedResult.foodName,
              amount: parsedResult.amount,
              unit: parsedResult.unit
            }
          });

          if (error) {
            console.error('Nutrition estimation error:', error);
          }

          const result = {
            ...parsedResult,
            nutrition: !error && nutritionData ? {
              calories: nutritionData.calories || 0,
              carbs: nutritionData.carbs || 0,
              protein: nutritionData.protein || 0,
              fat: nutritionData.fat || 0,
              confidence: nutritionData.confidence || 0
            } : undefined
          };

          onFoodParsed(result);

          toast({
            title: "✓ Food Recognized",
            description: `${parsedResult.foodName}${parsedResult.amount ? ` (${parsedResult.amount}${parsedResult.unit})` : ''}`,
            className: "bg-green-600 text-white border-0",
            duration: 2000,
          });

        } catch (nutritionError) {
          console.error('Nutrition estimation failed:', nutritionError);
          // Still return the parsed result without nutrition
          onFoodParsed(parsedResult);
        }
      } else {
        // Fallback: just use the raw transcription
        onFoodParsed({ originalText: transcription, foodName: transcription });
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
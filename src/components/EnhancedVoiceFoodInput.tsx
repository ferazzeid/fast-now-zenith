import React, { useState } from 'react';
import { Mic, Loader2, Check, Sparkles } from 'lucide-react';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { PremiumGate } from '@/components/PremiumGate';
import { parseVoiceFoodInput, FoodParsingResult } from '@/utils/voiceParsing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
  className?: string;
}

export const EnhancedVoiceFoodInput = ({ 
  onFoodParsed, 
  className = ""
}: EnhancedVoiceFoodInputProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleVoiceTranscription = async (transcription: string) => {
    console.log('🎯 EnhancedVoiceFoodInput: Received transcription:', transcription);
    
    // Clear timeout if set
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setIsProcessing(false);
    setIsEstimating(true);
    setError(null);
    
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

          // Show success feedback
          setShowSuccess(true);
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
          setShowSuccess(true);
        }
      } else {
        // Fallback: just use the raw transcription
        onFoodParsed({ originalText: transcription, foodName: transcription });
        setShowSuccess(true);
      }

    } catch (error) {
      console.error('❌ EnhancedVoiceFoodInput: Voice food parsing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not process voice input';
      setError(errorMessage);
      toast({
        title: "Processing Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsEstimating(false);
      
      // Reset after showing success
      setTimeout(() => {
        setShowSuccess(false);
        setIsActive(false);
        setError(null);
      }, 1500);
    }
  };

  const handleRecordingStateChange = (recording: boolean) => {
    console.log('🎯 EnhancedVoiceFoodInput: Recording state changed:', recording);
    setIsRecording(recording);
    if (!recording && isActive) {
      setIsProcessing(true);
      
      // Set a timeout to catch stuck processing states
      const timeout = setTimeout(() => {
        console.log('⏰ EnhancedVoiceFoodInput: Processing timeout reached, resetting state');
        setIsProcessing(false);
        setIsActive(false);
        setError('Voice processing timed out. Please try again.');
        toast({
          title: "Timeout",
          description: "Voice processing took too long. Please try again.",
          variant: "destructive"
        });
      }, 30000); // 30 second timeout
      
      setTimeoutId(timeout);
    }
  };

  const handleButtonClick = () => {
    console.log('🎯 EnhancedVoiceFoodInput: Button clicked, current state:', { isActive, isRecording, isProcessing });
    
    if (!isActive) {
      console.log('🎯 EnhancedVoiceFoodInput: Activating voice input...');
      setIsActive(true);
      setError(null);
    }
  };

  const handleCancel = () => {
    console.log('🎯 EnhancedVoiceFoodInput: Canceling voice input...');
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsActive(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsEstimating(false);
    setError(null);
  };

  // Handle voice transcription errors from CircularVoiceButton
  const handleVoiceError = (error: string) => {
    console.error('❌ EnhancedVoiceFoodInput: Voice error from CircularVoiceButton:', error);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setIsProcessing(false);
    setIsEstimating(false);
    setError(error);
    
    // Reset after a delay
    setTimeout(() => {
      setIsActive(false);
      setError(null);
    }, 3000);
  };

  // Show different icons and styles based on state
  let IconComponent = Mic;
  let iconClass = "w-5 h-5";
  let buttonClass = `w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0 ${className}`;

  if (error) {
    buttonClass += " bg-red-500 text-white";
  } else if (showSuccess) {
    IconComponent = Check;
    buttonClass += " bg-green-500 text-white";
  } else if (isEstimating) {
    IconComponent = Loader2;
    iconClass += " animate-spin";
    buttonClass += " bg-ai text-white";
  } else if (isProcessing) {
    IconComponent = Loader2;
    iconClass += " animate-spin";
    buttonClass += " bg-ai text-white";
  } else if (isRecording) {
    IconComponent = Mic;
    buttonClass += " bg-red-500 text-white animate-pulse";
  } else {
    buttonClass += " bg-ai hover:bg-ai/90 text-white shadow-lg hover:shadow-xl hover:scale-105";
  }

  return (
    <>
      <div className="relative">
        <PremiumGate feature="Smart Voice Input" showUpgrade={false}>
          <button
            type="button"
            onClick={error ? handleCancel : handleButtonClick}
            className={buttonClass}
            disabled={isActive && !error}
            title={error ? error : "Smart Voice Input - Say something like '100g of grilled chicken'"}
          >
            <IconComponent className={iconClass} />
          </button>
        </PremiumGate>
        
        {/* Cancel button for active states */}
        {isActive && !error && (isProcessing || isEstimating || isRecording) && (
          <button
            type="button"
            onClick={handleCancel}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
            title="Cancel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hidden CircularVoiceButton that handles the actual recording */}
      {isActive && !error && (
        <div className="hidden">
          <CircularVoiceButton
            onTranscription={handleVoiceTranscription}
            onRecordingStateChange={handleRecordingStateChange}
            autoStart={true}
            size="sm"
            onError={handleVoiceError}
          />
        </div>
      )}
    </>
  );
};
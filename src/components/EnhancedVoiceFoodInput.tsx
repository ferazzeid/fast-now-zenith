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
  const { toast } = useToast();

  const handleVoiceTranscription = async (transcription: string) => {
    setIsProcessing(false);
    setIsEstimating(true);
    
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
      console.error('Voice food parsing error:', error);
      toast({
        title: "Processing Failed", 
        description: "Could not process voice input",
        variant: "destructive"
      });
    } finally {
      setIsEstimating(false);
      
      // Reset after showing success
      setTimeout(() => {
        setShowSuccess(false);
        setIsActive(false);
      }, 1500);
    }
  };

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
    if (!recording && isActive) {
      setIsProcessing(true);
    }
  };

  const handleButtonClick = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };

  // Show different icons and styles based on state
  let IconComponent = Mic;
  let iconClass = "w-5 h-5";
  let buttonClass = `w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0 ${className}`;

  if (showSuccess) {
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
      <PremiumGate feature="Smart Voice Input" showUpgrade={false}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={buttonClass}
          disabled={isActive}
          title="Smart Voice Input - Say something like '100g of grilled chicken'"
        >
          <IconComponent className={iconClass} />
        </button>
      </PremiumGate>

      {/* Hidden CircularVoiceButton that handles the actual recording */}
      {isActive && (
        <div className="hidden">
          <CircularVoiceButton
            onTranscription={handleVoiceTranscription}
            onRecordingStateChange={handleRecordingStateChange}
            autoStart={true}
            size="sm"
          />
        </div>
      )}
    </>
  );
};
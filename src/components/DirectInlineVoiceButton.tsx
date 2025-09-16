import React, { useState } from 'react';
import { Mic, Loader2, Check } from 'lucide-react';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { PremiumGate } from '@/components/PremiumGate';
import { extractNumber } from '@/utils/voiceParsing';

interface DirectInlineVoiceButtonProps {
  onTranscription: (text: string) => void;
  parseNumbers?: boolean; // Whether to extract numbers from transcription
  className?: string;
}

export const DirectInlineVoiceButton = ({ 
  onTranscription, 
  parseNumbers = false,
  className = ""
}: DirectInlineVoiceButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleVoiceTranscription = (transcription: string) => {
    setIsProcessing(false);
    setShowSuccess(true);
    
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
    
    // Show success briefly, then reset
    setTimeout(() => {
      setShowSuccess(false);
      setIsActive(false);
    }, 1000);
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

  // Show different icons based on state
  let IconComponent = Mic;
  let iconClass = "w-3 h-3";
  let buttonClass = `absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center z-10 ${className}`;

  if (showSuccess) {
    IconComponent = Check;
    buttonClass += " bg-green-500 text-white";
  } else if (isProcessing) {
    IconComponent = Loader2;
    iconClass += " animate-spin";
    buttonClass += " bg-primary text-primary-foreground";
  } else if (isRecording) {
    IconComponent = Mic;
    buttonClass += " bg-red-500 text-white animate-pulse";
  } else {
    buttonClass += " bg-primary hover:bg-primary/90 text-primary-foreground";
  }

  return (
    <>
      <PremiumGate feature="Voice Input" showUpgrade={false}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={buttonClass}
          disabled={isActive}
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
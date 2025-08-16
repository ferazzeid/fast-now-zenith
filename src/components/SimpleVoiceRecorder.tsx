import React from 'react';
import { CircularVoiceButton } from './CircularVoiceButton';

interface SimpleVoiceRecorderProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

export const SimpleVoiceRecorder: React.FC<SimpleVoiceRecorderProps> = ({
  onTranscription,
  isDisabled = false,
}) => {
  return (
    <div className="flex justify-center">
      <CircularVoiceButton 
        onTranscription={onTranscription}
        isDisabled={isDisabled}
        size="lg"
      />
    </div>
  );
};
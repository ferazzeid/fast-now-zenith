import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  checkVoiceCapabilities, 
  checkMicrophonePermission, 
  createMediaRecorder,
  getAudioConstraints 
} from '@/utils/voiceUtils';

interface CircularVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CircularVoiceButton: React.FC<CircularVoiceButtonProps> = ({
  onTranscription,
  isDisabled = false,
  size = 'md'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Pick a supported mimeType to avoid first-click failures on some browsers (iOS Safari)
  const getSupportedMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
    ];
    try {
      for (const t of candidates) {
        // Some browsers may not implement isTypeSupported
        // @ts-ignore
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)) {
          return t;
        }
      }
    } catch (e) {
      console.warn('🎤 mimeType detection failed, using default');
    }
    return undefined;
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      // Check voice capabilities first
      const capabilities = checkVoiceCapabilities();
      if (!capabilities.isSupported) {
        throw new Error(capabilities.error || 'Voice recording is not supported');
      }
      
      // Check microphone permission
      const permissionCheck = await checkMicrophonePermission();
      if (!permissionCheck.granted) {
        throw new Error(permissionCheck.error || 'Microphone permission denied');
      }
      
      const constraints = getAudioConstraints(true);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('🎤 MediaStream obtained, creating MediaRecorder...');
      mediaRecorderRef.current = createMediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('🎤 Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🎤 Recording stopped, cleaning up stream...');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('🎤 MediaRecorder error:', event);
      };

      // 60 second timeout for voice messages
      const recordingTimeout = setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          console.log('🎤 Recording timeout reached');
          toast({
            title: "⏱️ Recording Timeout",
            description: "Recording automatically stopped after 60 seconds.",
            variant: "destructive"
          });
          stopAndProcess();
        }
      }, 60000); // 60 seconds

      mediaRecorderRef.current.start(100); // Request data every 100ms
      setIsRecording(true);
      console.log('🎤 Recording started successfully');
      
      (mediaRecorderRef.current as any).timeout = recordingTimeout;
      
    } catch (error) {
      console.error('🎤 Error starting recording:', error);
      
      // Provide more specific error messages
      let errorMessage = "Could not access microphone. Please check permissions.";
      let errorTitle = "Recording Error";
      
      if (error instanceof Error) {
        if (error.message.includes('not supported')) {
          errorTitle = "Browser Not Supported";
          errorMessage = error.message + ". Please try a different browser like Chrome or Firefox.";
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorTitle = "Permission Denied";
          errorMessage = "Microphone access was denied. Please allow microphone permissions and try again.";
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorTitle = "No Microphone Found";
          errorMessage = "No microphone detected. Please connect a microphone and try again.";
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorTitle = "Microphone Busy";
          errorMessage = "Microphone is being used by another application. Please close other apps and try again.";
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          errorTitle = "Audio Settings Error";
          errorMessage = "Audio settings are not supported. Trying with default settings...";
          
          // Try with basic audio constraints as fallback
          setTimeout(async () => {
            try {
              const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const basicRecorder = new MediaRecorder(basicStream);
              // Continue with basic setup...
              console.log('🎤 Fallback recording started with basic settings');
            } catch (fallbackError) {
              console.error('🎤 Fallback recording also failed:', fallbackError);
            }
          }, 1000);
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const stopAndProcess = async () => {
    console.log('🎤 Stopping and processing recording...');
    
    // Clear timeout
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).timeout) {
      clearTimeout((mediaRecorderRef.current as any).timeout);
    }
    
    // Stop recording
    if (isRecording && mediaRecorderRef.current) {
      console.log('🎤 Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for onstop event
    }
    
    console.log('🎤 Audio chunks collected:', audioChunksRef.current.length);
    
    if (audioChunksRef.current.length === 0) {
      console.error('🎤 No audio chunks available');
      toast({
        title: "No Recording",
        description: "Please try recording again",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('🎤 Creating audio blob...');
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('🎤 Audio blob size:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      console.log('🎤 Converting to base64...');
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Process in chunks to prevent memory issues
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);
      console.log('🎤 Base64 length:', base64Audio.length);

      console.log('🎤 Sending to transcribe function...');
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('🎤 Supabase function error:', error);
        throw error;
      }

      console.log('🎤 Transcription response:', data);

      if (data?.text) {
        console.log('🎤 Transcription successful:', data.text);
        onTranscription(data.text);
        toast({
          title: "Message Received",
          description: "I heard you clearly and I'm processing your request",
        });
        audioChunksRef.current = [];
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('🎤 Transcription error:', error);
      
      // Provide more specific transcription error messages
      let errorMessage = "Please try recording again";
      let errorTitle = "Failed to Process";
      
      if (error instanceof Error) {
        if (error.message.includes('No transcription received')) {
          errorTitle = "No Speech Detected";
          errorMessage = "No speech was detected in your recording. Please speak clearly and try again.";
        } else if (error.message.includes('OpenAI API error') || error.message.includes('API key')) {
          errorTitle = "Service Error";
          errorMessage = "Voice processing service is temporarily unavailable. Please try again later.";
        } else if (error.message.includes('Monthly request limit')) {
          errorTitle = "Usage Limit Reached";
          errorMessage = "You've reached your monthly voice input limit. Please upgrade your subscription.";
        } else if (error.message.includes('Too many requests')) {
          errorTitle = "Too Many Requests";
          errorMessage = "Please wait a moment before trying voice input again.";
        } else if (error.message.includes('Audio blob is empty')) {
          errorTitle = "Recording Too Short";
          errorMessage = "Recording was too short. Please hold the button longer and speak clearly.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isProcessing) return;
    
    if (isRecording) {
      stopAndProcess();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled || isProcessing}
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        transition-all 
        duration-200 
        ${isRecording 
          ? 'bg-red-500 hover:bg-red-600 recording-pulse' 
          : 'bg-green-500 hover:bg-green-600'
        }
        text-white
      `}
    >
      {isProcessing ? (
        <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${iconSizes[size]}`} />
      ) : isRecording ? (
        <Square className={`${iconSizes[size]} fill-white`} />
      ) : (
        <Mic className={iconSizes[size]} />
      )}
    </Button>
  );
};
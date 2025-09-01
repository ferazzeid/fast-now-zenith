import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CircularVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  autoStart?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onError?: (error: string) => void;
}

export const CircularVoiceButton = React.forwardRef<
  { stopRecording: () => void; cancelRecording: () => void },
  CircularVoiceButtonProps
>(({
  onTranscription,
  isDisabled = false,
  size = 'md',
  autoStart = false,
  onRecordingStateChange,
  onError
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check microphone permissions on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Auto-start recording when autoStart is true
  useEffect(() => {
    if (autoStart && !isDisabled && !isRecording && !isProcessing && hasPermission) {
      console.log('🎤 Auto-starting recording...');
      startRecording();
    }
  }, [autoStart, isDisabled, hasPermission]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Expose stop recording method via ref
  React.useImperativeHandle(ref, () => ({
    stopRecording: () => {
      if (isRecording) {
        console.log('🎤 Stopping recording via ref...');
        stopAndProcess();
      }
    },
    cancelRecording: () => {
      if (isRecording) {
        console.log('🎤 Canceling recording via ref...');
        cancelRecording();
      }
    }
  }), [isRecording]);

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

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

  const checkMicrophonePermission = async () => {
    try {
      console.log('🎤 Checking microphone permission...');
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setHasPermission(result.state === 'granted');
      console.log('🎤 Permission state:', result.state);
    } catch (error) {
      console.log('🎤 Permission check not supported, will check during access');
      setHasPermission(null); // Unknown, will check during access
    }
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
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('🎤 MediaStream obtained, creating MediaRecorder...');
      setHasPermission(true);
      const mimeType = getSupportedMimeType();
      console.log('🎤 Selected mimeType:', mimeType || 'default');
      mediaRecorderRef.current = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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

      // 90 second timeout for voice messages
      const recordingTimeout = setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          console.log('🎤 Recording timeout reached');
          toast({
            title: "⏱️ Recording Timeout",
            description: "Recording automatically stopped after 90 seconds.",
            variant: "destructive"
          });
          stopAndProcess();
        }
      }, 90000); // 90 seconds

      mediaRecorderRef.current.start(100); // Request data every 100ms
      setIsRecording(true);
      console.log('🎤 Recording started successfully');
      
      (mediaRecorderRef.current as any).timeout = recordingTimeout;
      
    } catch (error) {
      console.error('🎤 Error starting recording:', error);
      setHasPermission(false);
      
      let errorMsg = "Could not access microphone. Please check permissions.";
      if (error.name === 'NotAllowedError') {
        errorMsg = "Microphone access denied. Please enable microphone permissions in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMsg = "No microphone found. Please connect a microphone and try again.";
      }
      
      toast({
        title: "Microphone Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  const cancelRecording = () => {
    console.log('🎤 Canceling recording...');
    
    // Clear timeout
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).timeout) {
      clearTimeout((mediaRecorderRef.current as any).timeout);
    }
    
    // Stop recording without processing
    if (isRecording && mediaRecorderRef.current) {
      console.log('🎤 Stopping MediaRecorder (canceling)...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Clear audio chunks without processing them
    audioChunksRef.current = [];
    console.log('🎤 Recording canceled, no processing will occur');
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
      
      // Add timeout for transcription API call (90 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error('🎤 Supabase function error:', error);
        throw error;
      }

      console.log('🎤 Transcription response:', data);

      if (data?.text) {
        console.log('🎤 Transcription successful:', data.text);
        onTranscription(data.text);
        // Tiny green checkmark toast at bottom
        toast({
          title: "✓",
          description: "",
          className: "w-16 h-8 p-2 text-center bg-green-600 text-white border-0 fixed bottom-4 right-4 text-xs",
          duration: 1500,
        });
        audioChunksRef.current = [];
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('🎤 Transcription error:', error);
      
      let errorMessage = "Please try recording again";
      
      // Handle specific error cases
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        errorMessage = "Voice processing took too long. Please try with a shorter recording.";
      } else if (error.message?.includes('limit')) {
        errorMessage = "Voice feature unavailable. Please try later or upgrade.";
      } else if (error.message?.includes('access') || error.message?.includes('premium')) {
        errorMessage = "Voice feature requires premium access";
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message?.includes('AI features are only available')) {
        errorMessage = "Voice input requires premium access. Upgrade to continue.";
      }
      
      toast({
        title: "Voice Processing Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Notify parent component of error
      onError?.(errorMessage);
      
      // Reset recording state on error
      setIsRecording(false);
      audioChunksRef.current = [];
      
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

  const getButtonColor = () => {
    if (hasPermission === false) return 'bg-gray-500 hover:bg-gray-600';
    if (isRecording) return 'bg-red-500 hover:bg-red-600 animate-pulse';
    return 'bg-green-500 hover:bg-green-600';
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
        ${getButtonColor()}
        text-white
        relative
      `}
    >
      <Mic className={iconSizes[size]} />
    </Button>
  );
});
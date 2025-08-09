import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
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
      toast({
        title: "Failed to Process",
        description: "Please try recording again",
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
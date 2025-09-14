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
      if (import.meta.env.DEV) console.log('🎤 Auto-starting recording...');
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
        if (import.meta.env.DEV) console.log('🎤 Stopping recording via ref...');
        stopAndProcess();
      }
    },
    cancelRecording: () => {
      if (isRecording) {
        if (import.meta.env.DEV) console.log('🎤 Canceling recording via ref...');
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
      if (import.meta.env.DEV) console.log('🎤 Checking microphone permission...');
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setHasPermission(result.state === 'granted');
      if (import.meta.env.DEV) console.log('🎤 Permission state:', result.state);
    } catch (error) {
      if (import.meta.env.DEV) console.log('🎤 Permission check not supported, will check during access');
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
      if (import.meta.env.DEV) console.warn('🎤 mimeType detection failed, using default');
    }
    return undefined;
  };

  const startRecording = async () => {
    try {
      console.log('🎤 [Mobile Debug] Starting recording...');
      console.log('🎤 [Mobile Debug] User agent:', navigator.userAgent);
      console.log('🎤 [Mobile Debug] Is mobile browser:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      
      // Request permissions explicitly on mobile
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('🎤 [Mobile Debug] MediaStream obtained successfully');
      console.log('🎤 [Mobile Debug] Stream active:', stream.active);
      console.log('🎤 [Mobile Debug] Audio tracks:', stream.getAudioTracks().length);
      
      setHasPermission(true);
      const mimeType = getSupportedMimeType();
      console.log('🎤 [Mobile Debug] Selected mimeType:', mimeType || 'default');
      
      mediaRecorderRef.current = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('🎤 [Mobile Debug] Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🎤 [Mobile Debug] Recording stopped, cleaning up stream...');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('🎤 [Mobile Debug] MediaRecorder error:', event);
      };

      // 90 second timeout for voice messages
      const recordingTimeout = setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          console.log('🎤 [Mobile Debug] Recording timeout reached');
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
      console.log('🎤 [Mobile Debug] Recording started successfully');
      
      (mediaRecorderRef.current as any).timeout = recordingTimeout;
      
    } catch (error) {
      console.error('🎤 [Mobile Debug] Error starting recording:', error);
      console.error('🎤 [Mobile Debug] Error name:', error.name);
      console.error('🎤 [Mobile Debug] Error message:', error.message);
      setHasPermission(false);
      
      let errorMsg = "Could not access microphone. Please check permissions.";
      if (error.name === 'NotAllowedError') {
        errorMsg = "Microphone access denied. Please enable microphone permissions in your browser settings and refresh the page.";
      } else if (error.name === 'NotFoundError') {
        errorMsg = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === 'NotSupportedError') {
        errorMsg = "Your browser doesn't support audio recording. Please try a different browser.";
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
    
    // Check if recording was long enough
    if (recordingTime < 1) {
      console.error('🎤 Recording too short:', recordingTime, 'seconds');
      cancelRecording();
      toast({
        title: "Recording Too Short",
        description: "Please record for at least 1 second before stopping.",
        variant: "destructive"
      });
      return;
    }
    
    // Clear timeout
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).timeout) {
      clearTimeout((mediaRecorderRef.current as any).timeout);
    }
    
    // Stop recording
    if (isRecording && mediaRecorderRef.current) {
      console.log('🎤 Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait longer for onstop event
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
    
    // Add a small delay to show the processing state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('🎤 Creating audio blob...');
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('🎤 Audio blob created:', audioBlob);
      console.log('🎤 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎤 Audio blob type:', audioBlob.type);

      // Validate audio blob immediately after creation
      if (audioBlob.size === 0) {
        console.error('🎤 Empty audio blob - no audio was recorded');
        throw new Error('No audio recorded. Please check your microphone and try again.');
      }

      if (audioBlob.size < 100) {
        console.error('🎤 Audio blob too small:', audioBlob.size, 'bytes');
        throw new Error('Recording too short. Please speak for at least 1-2 seconds.');
      }

      console.log('🎤 Audio blob validation passed, converting to ArrayBuffer...');

      console.log('🎤 Converting to base64...');
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('🎤 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
      
      if (arrayBuffer.byteLength === 0) {
        console.error('🎤 Empty ArrayBuffer - audio conversion failed');
        throw new Error('Audio conversion failed. Please try recording again.');
      }
      
      if (arrayBuffer.byteLength < 50) {
        console.error('🎤 ArrayBuffer too small:', arrayBuffer.byteLength, 'bytes');
        throw new Error('Audio data corrupted during conversion. Please try again.');
      }
      
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

      if (!base64Audio || base64Audio.length === 0) {
        throw new Error('Failed to convert audio to base64');
      }

      console.log('🎤 Sending to transcribe function...');
      console.log('🎤 Audio data validation - Base64 starts with:', base64Audio.substring(0, 50));
      console.log('🎤 Audio data validation - Size in KB:', Math.round(base64Audio.length / 1024));
      
      // Show immediate feedback that we're processing
      toast({
        title: "Got it!",
        description: "Converting your speech...",
        duration: 2000,
      });
      
      // Validate audio data before sending with better error message
      if (base64Audio.length < 1000) {
        console.error('🎤 Base64 too short:', base64Audio.length, 'characters');
        console.error('🎤 Original blob size:', audioBlob.size, 'bytes');
        console.error('🎤 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
        throw new Error(`Audio too short to process (${base64Audio.length} chars). Please record for at least 1-2 seconds.`);
      }
      
      // Add timeout for transcription API call (90 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const requestPayload = { audio: base64Audio };
      console.log('🎤 Request payload size:', JSON.stringify(requestPayload).length);
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session found');
      }

      // Use direct fetch instead of supabase.functions.invoke to ensure proper body transmission
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://texnkijwcygodtywgedm.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleG5raWp3Y3lnb2R0eXdnZWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQ3MDAsImV4cCI6MjA2ODc2MDcwMH0.xiOD9aVsKZCadtKiwPGnFQONjLQlaqk-ASUdLDZHNqI',
          'x-client-info': 'supabase-js-web/2.52.0',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 Direct fetch error:', response.status, errorText);
        throw new Error(`Transcription failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('🎤 Transcription response:', data);

      if (data?.text) {
        console.log('🎤 Transcription successful:', data.text);
        onTranscription(data.text);
        // Tiny green checkmark toast at bottom
        toast({
          title: "✓",
          description: "",
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
      if (error.message?.includes('empty') || error.message?.includes('short')) {
        errorMessage = "Recording failed. Please try speaking louder and longer.";
      } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
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
    if (isProcessing) return 'bg-blue-500 hover:bg-blue-600';
    if (isRecording) return 'bg-red-500 hover:bg-red-600 animate-pulse';
    return 'bg-ai hover:bg-ai/90';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Listening...';
    if (isRecording) return `Recording ${recordingTime}s`;
    if (hasPermission === false) return 'Mic needed';
    return 'Tap to speak';
  };

  return (
    <div className="flex flex-col items-center gap-2">
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
        {isProcessing ? (
          <div className={`${iconSizes[size]} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
        
        {/* Recording time indicator */}
        {isRecording && size !== 'sm' && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-mono">
            {recordingTime}
          </div>
        )}
      </Button>
      
      {/* Animated dots when processing or recording */}
      {size !== 'sm' && (isProcessing || isRecording) && (
        <div className="flex gap-1 mt-1">
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
        </div>
      )}
    </div>
  );
});
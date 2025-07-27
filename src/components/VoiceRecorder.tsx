import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, isDisabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [noiseDetected, setNoiseDetected] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      startAudioLevelMonitoring();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop audio monitoring and cleanup
        stopAudioLevelMonitoring();
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording...",
        description: "Speak your message, then click 'Send Message' when finished",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(average / 100, 1);
      
      setAudioLevel(normalizedLevel);
      
      // Detect noise/background issues
      const highFreqNoise = dataArray.slice(dataArray.length * 0.7).reduce((a, b) => a + b) / (dataArray.length * 0.3);
      setNoiseDetected(highFreqNoise > 50);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    setNoiseDetected(false);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      stopAudioLevelMonitoring();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // CRITICAL: Always check for API key first to prevent transcription failures
      // This check prevents the recurring "failed to transcribe" error
      const apiKey = localStorage.getItem('openai_api_key');
      
      if (!apiKey) {
        throw new Error('Please set your OpenAI API key in Settings first');
      }

      // Convert blob to base64 (process in chunks to avoid stack overflow)
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let binary = '';
      const chunkSize = 8192; // Process in chunks
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode(...chunk);
      }
      const base64Audio = btoa(binary);

      const response = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio },
        headers: {
          'X-OpenAI-API-Key': apiKey
        }
      });

      console.log('Transcription response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Transcription failed');
      }

      if (!response.data) {
        throw new Error('No response data received from transcription service');
      }

      const { text, error } = response.data;
      if (error) {
        throw new Error(error);
      }
      
      if (text && text.trim()) {
        onTranscription(text.trim());
        
        // FIXED: More discrete voice quality feedback - no intrusive notifications
        // Just show quality status in UI without toast
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking louder or check your microphone",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop recording without processing
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopAudioLevelMonitoring();
      
      // Clean up streams
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      toast({
        title: "Recording cancelled",
        description: "Your voice message was not sent",
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="space-y-2">
      {isRecording ? (
        <div className="flex gap-2 w-full">
          {/* FIXED: Cancel button - compact red X button */}
          <Button
            onClick={cancelRecording}
            variant="outline"
            size="lg"
            className="px-4 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
          >
            <span className="text-lg font-bold">✕</span>
          </Button>
          
          {/* FIXED: Send message button - takes remaining width */}
          <Button
            onClick={toggleRecording}
            disabled={isDisabled || isProcessing}
            variant="destructive"
            size="lg"
            className="flex-1 relative"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
            <span className="ml-2">
              {isProcessing ? "Processing..." : "Send Message"}
            </span>
            {/* FIXED: Removed red circle indicator since we have separate cancel button */}
          </Button>
        </div>
      ) : (
        /* FIXED: Full width record button to match app button style */
        <Button
          onClick={toggleRecording}
          disabled={isDisabled || isProcessing}
          variant="default"
          size="lg"
          className="w-full h-16 text-lg font-medium"
        >
          <Mic className="h-6 w-6 mr-2" />
          <span>Record Message</span>
        </Button>
      )}
    </div>
  );
};
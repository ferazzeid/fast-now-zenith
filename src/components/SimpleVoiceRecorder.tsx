import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SimpleVoiceRecorderProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

export const SimpleVoiceRecorder: React.FC<SimpleVoiceRecorderProps> = ({
  onTranscription,
  isDisabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Recording...",
        description: "Speak your message, then tap 'Send' when done",
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendRecording = async () => {
    if (!hasRecording) return;
    
    setIsProcessing(true);
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Transcribe via edge function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        onTranscription(data.text);
        toast({
          title: "✨ Message Sent!",
          description: "Your voice message has been processed",
        });
        
        // Reset state
        setHasRecording(false);
        audioChunksRef.current = [];
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Failed to Send",
        description: "Please try recording again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setHasRecording(false);
    setIsProcessing(false);
    audioChunksRef.current = [];
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Show different states
  if (isProcessing) {
    return (
      <div className="space-y-2">
        <Button 
          disabled 
          size="lg" 
          className="w-full h-16 text-base font-medium bg-blue-500"
        >
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
          Processing...
        </Button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="space-y-2">
        <Button
          onClick={stopRecording}
          size="lg"
          className="w-full h-16 text-base font-medium bg-red-500 hover:bg-red-600 text-white animate-pulse"
        >
          <Square className="h-6 w-6 mr-2" />
          <span>Stop Recording</span>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          🎤 Recording... Tap "Stop Recording" when finished
        </p>
      </div>
    );
  }

  if (hasRecording) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={cancelRecording}
            variant="outline"
            size="lg"
            className="flex-1 h-16"
          >
            Cancel
          </Button>
          <Button
            onClick={sendRecording}
            size="lg"
            className="flex-1 h-16 text-base font-medium bg-green-500 hover:bg-green-600 text-white"
          >
            <Send className="h-6 w-6 mr-2" />
            Send Message
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          ✅ Recording complete! Tap "Send Message" to process
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={startRecording}
        disabled={isDisabled}
        size="lg"
        className="w-full h-16 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Mic className="h-6 w-6 mr-2" />
        <span>Record Message</span>
      </Button>
    </div>
  );
};
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

  const sendRecording = async () => {
    // Stop recording if still recording, then process
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Wait a moment for the recording to finalize
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (audioChunksRef.current.length === 0) return;
    
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
        audioChunksRef.current = [];
        setHasRecording(false);
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

  return (
    <div className="space-y-2">
      {isRecording ? (
        <Button
          onClick={sendRecording}
          disabled={isDisabled}
          size="lg"
          className="w-full h-16 text-base font-medium bg-green-500 hover:bg-green-600 text-white"
        >
          <Send className="h-6 w-6 mr-2" />
          <span>Send</span>
        </Button>
      ) : (
        <Button
          onClick={startRecording}
          disabled={isDisabled}
          size="lg"
          className="w-full h-16 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Mic className="h-6 w-6 mr-2" />
          <span>Record Message</span>
        </Button>
      )}
    </div>
  );
};
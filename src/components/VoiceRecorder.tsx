import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onClose?: () => void;
  isDisabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onClose,
  isDisabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      // Add timeout handling (standardized to 30 seconds)
      const recordingTimeout = setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          toast({
            title: "⏱️ Recording Timeout",
            description: "Recording automatically stopped after 30 seconds",
          });
          stopRecording();
        }
      }, 30000); // 30 second timeout (standardized)

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Store timeout reference
      (mediaRecorderRef.current as any).timeout = recordingTimeout;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    // Clear timeout if exists
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).timeout) {
      clearTimeout((mediaRecorderRef.current as any).timeout);
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioURL && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioURL) return;

    setIsProcessing(true);
    try {
      // Convert audio to base64
      const response = await fetch(audioURL);
      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Call transcribe function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        onTranscription(data.text);
        toast({
          title: "✨ Transcription Complete",
          description: "Your voice has been converted to text!",
        });
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };

  // Render conditionally based on whether onClose is provided (modal vs inline)
  if (onClose) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-warm-text">Voice Recording</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Recording Controls */}
            <div className="flex flex-col items-center space-y-4">
              {!isRecording && !audioURL && (
                <Button
                  onClick={startRecording}
                  disabled={isDisabled}
                  className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              )}

              {isRecording && (
                <Button
                  onClick={stopRecording}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white animate-pulse"
                >
                  <Square className="w-8 h-8" />
                </Button>
              )}

              {audioURL && !isRecording && (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={playAudio}
                    variant="outline"
                    className="w-12 h-12 rounded-full border-primary/20 text-primary hover:bg-primary/10"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    Record Again
                  </Button>
                </div>
              )}

              {/* Status Text */}
              <p className="text-sm text-muted-foreground text-center">
                {isRecording ? 'Recording... Tap stop when finished' : 
                 audioURL ? 'Recording complete! Review or transcribe' : 
                 'Tap the microphone to start recording'}
              </p>
            </div>

            {/* Audio Element */}
            {audioURL && (
              <audio
                ref={audioRef}
                src={audioURL}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              {audioURL && (
                <Button
                  onClick={transcribeAudio}
                  disabled={isProcessing}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isProcessing ? 'Processing...' : 'Transcribe'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline version for backwards compatibility
  return (
    <div className="space-y-2">
      {isRecording ? (
        <div className="flex gap-2 w-full">
          <Button
            onClick={stopRecording}
            disabled={isDisabled || isProcessing}
            variant="destructive"
            size="lg"
            className="flex-1 h-16 text-base font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            <span className="ml-2">
              {isProcessing ? "Processing..." : "Send"}
            </span>
          </Button>
        </div>
      ) : (
        <Button
          onClick={startRecording}
          disabled={isDisabled || isProcessing}
          variant="default"
          size="lg"
          className="w-full h-16 text-base font-medium"
        >
          <Mic className="h-6 w-6 mr-2" />
          <span>Record Message</span>
        </Button>
      )}
    </div>
  );
};
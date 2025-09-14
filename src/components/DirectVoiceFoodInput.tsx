import React, { useState, useRef } from 'react';
import { Mic, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodSelectionModal } from '@/components/FoodSelectionModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { showAIAccessError } from '@/components/AIRequestLimitToast';
import { cn } from '@/lib/utils';

interface DirectVoiceFoodInputProps {
  onFoodAdded?: (foods: any[]) => void;
}

interface FoodItem {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
  image_url?: string;
}

interface FoodSuggestion {
  foods: FoodItem[];
  destination?: 'today' | 'template' | 'library';
  added?: boolean;
}

export const DirectVoiceFoodInput = ({ onFoodAdded }: DirectVoiceFoodInputProps) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Premium access control
  const { access_level, hasAIAccess, createSubscription } = useAccess();
  
  // Check if user has access to AI voice features
  const hasAccess = access_level === 'admin' || hasAIAccess;

  // Check microphone permissions on mount
  React.useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        processRecording();
      };

      mediaRecorderRef.current.start();
      setVoiceState('listening');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not start voice recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    setVoiceState('idle');
    audioChunksRef.current = [];
    
    toast({
      title: "Recording cancelled",
      description: "Voice input has been cancelled",
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      setVoiceState('processing');
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      setVoiceState('idle');
      return;
    }

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to transcription service
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe', {
          body: { audio: base64Audio }
        });

        if (transcriptionError) throw transcriptionError;

        const transcription = transcriptionData?.text;
        if (!transcription) {
          throw new Error('No transcription received');
        }

        // Process transcription for food items
        await handleVoiceTranscription(transcription);
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process voice input. Please try again.",
        variant: "destructive"
      });
      setVoiceState('idle');
    }
  };

  const handleVoiceTranscription = async (transcription: string) => {
    try {
      // Call AI to process the voice input for foods
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { 
              role: 'system', 
              content: 'You are a focused food tracking assistant. Extract food items from user input and return them with proper nutrition data.' 
            },
            { role: 'user', content: transcription }
          ],
          context: 'food_only'
        }
      });

      if (error) throw error;

      // AI response processing

      // Handle function call response (add_multiple_foods)
      if (data?.functionCall?.name === 'add_multiple_foods') {
        const foods = data.functionCall.arguments.foods || [];
        
        if (foods.length > 0) {
          setFoodSuggestion({
            foods,
            destination: 'today', // Auto-set to today
            added: false
          });
          setSelectedFoodIds(new Set(foods.map((_: any, index: number) => index)));
          setShowFoodModal(true);
        } else {
          toast({
            title: "No foods detected",
            description: "I couldn't identify any foods from your voice input. Try being more specific.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Processing failed",
          description: "I couldn't process your voice input. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ DirectVoiceFoodInput: Voice food processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not process voice input';
      toast({
        title: "Processing Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setVoiceState('idle');
    }
  };

  const handleFoodModalClose = () => {
    setShowFoodModal(false);
    setFoodSuggestion(null);
    setSelectedFoodIds(new Set());
  };

  const handleFoodUpdate = (index: number, updates: Partial<FoodItem>) => {
    if (!foodSuggestion) return;
    
    const updatedFoods = [...foodSuggestion.foods];
    updatedFoods[index] = { ...updatedFoods[index], ...updates };
    
    setFoodSuggestion({
      ...foodSuggestion,
      foods: updatedFoods
    });
  };

  const handleFoodRemove = (index: number) => {
    if (!foodSuggestion) return;
    
    const updatedFoods = foodSuggestion.foods.filter((_, i) => i !== index);
    setFoodSuggestion({
      ...foodSuggestion,
      foods: updatedFoods
    });
    
    // Update selected IDs
    const newSelectedIds = new Set<number>();
    selectedFoodIds.forEach(id => {
      if (id < index) {
        newSelectedIds.add(id);
      } else if (id > index) {
        newSelectedIds.add(id - 1);
      }
    });
    setSelectedFoodIds(newSelectedIds);
  };

  const handleDestinationChange = (destination: 'today' | 'template' | 'library') => {
    if (!foodSuggestion) return;
    
    setFoodSuggestion({
      ...foodSuggestion,
      destination
    });
  };

  const handleAddFoods = async () => {
    if (!foodSuggestion || isProcessing) return;
    
    const selectedFoods = foodSuggestion.foods.filter((_, index) => selectedFoodIds.has(index));
    
    if (selectedFoods.length === 0) {
      toast({
        title: "No foods selected",
        description: "Please select at least one food to add.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call the parent's food handler
      onFoodAdded?.(selectedFoods);
      
      toast({
        title: "✅ Foods Added",
        description: `Added ${selectedFoods.length} food${selectedFoods.length === 1 ? '' : 's'} to today's plan`,
      });
      
      handleFoodModalClose();
    } catch (error) {
      console.error('Error adding foods:', error);
      toast({
        title: "Error",
        description: "Failed to add foods. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    // Check access first
    if (!hasAccess) {
      showAIAccessError(toast, createSubscription);
      return;
    }
    
    if (voiceState === 'idle') {
      startRecording();
    } else if (voiceState === 'listening') {
      stopRecording();
    }
  };

  const getButtonStyles = () => {
    switch (voiceState) {
      case 'listening':
        return 'animate-pulse';
      case 'processing':
        return '';
      default:
        return hasAccess ? '' : 'opacity-50';
    }
  };


  return (
    <>
      <div className="relative w-full h-full">
        <Button 
          variant="action-secondary"
          size="start-button"
          className={cn(
            "w-full h-full flex items-center justify-center transition-colors",
            voiceState === 'listening'
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : voiceState === 'processing' 
                ? 'bg-ai hover:bg-ai/90 text-white'
                : hasAccess 
                  ? 'bg-ai hover:bg-ai/90 text-ai-foreground'
                  : 'bg-ai/50 text-ai-foreground opacity-50',
            voiceState !== 'listening' ? getButtonStyles() : ''
          )}
          onClick={handleButtonClick}
          disabled={voiceState === 'processing'}
          title={hasAccess ? "AI Voice Assistant" : "AI Voice Assistant (Premium Feature)"}
          aria-label={hasAccess ? "AI voice input" : "AI voice input - premium feature"}
        >
          {voiceState === 'processing' ? (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            </div>
          ) : hasAccess ? (
            <Mic className="w-11 h-11" />
          ) : (
            <Lock className="w-11 h-11" />
          )}
        </Button>

        {/* Cancel button - shows during listening and processing */}
        {(voiceState === 'listening' || voiceState === 'processing') && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/90 text-white p-0 shadow-md"
            onClick={cancelRecording}
            aria-label="Cancel recording"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Food Selection Modal */}
      <FoodSelectionModal
        isOpen={showFoodModal}
        onClose={handleFoodModalClose}
        foodSuggestion={foodSuggestion}
        selectedFoodIds={selectedFoodIds}
        onSelectionChange={setSelectedFoodIds}
        onFoodUpdate={handleFoodUpdate}
        onFoodRemove={handleFoodRemove}
        onDestinationChange={handleDestinationChange}
        onAddFoods={handleAddFoods}
        isProcessing={isProcessing}
      />
    </>
  );
};
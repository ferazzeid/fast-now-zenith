import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { ListeningAnimation } from '@/components/ListeningAnimation';
import { FoodSelectionModal } from '@/components/FoodSelectionModal';
import { PremiumGate } from '@/components/PremiumGate';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { toast } = useToast();
  const { user } = useAuth();

  const handleVoiceTranscription = async (transcription: string) => {
    console.log('🎯 DirectVoiceFoodInput: Received transcription:', transcription);
    
    setVoiceState('processing');
    
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

      console.log('🤖 AI response:', data);

      // Handle function call response (add_multiple_foods)
      if (data?.functionCall?.name === 'add_multiple_foods') {
        const foods = data.functionCall.arguments.foods || [];
        
        if (foods.length > 0) {
          setFoodSuggestion({
            foods,
            destination: 'today',
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

  const handleRecordingStateChange = (isRecording: boolean) => {
    setVoiceState(isRecording ? 'listening' : 'idle');
  };

  const handleVoiceError = (error: string) => {
    setVoiceState('idle');
    toast({
      title: "Voice Error",
      description: error,
      variant: "destructive"
    });
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
    if (voiceState === 'idle') {
      setVoiceState('listening');
    }
  };

  return (
    <>
      <PremiumGate feature="AI Voice Input" showUpgrade={false}>
        <Button 
          variant="action-primary"
          size="action-tall"
          className="w-full flex items-center justify-center"
          disabled={voiceState !== 'idle'}
          onClick={handleButtonClick}
          aria-label="Add food with voice"
        >
          <Mic className="w-5 h-5" />
        </Button>
        
        {/* Hidden CircularVoiceButton to handle actual voice recording */}
        <div className="hidden">
          <CircularVoiceButton
            onTranscription={handleVoiceTranscription}
            onRecordingStateChange={handleRecordingStateChange}
            onError={handleVoiceError}
            autoStart={voiceState === 'listening'}
            size="sm"
          />
        </div>
      </PremiumGate>

      {/* Listening/Processing Animation Overlay */}
      <ListeningAnimation state={voiceState} size="lg" />

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
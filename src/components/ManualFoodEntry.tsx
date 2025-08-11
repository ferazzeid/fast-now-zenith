import { useState } from 'react';
import { X, Camera, Sparkles, Mic } from 'lucide-react';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { PremiumGate } from '@/components/PremiumGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { getServingUnitsForUser, getDefaultServingSizeUnit, convertToGrams, getUnitDisplayName, getUnitSystemDisplay } from '@/utils/foodConversions';
import { ImageUpload } from '@/components/ImageUpload';
import { extractNumber } from '@/utils/voiceParsing';

interface ManualFoodEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: {
    name: string;
    servingAmount: string;
    servingUnit: string;
    calories: string;
    carbs: string;
    imageUrl: string;
  };
  onDataChange: (data: any) => void;
}

export const ManualFoodEntry = ({ isOpen, onClose, onSave, data, onDataChange }: ManualFoodEntryProps) => {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [isAiFillingCalories, setIsAiFillingCalories] = useState(false);
  const [isAiFillingCarbs, setIsAiFillingCarbs] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showServingVoiceRecorder, setShowServingVoiceRecorder] = useState(false);

  // Set default unit if not already set
  if (!data.servingUnit) {
    const defaultUnit = getDefaultServingSizeUnit(profile?.units);
    onDataChange({ ...data, servingUnit: defaultUnit });
  }

  const updateField = (field: string, value: string) => {
    onDataChange({ ...data, [field]: value });
  };

  const handleAiEstimate = async (field: 'calories' | 'carbs') => {
    if (!data.name) {
      toast.error('Please enter food name first');
      return;
    }

    const setLoading = field === 'calories' ? setIsAiFillingCalories : setIsAiFillingCarbs;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: 'You are a nutrition expert. Return ONLY a number with no units.' },
            { role: 'user', content: `Provide ${field} per 100g for ${data.name}. Number only.` }
          ]
        }
      });
      if (error) throw new Error(error.message || 'Unknown error from AI service');
      if (!result) throw new Error('No response from AI service');
      const response = result.completion || result.response || '';
      const numericMatch = response.match(/(\d+(?:\.\d+)?)/);
      if (numericMatch) {
        onDataChange({ ...data, [field]: numericMatch[1] });
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} estimated by AI`);
      } else {
        toast.error('Could not parse AI response. Please enter manually.');
      }
    } catch (error) {
      toast.error(`Failed to get AI estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (text: string) => {
    updateField('name', text);
    setShowVoiceRecorder(false);
  };

  const handleServingVoiceInput = (text: string) => {
    const num = extractNumber(text);
    if (num == null || Number.isNaN(num)) {
      toast.error('Could not detect a number. Please try again.');
    } else {
      updateField('servingAmount', String(num));
      toast.success('Serving amount set from voice');
    }
    setShowServingVoiceRecorder(false);
  };

  // Smart unit defaults based on food name
  const getSmartDefaultUnit = (foodName: string): string => {
    const name = foodName.toLowerCase();
    if (name.includes('egg') || name.includes('apple') || name.includes('banana') || 
        name.includes('orange') || name.includes('peach') || name.includes('pear')) {
      return 'pieces';
    }
    if (name.includes('bread') || name.includes('pizza')) {
      return 'slices';
    }
    if (name.includes('milk') || name.includes('water') || name.includes('juice')) {
      return 'cups';
    }
    return profile?.units === 'imperial' ? 'ounces' : 'grams';
  };

  // Update unit when food name changes to a common food
  const handleNameChange = (newName: string) => {
    updateField('name', newName);
    if (newName && !data.servingUnit) {
      const smartUnit = getSmartDefaultUnit(newName);
      const availableUnits = getServingUnitsForUser(profile?.units);
      if (availableUnits.some(unit => unit.value === smartUnit)) {
        updateField('servingUnit', smartUnit);
      }
    }
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Food Manually"
      variant="standard"
      size="md"
      showCloseButton={true}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Add to Food Plan
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">{getUnitSystemDisplay(profile?.units)} Mode</p>
      </div>

      <div className="space-y-4 p-4">
        {/* Required Fields */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="food-name" className="text-sm font-medium">
                Food Name <span className="text-red-500">*</span>
              </Label>
              <PremiumGate feature="Voice Input" grayOutForFree={true}>
                <button
                  type="button"
                  aria-label="Start voice input for food name"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Mic className="w-3 h-3 mx-auto" />
                </button>
              </PremiumGate>
            </div>
            <Input
              id="food-name"
              value={data.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Grilled Chicken Breast"
              className="mt-1"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="serving-amount" className="text-sm font-medium">
                Amount <span className="text-red-500">*</span>
              </Label>
              <PremiumGate feature="Voice Input" grayOutForFree={true}>
                <button
                  type="button"
                  aria-label="Start voice input for serving size"
                  onClick={() => setShowServingVoiceRecorder(true)}
                  className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Mic className="w-3 h-3 mx-auto" />
                </button>
              </PremiumGate>
            </div>
            <div className="flex gap-2 mt-1">
              <Input
                id="serving-amount"
                type="number"
                value={data.servingAmount}
                onChange={(e) => updateField('servingAmount', e.target.value)}
                placeholder="1"
                className="flex-1"
                min="0.1"
                step="0.1"
                required
              />
              <Select value={data.servingUnit} onValueChange={(value) => updateField('servingUnit', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getServingUnitsForUser(profile?.units).map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {getUnitDisplayName(unit.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Show conversion preview */}
            {data.servingAmount && data.servingUnit && data.name && (
              <div className="text-xs text-muted-foreground mt-1">
                ≈ {Math.round(convertToGrams(parseFloat(data.servingAmount) || 1, data.servingUnit, data.name))}g
              </div>
            )}
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Food Image (Optional)</Label>
          <ImageUpload
            currentImageUrl={data.imageUrl}
            onImageUpload={(url) => updateField('imageUrl', url)}
            onImageRemove={() => updateField('imageUrl', '')}
            showUploadOptionsWhenImageExists={false}
          />
        </div>

        {/* Nutritional Information */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="calories" className="text-sm font-medium">
                  Calories (per 100{profile?.units === 'imperial' ? 'oz' : 'g'}) <span className="text-red-500">*</span>
                </Label>
                <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                  <button
                    type="button"
                    aria-label="AI estimate calories per 100g"
                    onClick={() => handleAiEstimate('calories')}
                    disabled={isAiFillingCalories || !data.name}
                    className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAiFillingCalories ? (
                      <div className="w-3 h-3 animate-spin rounded-full border border-ai-foreground border-t-transparent mx-auto" />
                    ) : (
                      <Sparkles className="w-3 h-3 mx-auto" />
                    )}
                  </button>
                </PremiumGate>
              </div>
              <Input
                id="calories"
                type="number"
                value={data.calories}
                onChange={(e) => updateField('calories', e.target.value)}
                placeholder="0"
                className="mt-1"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="carbs" className="text-sm font-medium">
                  Carbs (per 100{profile?.units === 'imperial' ? 'oz' : 'g'}) <span className="text-red-500">*</span>
                </Label>
                <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                  <button
                    type="button"
                    aria-label="AI estimate carbs per 100g"
                    onClick={() => handleAiEstimate('carbs')}
                    disabled={isAiFillingCarbs || !data.name}
                    className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAiFillingCarbs ? (
                      <div className="w-3 h-3 animate-spin rounded-full border border-ai-foreground border-t-transparent mx-auto" />
                    ) : (
                      <Sparkles className="w-3 h-3 mx-auto" />
                    )}
                  </button>
                </PremiumGate>
              </div>
              <Input
                id="carbs"
                type="number"
                value={data.carbs}
                onChange={(e) => updateField('carbs', e.target.value)}
                placeholder="0"
                className="mt-1"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Recorder Modal - Food Name */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-ceramic-plate rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <h4 className="font-semibold text-warm-text mb-2">Voice Input</h4>
              <p className="text-sm text-muted-foreground">Speak the food name</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <CircularVoiceButton onTranscription={handleVoiceInput} size="lg" />
              </div>
              <Button variant="outline" onClick={() => setShowVoiceRecorder(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Recorder Modal - Serving Size */}
      {showServingVoiceRecorder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-ceramic-plate rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <h4 className="font-semibold text-warm-text mb-2">Voice Input</h4>
              <p className="text-sm text-muted-foreground">Speak the serving amount (e.g., 2, 1.5)</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <CircularVoiceButton onTranscription={handleServingVoiceInput} size="lg" />
              </div>
              <Button variant="outline" onClick={() => setShowServingVoiceRecorder(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </UniversalModal>
  );
};

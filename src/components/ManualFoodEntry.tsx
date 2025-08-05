import { useState } from 'react';
import { X, Camera, Sparkles } from 'lucide-react';
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

interface ManualFoodEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: {
    name: string;
    servingSize: string;
    servingUnit: string;
    calories: string;
    carbs: string;
  };
  onDataChange: (data: any) => void;
}

export const ManualFoodEntry = ({ isOpen, onClose, onSave, data, onDataChange }: ManualFoodEntryProps) => {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [isAiFilling, setIsAiFilling] = useState(false);
  
  // Set default unit if not already set
  if (!data.servingUnit) {
    const defaultUnit = getDefaultServingSizeUnit(profile?.units);
    onDataChange({ ...data, servingUnit: defaultUnit });
  }

  const updateField = (field: string, value: string) => {
    onDataChange({ ...data, [field]: value });
  };

  const handleAiFill = async () => {
    if (!data.name || !data.servingSize) {
      toast.error('Please enter food name and serving size first');
      return;
    }

    setIsAiFilling(true);
    try {
      console.log('Making AI request for:', data.name, data.servingSize, data.servingUnit);
      
      const servingText = `${data.servingSize} ${data.servingUnit}`;
      const { data: result, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Please provide the nutritional information per 100g for ${data.name}. The user wants to eat ${servingText}. Return only the calories and carbs per 100g as numbers. Format: calories: X, carbs: Y`,
          conversationHistory: []
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      console.log('AI response result:', result);
      console.log('AI response error:', error);

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Unknown error from AI service');
      }

      if (!result) {
        throw new Error('No response from AI service');
      }

      // Parse AI response to extract calories and carbs
      const response = result.completion || result.response || '';
      console.log('AI response text:', response);
      
      const caloriesMatch = response.match(/calories?:\s*(\d+)/i);
      const carbsMatch = response.match(/carbs?:\s*(\d+(?:\.\d+)?)/i);

      if (caloriesMatch && carbsMatch) {
        onDataChange({
          ...data,
          calories: caloriesMatch[1],
          carbs: carbsMatch[1]
        });
        toast.success('Nutritional data filled by AI');
      } else {
        console.log('Could not parse response:', response);
        toast.error('Could not parse AI response. Please enter manually.');
      }
    } catch (error) {
      console.error('AI fill error:', error);
      toast.error(`Failed to get AI suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAiFilling(false);
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
        <p className="text-xs text-muted-foreground">
          {getUnitSystemDisplay(profile?.units)} Mode
        </p>
      </div>

        <div className="space-y-4 p-4">
          {/* Required Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="food-name" className="text-sm font-medium">
                Food Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="food-name"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Grilled Chicken Breast"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="serving-size" className="text-sm font-medium">
                Serving Size <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="serving-size"
                  type="number"
                  value={data.servingSize}
                  onChange={(e) => updateField('servingSize', e.target.value)}
                  placeholder="e.g., 2"
                  className="flex-1"
                  required
                />
                <Select
                  value={data.servingUnit}
                  onValueChange={(value) => updateField('servingUnit', value)}
                >
                  <SelectTrigger className="w-24">
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
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="pt-2 border-t border-border">
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Nutritional Information (per 100g)</p>
              <p className="text-xs text-muted-foreground">
                Enter values per 100g or use AI to estimate
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calories" className="text-sm font-medium">
                  Calories (per 100g) <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="carbs" className="text-sm font-medium">
                  Carbs (per 100g) <span className="text-red-500">*</span>
                </Label>
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

            {/* AI Fill Button - Always visible since both fields are required */}
            <div className="mt-3 flex justify-center">
              <Button
                onClick={handleAiFill}
                disabled={isAiFilling || !data.name || !data.servingSize}
                variant="ai"
                size="sm"
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isAiFilling ? 'Estimating...' : 'Estimate with AI'}
              </Button>
            </div>
          </div>

        </div>
    </UniversalModal>
  );
};
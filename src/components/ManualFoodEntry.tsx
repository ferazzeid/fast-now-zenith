import { useState } from 'react';
import { X, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ManualFoodEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: {
    name: string;
    servingSize: string;
    calories: string;
    carbs: string;
  };
  onDataChange: (data: any) => void;
}

export const ManualFoodEntry = ({ isOpen, onClose, onSave, data, onDataChange }: ManualFoodEntryProps) => {
  const { session } = useAuth();
  const [isAiFilling, setIsAiFilling] = useState(false);

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
      console.log('Making AI request for:', data.name, data.servingSize);
      
      const { data: result, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Please provide the nutritional information for ${data.servingSize}g of ${data.name}. Return only the calories and carbs in grams as numbers. Format: calories: X, carbs: Y`,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] top-[50%] translate-y-[-50%] fixed">{/* Center the modal properly */}
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Food Manually</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-1">
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
                Serving Size (grams) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serving-size"
                type="number"
                value={data.servingSize}
                onChange={(e) => updateField('servingSize', e.target.value)}
                placeholder="e.g., 150"
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="pt-2 border-t border-border">
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Nutritional Information</p>
              <p className="text-xs text-muted-foreground">
                Enter manually from packaging or use AI to estimate:
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calories" className="text-sm font-medium">
                  Calories <span className="text-red-500">*</span>
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
                  Carbs (g) <span className="text-red-500">*</span>
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
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isAiFilling ? 'Estimating...' : 'Estimate with AI'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} className="flex-1">
              Add to Food Plan
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
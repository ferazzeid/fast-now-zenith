import { useState, useEffect } from 'react';
import { Sparkles, Minus, Plus, Camera } from 'lucide-react';
import { PremiumGate } from '@/components/PremiumGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraOnlyImageUpload } from '@/components/CameraOnlyImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { getServingUnitsForUser, getDefaultServingSizeUnit, getUnitDisplayName } from '@/utils/foodConversions';

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
  const [isAiFillingCalories, setIsAiFillingCalories] = useState(false);
  const [isAiFillingCarbs, setIsAiFillingCarbs] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleImageUpload = (url: string) => {
    updateField('imageUrl', url);
  };

  // Set default unit when profile loads - ensure grams for metric mode
  useEffect(() => {
    if (profile && !data.servingUnit) {
      const defaultUnit = getDefaultServingSizeUnit();
      onDataChange({ ...data, servingUnit: defaultUnit });
    }
  }, [profile]);

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

  const handleSave = () => {
    // Multiply by quantity before saving
    const finalData = {
      ...data,
      calories: String(parseFloat(data.calories || '0') * quantity),
      carbs: String(parseFloat(data.carbs || '0') * quantity)
    };
    onSave();
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
    return 'grams';
  };

  // Update unit when food name changes to a common food
  const handleNameChange = (newName: string) => {
    updateField('name', newName);
    if (newName && !data.servingUnit) {
      const smartUnit = getSmartDefaultUnit(newName);
      const availableUnits = getServingUnitsForUser();
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
    >
      {/* Image section - camera upload or display */}
      {!data.imageUrl ? (
        <div className="space-y-4 mb-4">
          <div className="text-center py-2">
            <div className="w-10 h-10 mx-auto mb-2 bg-muted rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Add image (optional)</p>
          </div>
          <CameraOnlyImageUpload onImageUpload={handleImageUpload} />
        </div>
      ) : (
        <div className="w-full h-48 mb-4">
          <img
            src={data.imageUrl}
            alt={data.name || "Food"}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Food Name */}
        <div>
          <Label htmlFor="food-name" className="text-sm font-medium mb-1 block">
            Food Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="food-name"
            value={data.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Grilled Chicken Breast"
            className="h-9"
            required
          />
        </div>

        {/* Single row: Serving Amount/Unit + Calories + Carbs */}
        <div className="grid grid-cols-4 gap-3">
          {/* Serving Amount */}
          <div>
            <Label htmlFor="serving-amount" className="text-xs font-medium mb-1 block">
              Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="serving-amount"
              type="number"
              value={data.servingAmount}
              onChange={(e) => updateField('servingAmount', e.target.value)}
              placeholder="1"
              className="text-sm h-9"
              min="0.1"
              step="0.1"
              required
            />
          </div>

          {/* Serving Unit */}
          <div>
            <Label className="text-xs font-medium mb-1 block">Unit</Label>
            <Select value={data.servingUnit} onValueChange={(value) => updateField('servingUnit', value)}>
              <SelectTrigger className="text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getServingUnitsForUser().map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {getUnitDisplayName(unit.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calories */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="calories" className="text-xs font-medium">
                Calories <span className="text-red-500">*</span>
              </Label>
              <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                <button
                  type="button"
                  aria-label="AI estimate calories per 100g"
                  onClick={() => handleAiEstimate('calories')}
                  disabled={isAiFillingCalories || !data.name}
                  className="w-5 h-5 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAiFillingCalories ? (
                    <div className="w-2.5 h-2.5 animate-spin rounded-full border border-ai-foreground border-t-transparent mx-auto" />
                  ) : (
                    <Sparkles className="w-2.5 h-2.5 mx-auto" />
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
              className={`text-sm h-9 ${
                parseFloat(data.calories) === 0 && data.calories !== '' ? 'border-destructive text-destructive' : ''
              }`}
              required
            />
            {parseFloat(data.calories) === 0 && data.calories !== '' && (
              <p className="text-xs text-destructive mt-1">Unlikely to be zero calories</p>
            )}
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="carbs" className="text-xs font-medium">
                Carbs <span className="text-red-500">*</span>
              </Label>
              <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                <button
                  type="button"
                  aria-label="AI estimate carbs per 100g"
                  onClick={() => handleAiEstimate('carbs')}
                  disabled={isAiFillingCarbs || !data.name}
                  className="w-5 h-5 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAiFillingCarbs ? (
                    <div className="w-2.5 h-2.5 animate-spin rounded-full border border-ai-foreground border-t-transparent mx-auto" />
                  ) : (
                    <Sparkles className="w-2.5 h-2.5 mx-auto" />
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
              className="text-sm h-9"
              required
            />
          </div>
        </div>

        {/* Unit system display */}
        <div className="text-xs text-muted-foreground text-center">
          Nutritional info per 100g
        </div>
      </div>

      {/* Footer - Match PhotoFoodEntry exact layout */}
      <div className="flex gap-3 pt-4">
        {/* Quantity selector with border styling like PhotoFoodEntry */}
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="h-8 w-8 p-0 rounded-r-none border-r"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="px-3 py-1 min-w-[3rem] text-center text-sm font-medium">
            {quantity}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuantity(quantity + 1)}
            className="h-8 w-8 p-0 rounded-l-none border-l"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Add Button - takes remaining space */}
        <Button 
          onClick={handleSave} 
          disabled={!data.name || !data.calories || !data.carbs}
          className="flex-1"
        >
          Add to Food Plan
        </Button>
      </div>
    </UniversalModal>
  );
};
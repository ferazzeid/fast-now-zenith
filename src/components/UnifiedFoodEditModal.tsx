import { useState } from 'react';
import { Edit, Save, Sparkles, Mic, Minus, Plus, X } from 'lucide-react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { supabase } from '@/integrations/supabase/client';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { extractNumber } from '@/utils/voiceParsing';
import { useProfile } from '@/hooks/useProfile';
import { getServingUnitsForUser, convertToGrams, getUnitDisplayName } from '@/utils/foodConversions';

// Unified interfaces for both types
interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
}

interface UserFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  is_favorite: boolean;
  image_url?: string;
}

interface UnifiedFoodEditModalProps {
  food?: UserFood;
  entry?: FoodEntry;
  onUpdate: (id: string, updates: any) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'library' | 'entry';
}

export const UnifiedFoodEditModal = ({ 
  food, 
  entry, 
  onUpdate, 
  isOpen, 
  onClose,
  mode = 'library'
}: UnifiedFoodEditModalProps) => {
  const [open, setOpen] = useState(false);
  const modalOpen = isOpen !== undefined ? isOpen : open;
  const [showServingVoiceRecorder, setShowServingVoiceRecorder] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Get current values based on mode
  const currentItem = food || entry;
  const isLibraryMode = mode === 'library' || !!food;
  
  const [name, setName] = useState(currentItem?.name || '');
  const [calories, setCalories] = useState(
    isLibraryMode 
      ? (food?.calories_per_100g?.toString() || '') 
      : (entry?.calories?.toString() || '')
  );
  const [carbs, setCarbs] = useState(
    isLibraryMode 
      ? (food?.carbs_per_100g?.toString() || '') 
      : (entry?.carbs?.toString() || '')
  );
  const [servingAmount, setServingAmount] = useState(
    !isLibraryMode && entry?.serving_size ? entry.serving_size.toString() : '1'
  );
  const [servingUnit, setServingUnit] = useState('pieces');
  const [imageUrl, setImageUrl] = useState(currentItem?.image_url || '');
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>(
    currentItem?.image_url && currentItem?.name 
      ? `High-quality photo of ${currentItem.name} on a white background, clean food photography, well-lit, appetizing`
      : ''
  );
  const { toast } = useToast();
  const { profile } = useProfile();
  
  // Get available units based on user's preference
  const availableUnits = getServingUnitsForUser(profile?.units || 'metric');

  const handleSave = async () => {
    if (!name || !calories || !carbs) {
      toast({ variant: 'destructive', title: 'Missing information', description: 'Please fill in all required fields' });
      return;
    }
    if (!isLibraryMode && (!servingAmount || parseFloat(servingAmount) <= 0)) {
      toast({ variant: 'destructive', title: 'Missing serving amount', description: 'Please enter a valid serving amount' });
      return;
    }

    setLoading(true);
    try {
      const updates = isLibraryMode ? {
        name,
        calories_per_100g: parseFloat(calories),
        carbs_per_100g: parseFloat(carbs),
        image_url: imageUrl || null
      } : {
        name,
        calories: parseFloat(calories),
        carbs: parseFloat(carbs),
        serving_size: convertToGrams(parseFloat(servingAmount), servingUnit, name),
        image_url: imageUrl || null
      };

      console.log('🎭 UnifiedFoodEditModal handleSave - calling onUpdate with:', { id: currentItem!.id, updates });
      await onUpdate(currentItem!.id, updates);
      toast({ title: isLibraryMode ? 'Food updated' : 'Entry updated', description: isLibraryMode ? 'Food has been updated in your library' : 'Food entry has been updated successfully' });
      setOpen(false);
    } catch (error) {
      console.error('🎭 UnifiedFoodEditModal handleSave error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `${isLibraryMode ? 'Failed to update food in library' : 'Failed to update food entry'}: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (!currentItem) return;
    setName(currentItem.name);
    setCalories(
      isLibraryMode 
        ? (food?.calories_per_100g?.toString() || '') 
        : (entry?.calories?.toString() || '')
    );
    setCarbs(
      isLibraryMode 
        ? (food?.carbs_per_100g?.toString() || '') 
        : (entry?.carbs?.toString() || '')
    );
    setServingAmount('1');
    setServingUnit('pieces');
    setImageUrl(currentItem.image_url || '');
    if (currentItem.image_url && currentItem.name) {
      setCurrentPrompt(`High-quality photo of ${currentItem.name} on a white background, clean food photography, well-lit, appetizing`);
    }
  };

  const generatePromptForFood = async (foodName: string) => {
    let promptTemplate = "Studio product photo of {food_name}, centered on a pristine white seamless background. Soft natural shadow under the object, high-resolution e‑commerce packshot. Single item only — no props, no garnishes, no hands, no plates, no decorations, no text.";
    let primaryColor = '220 35% 45%';
    let accentColor = '142 71% 45%';
    try {
      const { data: settingsData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['ai_image_food_prompt', 'brand_primary_color', 'brand_accent_color']);
      if (settingsData && settingsData.length > 0) {
        settingsData.forEach(setting => {
          if (setting.setting_key === 'ai_image_food_prompt' && setting.setting_value) {
            promptTemplate = setting.setting_value;
          } else if (setting.setting_key === 'brand_primary_color' && setting.setting_value) {
            primaryColor = setting.setting_value;
          } else if (setting.setting_key === 'brand_accent_color' && setting.setting_value) {
            accentColor = setting.setting_value;
          }
        });
      }
    } catch (_) {}
    const sanitizedFoodName = foodName.trim() || 'food item';
    const finalPrompt = promptTemplate
      .replace(/{food_name}/g, sanitizedFoodName)
      .replace(/{food_item}/g, sanitizedFoodName)
      .replace(/{primary_color}/g, primaryColor)
      .replace(/{accent_color}/g, accentColor);
    return finalPrompt;
  };

  const handleGenerateImage = async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'Missing food name', description: 'Please enter a food name before generating an image' });
      return;
    }
    setGeneratingImage(true);
    try {
      const prompt = await generatePromptForFood(name);
      setCurrentPrompt(prompt);
      const filename = `food-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const generatedImageUrl = await generate_image(prompt, filename);
      setImageUrl(generatedImageUrl);
      await onUpdate(currentItem!.id, { image_url: generatedImageUrl });
      toast({ title: '✨ Image Generated & Saved!', description: 'Your AI image is saved automatically.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation failed', description: 'Failed to generate image. Please try again.' });
    } finally {
      setGeneratingImage(false);
    }
  };

  const createRegenerateButton = () => {
    if (!imageUrl) return null;
    const promptToUse = currentPrompt || `High-quality photo of ${name || 'food'} on a white background, clean food photography, well-lit, appetizing`;
    return (
      <RegenerateImageButton
        prompt={promptToUse}
        filename={`food-${(name || 'item').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`}
        onImageGenerated={setImageUrl}
        disabled={loading || generatingImage}
      />
    );
  };

  const handleServingVoiceInput = (text: string) => {
    const num = extractNumber(text);
    if (num == null || Number.isNaN(num)) {
      toast({ variant: 'destructive', title: 'Voice input', description: 'Could not detect a number. Please try again.' });
    } else {
      setServingAmount(String(num));
      toast({ title: 'Serving amount set', description: 'Updated from voice input.' });
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
    setName(newName);
    if (newName && !isLibraryMode) {
      const smartUnit = getSmartDefaultUnit(newName);
      if (availableUnits.some(unit => unit.value === smartUnit)) {
        setServingUnit(smartUnit);
      }
    }
  };

  if (!currentItem) return null;

  return (
    <>
      {/* Trigger Button - only show if no external control */}
      {isOpen === undefined && (
        <div 
          className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm relative select-none outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" 
          onClick={() => setOpen(true)}
          role="menuitem"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Food
        </div>
      )}

      {/* Modal */}
      <UniversalModal
        isOpen={modalOpen}
        onClose={() => {
          if (onClose) onClose(); else setOpen(false);
          resetForm();
        }}
        title={isLibraryMode ? 'Edit Food in Library' : 'Edit Food Entry'}
        variant="standard"
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            {/* Quantity selector for entry mode */}
            {!isLibraryMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Save button */}
            <Button 
              onClick={handleSave} 
              disabled={loading || generatingImage} 
              className={`${isLibraryMode ? 'w-full' : 'px-8'}`}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        {/* Image at top - readonly display */}
        {imageUrl && (
          <div className="w-full h-48 mb-4">
            <img
              src={imageUrl}
              alt={name || "Food"}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        <div className="space-y-4">
          {/* Food Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Food Name</Label>
            <Input 
              id="edit-name" 
              value={name} 
              onChange={(e) => handleNameChange(e.target.value)} 
              placeholder="e.g., Apple, Chicken Breast" 
            />
          </div>

          {/* Single row layout for entry mode, separate for library mode */}
          {!isLibraryMode ? (
            <div className="grid grid-cols-4 gap-2">
              {/* Serving Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="edit-amount" className="text-xs font-medium">Amount</Label>
                  <button
                    onClick={() => setShowServingVoiceRecorder(true)}
                    className="w-5 h-5 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200"
                    aria-label="Voice input for serving amount"
                  >
                    <Mic className="w-2.5 h-2.5 mx-auto" />
                  </button>
                </div>
                <Input 
                  id="edit-amount" 
                  type="number" 
                  value={servingAmount} 
                  onChange={(e) => setServingAmount(e.target.value)} 
                  placeholder="1" 
                  className="text-sm"
                  min="0.1"
                  step="0.1"
                />
              </div>

              {/* Serving Unit */}
              <div>
                <Label className="text-xs font-medium mb-1 block">Unit</Label>
                <Select value={servingUnit} onValueChange={setServingUnit}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {getUnitDisplayName(unit.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calories */}
              <div>
                <Label htmlFor="edit-calories" className="text-xs font-medium mb-1 block">Calories</Label>
                <Input 
                  id="edit-calories" 
                  type="number" 
                  value={calories} 
                  onChange={(e) => setCalories(e.target.value)} 
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              {/* Carbs */}
              <div>
                <Label htmlFor="edit-carbs" className="text-xs font-medium mb-1 block">Carbs</Label>
                <Input 
                  id="edit-carbs" 
                  type="number" 
                  value={carbs} 
                  onChange={(e) => setCarbs(e.target.value)} 
                  placeholder="0"
                  className="text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-calories">Calories per 100{profile?.units === 'imperial' ? 'oz' : 'g'}</Label>
                <Input 
                  id="edit-calories" 
                  type="number" 
                  value={calories} 
                  onChange={(e) => setCalories(e.target.value)} 
                  placeholder="per 100g" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-carbs">Carbs per 100{profile?.units === 'imperial' ? 'oz' : 'g'}</Label>
                <Input 
                  id="edit-carbs" 
                  type="number" 
                  value={carbs} 
                  onChange={(e) => setCarbs(e.target.value)} 
                  placeholder="grams per 100g" 
                />
              </div>
            </div>
          )}

          {/* AI Image Generation - only show button, no upload */}
          {imageUrl && (
            <div className="flex justify-center">
              {createRegenerateButton()}
            </div>
          )}
          
          {!imageUrl && (
            <div className="flex justify-center">
              <Button
                onClick={handleGenerateImage}
                disabled={generatingImage || !name}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generatingImage ? 'Generating...' : 'Generate AI Image'}
              </Button>
            </div>
          )}
        </div>
      </UniversalModal>

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
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

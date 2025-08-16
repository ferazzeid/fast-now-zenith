import React, { useState, useEffect } from 'react';
import { Camera, Loader2, Sparkles, X, RefreshCcw, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumGatedImageUpload } from '@/components/PremiumGatedImageUpload';
import { Badge } from '@/components/ui/badge';
import { PremiumGate } from '@/components/PremiumGate';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { getServingUnitsForUser, getDefaultServingSizeUnit, getUnitDisplayName } from '@/utils/foodConversions';
import { trackFoodEvent } from '@/utils/analytics';

interface AnalysisResult {
  name?: string;
  calories_per_100g?: number;
  carbs_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  estimated_serving_size?: number;
  confidence?: number;
  description?: string;
}

interface UnifiedFoodEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const UnifiedFoodEntry = ({ isOpen, onClose, onSave }: UnifiedFoodEntryProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { hasPremiumFeatures } = useAccess();
  const isSubscriptionActive = hasPremiumFeatures;
  
  // Image and analysis state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [servingAmount, setServingAmount] = useState('');
  const [servingUnit, setServingUnit] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // AI estimation loading states
  const [isAiFillingCalories, setIsAiFillingCalories] = useState(false);
  const [isAiFillingCarbs, setIsAiFillingCarbs] = useState(false);

  // Set default unit when profile loads
  useEffect(() => {
    if (profile && !servingUnit) {
      const defaultUnit = getDefaultServingSizeUnit();
      setServingUnit(defaultUnit);
    }
  }, [profile, servingUnit]);

  const handleImageUpload = async (url: string) => {
    setImageUrl(url);
    setAnalysisResult(null);
    setError(null);
    
    // For premium users, automatically analyze the image
    if (isSubscriptionActive) {
      await analyzeImage(url);
    }
  };

  const analyzeImage = async (url: string) => {
    try {
      setAnalyzing(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { imageUrl: url },
      });
      if (error) throw error;
      
      const result = data as AnalysisResult;
      setAnalysisResult(result);
      
      // Only populate empty fields - never override manual input
      if (result.name && !name) setName(result.name);
      if (result.estimated_serving_size && !servingAmount) {
        setServingAmount(result.estimated_serving_size.toString());
      }
      
      // Calculate and set nutritional values only if fields are empty
      if (result.estimated_serving_size && !calories && !carbs) {
        const caloriesPer100g = result.calories_per_100g || 0;
        const totalCalories = Math.round((caloriesPer100g * result.estimated_serving_size) / 100);
        setCalories(totalCalories.toString());
        
        const carbsPer100g = result.carbs_per_100g || 0;
        const totalCarbs = Math.round((carbsPer100g * result.estimated_serving_size) / 100);
        setCarbs(totalCarbs.toString());
      }
      
      toast({ 
        title: 'Analysis complete', 
        description: 'Food detected! Review and adjust if needed.' 
      });
    } catch (e: any) {
      console.error('Analyze error', e);
      setError('Failed to analyze image');
      toast({ 
        title: 'Analysis failed', 
        description: 'Please try another photo or enter details manually.', 
        variant: 'destructive' 
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAiEstimate = async (field: 'calories' | 'carbs') => {
    if (!name || !servingAmount || !servingUnit) {
      toast({
        title: "Missing information",
        description: "Please enter food name, amount, and unit first",
        variant: "destructive"
      });
      return;
    }

    const setLoading = field === 'calories' ? setIsAiFillingCalories : setIsAiFillingCarbs;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: 'You are a nutrition expert. Return ONLY a number with no units.' },
            { role: 'user', content: `Provide ${field} for ${servingAmount} ${servingUnit} of ${name}. Number only.` }
          ]
        }
      });
      if (error) throw new Error(error.message || 'Unknown error from AI service');
      if (!result) throw new Error('No response from AI service');
      const response = result.completion || result.response || '';
      const numericMatch = response.match(/(\d+(?:\.\d+)?)/);
      if (numericMatch) {
        if (field === 'calories') {
          setCalories(numericMatch[1]);
        } else {
          setCarbs(numericMatch[1]);
        }
        toast({
          title: `${field.charAt(0).toUpperCase() + field.slice(1)} estimated`,
          description: "AI estimate applied successfully"
        });
      } else {
        toast({
          title: "Could not parse AI response", 
          description: "Please enter manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "AI estimation failed",
        description: `${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSmartDefaultUnit = (foodName: string): string => {
    const nameLower = foodName.toLowerCase();
    if (nameLower.includes('milk') || nameLower.includes('water') || nameLower.includes('juice') || 
        nameLower.includes('drink') || nameLower.includes('soda') || nameLower.includes('coffee')) {
      return 'milliliters';
    }
    return 'grams';
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (newName && !servingUnit) {
      const smartUnit = getSmartDefaultUnit(newName);
      const availableUnits = getServingUnitsForUser();
      if (availableUnits.some(unit => unit.value === smartUnit)) {
        setServingUnit(smartUnit);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Food name required",
        variant: "destructive"
      });
      return;
    }
    
    if (!calories || !carbs || !servingAmount) {
      toast({
        title: "Required fields missing",
        description: "Please fill in amount, calories, and carbs",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const finalData = {
        name: name.trim(),
        serving_size: parseFloat(servingAmount) * quantity,
        calories: parseFloat(calories) * quantity,
        carbs: parseFloat(carbs) * quantity,
        consumed: false,
        image_url: imageUrl
      };
      
      await onSave(finalData);
      trackFoodEvent('add', imageUrl ? 'image' : 'manual');
      
      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      toast({ 
        title: 'Failed to save food', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setImageUrl(null);
    setAnalysisResult(null);
    setError(null);
    setName('');
    setServingAmount('');
    setServingUnit(getDefaultServingSizeUnit());
    setCalories('');
    setCarbs('');
    setQuantity(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRetakePhoto = () => {
    setImageUrl(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Food"
      variant="standard"
      size="md"
      showCloseButton={true}
    >
      {/* Image section - camera upload or display */}
      {!imageUrl ? (
        <div className="space-y-4 mb-4">
          <div className="text-center py-2">
            <div className="w-10 h-10 mx-auto mb-2 bg-muted rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isSubscriptionActive ? "Add photo for AI analysis (optional)" : "Add photo (optional)"}
            </p>
          </div>
          <PremiumGatedImageUpload onImageUpload={handleImageUpload} currentImageUrl={imageUrl} />
        </div>
      ) : (
        <div className="w-full h-48 mb-4 relative">
          <img
            src={imageUrl}
            alt={name || "Food"}
            className="w-full h-full object-cover rounded-lg"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetakePhoto}
            className="absolute top-2 right-2"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Analysis Status */}
      {analyzing && (
        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg mb-4">
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          <span className="text-sm">Analyzing nutritional information...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI Analysis</span>
            {analysisResult.confidence && (
              <Badge variant="default" className="text-xs bg-primary/20 text-primary-foreground">
                {Math.round(analysisResult.confidence * 100)}% confidence
              </Badge>
            )}
          </div>
          {analysisResult.description && (
            <p className="text-xs text-muted-foreground">{analysisResult.description}</p>
          )}
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
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Grilled Chicken Breast"
            className="h-9"
            required
          />
        </div>

        {/* Amount/Unit fields connected + Calories + Carbs */}
        <div className="space-y-4">
          {/* Connected Amount and Unit fields */}
          <div>
            <Label className="text-xs font-medium mb-1 block">
              Amount <span className="text-red-500">*</span>
            </Label>
            <div className="flex">
              <Input
                id="serving-amount"
                type="number"
                value={servingAmount}
                onChange={(e) => setServingAmount(e.target.value)}
                placeholder="100"
                className="text-sm h-9 rounded-r-none border-r-0 focus-within:z-10"
                min="0.1"
                step="0.1"
                required
              />
              <Select value={servingUnit} onValueChange={setServingUnit}>
                <SelectTrigger className="text-sm h-9 rounded-l-none w-24 border-l-0 focus-within:z-10">
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
          </div>

          {/* Calories and Carbs row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="calories" className="text-xs font-medium">
                  Calories <span className="text-red-500">*</span>
                </Label>
                <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                  <button
                    type="button"
                    aria-label="AI estimate calories for serving"
                    onClick={() => handleAiEstimate('calories')}
                    disabled={isAiFillingCalories || !name.trim() || !servingAmount.trim()}
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
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className={`text-sm h-9 ${
                  parseFloat(calories) === 0 && calories !== '' ? 'border-destructive text-destructive' : ''
                }`}
                required
              />
              {parseFloat(calories) === 0 && calories !== '' && (
                <p className="text-xs text-destructive mt-1">Unlikely to be zero calories</p>
              )}
            </div>

            {/* Carbs */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="carbs" className="text-xs font-medium">
                  Carbs <span className="text-red-500">*</span>
                </Label>
                <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                  <button
                    type="button"
                    aria-label="AI estimate carbs for serving"
                    onClick={() => handleAiEstimate('carbs')}
                    disabled={isAiFillingCarbs || !name.trim() || !servingAmount.trim()}
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
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className="text-sm h-9"
                required
              />
            </div>
          </div>
        </div>

        {/* Re-analyze button for photos */}
        {imageUrl && isSubscriptionActive && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => analyzeImage(imageUrl)}
              disabled={analyzing}
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Re-analyze Photo
            </Button>
          </div>
        )}
      </div>

      {/* Footer - Quantity selector and Add button */}
      <div className="flex gap-3 pt-4">
        {/* Quantity selector */}
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
        
        {/* Add Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving || !name || !calories || !carbs || !servingAmount}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Add to Food Plan"
          )}
        </Button>
      </div>
    </UniversalModal>
  );
};
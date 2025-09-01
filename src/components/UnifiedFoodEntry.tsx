import React, { useState, useEffect } from 'react';
import { Camera, Loader2, Sparkles, X, RefreshCcw, Plus, Minus, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ImageUpload';
import { Badge } from '@/components/ui/badge';
import { PremiumGate } from '@/components/PremiumGate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { getServingUnitsForUser, getDefaultServingSizeUnit, getUnitDisplayName } from '@/utils/foodConversions';
import { trackFoodEvent } from '@/utils/analytics';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { EnhancedVoiceFoodInput } from '@/components/EnhancedVoiceFoodInput';
import { parseVoiceFoodInput } from '@/utils/voiceParsing';
import { ProgressiveImageUpload } from '@/components/enhanced/ProgressiveImageUpload';
import { FoodAnalysisResults } from '@/components/FoodAnalysisResults';

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
  onSave: (data: any | any[]) => void;
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
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'error'>('idle');
  
  // Form state
  const [name, setName] = useState('');
  const [servingAmount, setServingAmount] = useState('100');
  const [servingUnit, setServingUnit] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('0');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [caloriesContext, setCaloriesContext] = useState<'per100g' | 'total'>('per100g');
  
  // AI estimation loading states
  const [isAiEstimating, setIsAiEstimating] = useState(false);

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
    setShowAnalysisResults(false);
    setUploadState('uploaded');
  };

  const handleAnalysisStart = () => {
    setAnalyzing(true);
    setUploadState('analyzing');
    setError(null);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setAnalyzing(false);
    setUploadState('analyzed');
    setShowAnalysisResults(true);
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setAnalyzing(false);
    setUploadState('error');
  };

  const handleAnalysisConfirm = (result: AnalysisResult) => {
    // Populate form fields with confirmed analysis results
    if (result.name) setName(result.name);
    if (result.estimated_serving_size) {
      setServingAmount(result.estimated_serving_size.toString());
    }
    
    // Calculate and set nutritional values for the detected serving
    if (result.estimated_serving_size) {
      const caloriesPer100g = result.calories_per_100g || 0;
      const totalCalories = Math.round((caloriesPer100g * result.estimated_serving_size) / 100);
      setCalories(totalCalories.toString());
      
      const carbsPer100g = result.carbs_per_100g || 0;
      const totalCarbs = Math.round((carbsPer100g * result.estimated_serving_size) / 100);
      setCarbs(totalCarbs.toString());
    }
    
    setShowAnalysisResults(false);
    console.log('✅ Analysis confirmed, data populated:', result);
    
    toast({ 
      title: '✨ Analysis confirmed', 
      description: 'Data populated! Review and add to your food list.',
      className: "bg-gradient-to-r from-green-500 to-blue-500 text-white border-0",
    });
  };

  const handleAnalysisReject = () => {
    setShowAnalysisResults(false);
    toast({ 
      title: 'Edit mode', 
      description: 'Fill in the details manually or try another photo.',
    });
  };

  const handleAiEstimate = async () => {
    if (!name || !servingAmount || !servingUnit) {
      toast({
        title: "Missing information",
        description: "Please enter food name, amount, and unit first",
        variant: "destructive"
      });
      return;
    }

    setIsAiEstimating(true);
    try {
      // Get both calories and carbs in one request
      const { data: result, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: 'You are a nutrition expert. Respond with JSON format: {"calories": number, "carbs": number}. Always provide precise nutritional values for the EXACT amount requested.' },
            { role: 'user', content: `For exactly ${servingAmount} ${servingUnit} of ${name}, provide the total calories and carbs in grams for that specific amount. Return only valid JSON.` }
          ]
        }
      });
      
      if (error) throw new Error(error.message || 'Unknown error from AI service');
      if (!result) throw new Error('No response from AI service');
      
      const response = result.completion || result.response || '';
      
      // Try to parse JSON first, fallback to regex
      try {
        const parsed = JSON.parse(response);
        if (typeof parsed.calories === 'number' && typeof parsed.carbs === 'number') {
          setCalories(parsed.calories.toString());
          setCarbs(parsed.carbs.toString());
          toast({
            title: "Nutrition estimated",
            description: `AI estimated ${parsed.calories} calories and ${parsed.carbs}g carbs for ${servingAmount} ${servingUnit}`
          });
          return;
        }
      } catch {
        // Fallback to regex extraction
        const caloriesMatch = response.match(/calories["\s:]+(\d+(?:\.\d+)?)/i);
        const carbsMatch = response.match(/carbs["\s:]+(\d+(?:\.\d+)?)/i);
        
        if (caloriesMatch && carbsMatch) {
          setCalories(caloriesMatch[1]);
          setCarbs(carbsMatch[1]);
          toast({
            title: "Nutrition estimated",
            description: "AI estimates applied successfully"
          });
          return;
        }
      }
      
      toast({
        title: "Could not parse AI response", 
        description: "Please enter manually.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "AI estimation failed",
        description: `${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsAiEstimating(false);
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
    
    if (!calories || !servingAmount) {
      toast({
        title: "Required fields missing",
        description: "Please fill in amount and calories",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Create separate entries for each quantity
      const entries = [];
      for (let i = 0; i < quantity; i++) {
        entries.push({
          name: name.trim(),
          serving_size: parseFloat(servingAmount),
          calories: parseFloat(calories),
          carbs: carbs ? parseFloat(carbs) : 0,
          consumed: false,
          image_url: imageUrl
        });
      }
      
      console.log(`💾 Saving ${quantity} food ${quantity === 1 ? 'entry' : 'entries'}:`, entries);
      await onSave(entries);
      trackFoodEvent('add', imageUrl ? 'image' : 'manual');
      
      console.log('✅ Food entries saved successfully');
      // Reset form but keep modal open for potential additional entries
      resetForm();
      
      // Show success message
      toast({
        title: "Food Added Successfully",
        description: `${quantity} food ${quantity === 1 ? 'entry' : 'entries'} saved`,
      });
      
      // Modal will close when user explicitly closes it via handleClose
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
    setShowAnalysisResults(false);
    setUploadState('idle');
    setName('');
    setServingAmount('100');
    setServingUnit(getDefaultServingSizeUnit());
    setCalories('');
    setCarbs('0');
    setQuantity(1);
  };

  const handleClose = () => {
    // Prevent closing during analysis process
    if (analyzing || ['uploading', 'analyzing'].includes(uploadState)) {
      toast({
        title: "Analysis in progress",
        description: "Please wait for the food analysis to complete",
        variant: "default"
      });
      return;
    }
    
    resetForm();
    onClose();
  };

  const handleRetakePhoto = () => {
    setImageUrl(null);
    setAnalysisResult(null);
    setError(null);
    setShowAnalysisResults(false);
    setUploadState('idle');
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Food"
      variant="standard"
      size={showAnalysisResults ? "lg" : "md"}
      showCloseButton={true}
    >
      <div className="relative">
        {/* Main Form Content */}
        <div className={`${showAnalysisResults ? 'opacity-30 pointer-events-none' : ''} transition-opacity duration-200`}>
        {/* Image section - camera upload or display */}
          {!imageUrl ? (
            <div className="mb-4">
              <PremiumGate feature="Image Upload" grayOutForFree={true}>
                <ProgressiveImageUpload
                  onImageUpload={handleImageUpload}
                  onAnalysisStart={handleAnalysisStart}
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  uploadState={uploadState}
                />
              </PremiumGate>
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

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Food Name */}
            <div>
              <Label htmlFor="food-name" className="text-sm font-medium mb-1 block">
                Food Name <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="food-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="h-9 flex-1"
                  required
                />
                <EnhancedVoiceFoodInput
                  onFoodParsed={(result) => {
                    // Populate fields from enhanced voice parsing
                    if (result.foodName && !name) {
                      setName(result.foodName);
                    }
                    if (result.amount && !servingAmount) {
                      setServingAmount(result.amount.toString());
                    }
                    if (result.unit && !servingUnit) {
                      // Make sure the unit is available
                      const availableUnits = getServingUnitsForUser();
                      if (availableUnits.some(unit => unit.value === result.unit)) {
                        setServingUnit(result.unit!);
                      }
                    }
                    // Auto-populate nutrition if provided
                    if (result.nutrition && !calories && !carbs) {
                      setCalories(result.nutrition.calories.toString());
                      setCarbs(result.nutrition.carbs.toString());
                      
                      toast({
                        title: "✨ Smart Voice Complete",
                        description: `Populated ${result.foodName}${result.amount ? ` (${result.amount}${result.unit})` : ''} with nutrition estimates`,
                        className: "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0",
                        duration: 3000,
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Amount/Unit fields connected + Calories + Carbs */}
            <div className="space-y-4">
              {/* Amount field */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Label className="text-xs font-medium">
                    Amount (g) <span className="text-red-500">*</span>
                  </Label>
                  <ClickableTooltip content="We use grams for precision. While not universal, grams appear on food packaging globally, making accurate tracking possible regardless of your location.">
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </ClickableTooltip>
                </div>
                <Input
                  id="serving-amount"
                  type="number"
                  value={servingAmount}
                  onChange={(e) => setServingAmount(e.target.value)}
                  className="text-sm h-9 w-24"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              {/* Per 100g toggle - above the nutrition row */}
              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={() => setCaloriesContext(caloriesContext === 'per100g' ? 'total' : 'per100g')}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  {caloriesContext === 'per100g' ? (
                    <>
                      <ToggleLeft className="w-3 h-3" />
                      Per 100g
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-3 h-3" />
                      Total
                    </>
                  )}
                </button>
              </div>

              {/* AI Button + Calories + Carbs row */}
              <div className="flex gap-2 items-end">
                {/* AI Estimation Button - Only show when food name is provided */}
                {name.trim() && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PremiumGate feature="AI Estimation" grayOutForFree={true}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAiEstimate}
                            disabled={isAiEstimating || !name.trim() || !servingAmount.trim()}
                            className="h-9 w-9 p-0 bg-ai hover:bg-ai/90 text-ai-foreground border-ai flex-shrink-0"
                          >
                            {isAiEstimating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </Button>
                        </PremiumGate>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI will estimate both calories and carbs for you</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Calories */}
                <div className="flex-1">
                  <Label htmlFor="calories" className="text-xs font-medium mb-1 block">
                    Calories <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
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
                  </div>
                  {parseFloat(calories) === 0 && calories !== '' && (
                    <p className="text-xs text-destructive mt-1">Unlikely to be zero calories</p>
                  )}
                </div>

                {/* Carbs */}
                <div className="flex-1">
                  <Label htmlFor="carbs" className="text-xs font-medium mb-1 block">
                    Carbs (g)
                  </Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>
            </div>
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
               disabled={saving || !name || !calories || !servingAmount}
               className="flex-1"
             >
               {saving ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Adding...
                 </>
               ) : (
                 quantity > 1 ? `Add ${quantity} Items` : "Add to Food Plan"
               )}
             </Button>
          </div>
        </div>

        {/* Analysis Results Overlay */}
        {showAnalysisResults && analysisResult && imageUrl && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 rounded-lg">
            <div className="w-full max-w-md">
              <FoodAnalysisResults
                result={analysisResult}
                imageUrl={imageUrl}
                onConfirm={handleAnalysisConfirm}
                onReject={handleAnalysisReject}
              />
            </div>
          </div>
        )}
      </div>
    </UniversalModal>
  );
};
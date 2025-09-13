import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodSelectionModal } from '@/components/FoodSelectionModal';
import { ProcessingDots } from '@/components/ProcessingDots';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { useToast } from '@/hooks/use-toast';

interface DirectPhotoCaptureButtonProps {
  onFoodAdded?: (food: any) => void;
  className?: string;
}

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

interface FoodItem {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
  protein?: number;
  fat?: number;
}

interface FoodSuggestion {
  foods: FoodItem[];
  destination: 'today' | 'library';
  isProcessed: boolean;
}

export const DirectPhotoCaptureButton = ({ onFoodAdded, className = "" }: DirectPhotoCaptureButtonProps) => {
  const [captureState, setCaptureState] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { access_level, hasAIAccess } = useAccess();
  const sessionGuard = useSessionGuard();
  const { toast } = useToast();

  // Check if user has access to AI analysis features
  const canUseAIAnalysis = access_level === 'admin' || hasAIAccess;

  const handleCameraClick = () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to capture photos",
        variant: "destructive",
      });
      return;
    }
    
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error", 
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!sessionGuard.withSessionGuard) return;

    await sessionGuard.withSessionGuard(async () => {
      try {
        setCaptureState('uploading');
        
        // Upload image to Supabase storage
        const fileName = `${Date.now()}_${Math.random().toString().replace('.', '')}.jpg`;
        const filePath = `${user!.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('motivator-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('motivator-images')
          .getPublicUrl(filePath);

        const imageUrl = urlData.publicUrl;

        // Only attempt analysis if user has AI access
        if (canUseAIAnalysis) {
          setCaptureState('analyzing');

          try {
            const { data, error } = await supabase.functions.invoke('analyze-food-image', {
              body: { imageUrl: imageUrl },
            });
            
            if (error) throw error;
            
            const result = data as AnalysisResult;
            
            // Convert analysis result to FoodSuggestion format
            if (result) {
              const servingSize = result.estimated_serving_size || 100;
              const totalCalories = Math.round((result.calories_per_100g || 0) * servingSize / 100);
              const totalCarbs = Math.round((result.carbs_per_100g || 0) * servingSize / 100 * 10) / 10;
              const totalProtein = Math.round((result.protein_per_100g || 0) * servingSize / 100 * 10) / 10;
              const totalFat = Math.round((result.fat_per_100g || 0) * servingSize / 100 * 10) / 10;

              const foodItem: FoodItem = {
                name: result.name || 'Unknown Food',
                serving_size: servingSize,
                calories: totalCalories,
                carbs: totalCarbs,
                protein: totalProtein,
                fat: totalFat
              };

              const suggestion: FoodSuggestion = {
                foods: [foodItem],
                destination: 'today',
                isProcessed: true
              };

              setFoodSuggestion(suggestion);
              setSelectedFoodIds(new Set([0])); // Select the first (and only) food by default
              setShowSelectionModal(true);
              setCaptureState('idle');
            } else {
              // Show error and allow retry
              toast({
                title: "Analysis Failed",
                description: "Could not analyze the image. Please try again or add food manually.",
                variant: "destructive"
              });
              setCaptureState('idle');
            }

          } catch (analysisError) {
            console.error('Analysis error:', analysisError);
            setCaptureState('idle');
            
            toast({
              title: "Analysis failed",
              description: "Could not analyze the image. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // Show error for non-premium users
          setCaptureState('idle');
          toast({
            title: "Premium Feature",
            description: "AI photo analysis requires a premium subscription.",
            variant: "destructive",
          });
        }

      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        setCaptureState('idle');
        
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }, 'Photo Capture');
  };

  // Handle selection changes in modal
  const handleSelectionChange = (selectedIds: Set<number>) => {
    setSelectedFoodIds(selectedIds);
  };

  // Handle food updates in modal
  const handleFoodUpdate = (index: number, updates: Partial<FoodItem>) => {
    if (foodSuggestion) {
      const updatedFoods = [...foodSuggestion.foods];
      updatedFoods[index] = { ...updatedFoods[index], ...updates };
      setFoodSuggestion({
        ...foodSuggestion,
        foods: updatedFoods
      });
    }
  };

  // Handle food removal in modal
  const handleFoodRemove = (index: number) => {
    if (foodSuggestion) {
      const updatedFoods = foodSuggestion.foods.filter((_, i) => i !== index);
      setFoodSuggestion({
        ...foodSuggestion,
        foods: updatedFoods
      });
      
      // Update selected IDs after removal
      const newSelectedIds = new Set<number>();
      selectedFoodIds.forEach(id => {
        if (id < index) newSelectedIds.add(id);
        else if (id > index) newSelectedIds.add(id - 1);
      });
      setSelectedFoodIds(newSelectedIds);
    }
  };

  // Handle adding selected foods
  const handleAddFoods = async () => {
    if (foodSuggestion) {
      const selectedFoods = foodSuggestion.foods.filter((_, index) => selectedFoodIds.has(index));
      
      selectedFoods.forEach(food => {
        const foodEntry = {
          ...food,
          source: 'photo_analysis'
        };
        onFoodAdded?.(foodEntry);
      });

      setShowSelectionModal(false);
      setFoodSuggestion(null);
      setSelectedFoodIds(new Set());
      setCaptureState('idle');

      toast({
        title: "✓ Food Added",
        description: `${selectedFoods.length} food${selectedFoods.length > 1 ? 's' : ''} added to your log`,
      });
    }
  };

  // Get button content based on state
  const getButtonContent = () => {
    switch (captureState) {
      case 'uploading':
      case 'analyzing':
        return <ProcessingDots className="text-white" />;
      default:
        return <Camera className="w-11 h-11" />;
    }
  };

  return (
    <>
      <Button 
        variant="action-secondary"
        size="action-tall"
        className={`w-full flex items-center justify-center transition-colors ${
          captureState !== 'idle' 
            ? 'bg-ai hover:bg-ai/90 text-white'
            : canUseAIAnalysis 
              ? 'bg-ai hover:bg-ai/90 text-ai-foreground'
              : 'bg-ai/50 text-ai-foreground opacity-50'
        }`}
        onClick={handleCameraClick}
        disabled={captureState !== 'idle'}
        aria-label="AI photo analysis to add food"
      >
        {getButtonContent()}
      </Button>

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Food Selection Modal */}
      {foodSuggestion && (
        <FoodSelectionModal
          isOpen={showSelectionModal}
          onClose={() => {
            setShowSelectionModal(false);
            setFoodSuggestion(null);
            setSelectedFoodIds(new Set());
            setCaptureState('idle');
          }}
          foodSuggestion={foodSuggestion}
          selectedFoodIds={selectedFoodIds}
          onSelectionChange={handleSelectionChange}
          onFoodUpdate={handleFoodUpdate}
          onFoodRemove={handleFoodRemove}
          onDestinationChange={(destination: 'today' | 'library') => {
            if (foodSuggestion) {
              setFoodSuggestion({ ...foodSuggestion, destination });
            }
          }}
          onAddFoods={handleAddFoods}
          isProcessing={captureState !== 'idle'}
        />
      )}
    </>
  );
};
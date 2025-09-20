import React, { useRef, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessingDots } from '@/components/ProcessingDots';
import { FoodSelectionModal } from '@/components/FoodSelectionModal';
import { MultiImageCaptureFlow } from '@/components/MultiImageCaptureFlow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { useToast } from '@/hooks/use-toast';
import { useUploadLoading } from '@/hooks/useStandardizedLoading';
import { useMultiImageSettings } from '@/hooks/useMultiImageSettings';
import { saveImageLocally } from '@/utils/localImageStorage';
import { compressImage, getBase64FromFile } from '@/utils/imageCompression';

interface DirectPhotoCaptureButtonProps {
  onFoodAdded?: (food: any) => void;
  className?: string;
}

interface FoodItem {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
  calories_per_100g: number;
  carbs_per_100g: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  confidence?: number;
  description?: string;
  image_url?: string;
}

interface FoodSuggestion {
  foods: FoodItem[];
  destination: 'today' | 'template';
  originalTranscription: string;
  image_url?: string;
}

export const DirectPhotoCaptureButton = ({ onFoodAdded, className = "" }: DirectPhotoCaptureButtonProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showMultiImageFlow, setShowMultiImageFlow] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const { user } = useAuth();
  const { access_level, hasAIAccess } = useAccess();
  const sessionGuard = useSessionGuard();
  const { toast } = useToast();
  const { data: multiImageEnabled = false, isLoading: isLoadingMultiImage } = useMultiImageSettings();
  const { isUploading, uploadState, startUpload, startAnalysis, completeUpload, completeAnalysis, setUploadError, reset } = useUploadLoading();

  // Debug logging for multi-image setting
  console.log('🔧 Multi-image setting debug:', { multiImageEnabled, isLoadingMultiImage });

  const handleCameraClick = () => {
    sessionGuard.withSessionGuard(async () => {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use photo analysis",
          variant: "destructive",
        });
        return;
      }
      
      // Use multi-image flow if enabled, otherwise use single image
      if (multiImageEnabled) {
        setShowMultiImageFlow(true);
      } else {
        cameraInputRef.current?.click();
      }
    }, 'Photo Capture');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Clear the input to allow the same file to be selected again
    event.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    await handleFileUpload(file);
  };

  const canUseAIAnalysis = hasAIAccess;

  const handleFileUpload = async (file: File) => {
    await sessionGuard.withSessionGuard(async () => {
      try {
        startUpload();
        
        // Compress image first (absolute priority for speed)
        console.log('Compressing image...');
        const compressedFile = await compressImage(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.7
        });
        
        // Save compressed image locally
        const localImageId = await saveImageLocally(compressedFile);
        console.log('Compressed image saved locally with ID:', localImageId);
        
        // Create object URL for preview
        const previewUrl = URL.createObjectURL(compressedFile);
        setImageUrl(previewUrl);

        // Only attempt analysis if user has AI access
        if (canUseAIAnalysis) {
          startAnalysis();

          try {
            // Get base64 from compressed image for faster AI analysis
            const base64Data = await getBase64FromFile(compressedFile);

            const { data, error } = await supabase.functions.invoke('analyze-food-image', {
              body: { imageData: base64Data },
            });
            
            if (error) throw error;
            
            console.log('Photo analysis response:', data);
            
            // Handle both function call and completion responses
            if (data?.functionCall?.name === 'add_multiple_foods') {
              // Function call response - food items identified
              const foodsWithImage = (data.functionCall.arguments.foods || []).map((food: FoodItem) => ({
                ...food,
                image_url: previewUrl
              }));
              
              const suggestion: FoodSuggestion = {
                foods: foodsWithImage,
                destination: data.functionCall.arguments.destination || 'today',
                originalTranscription: data.originalTranscription || '',
                image_url: previewUrl
              };
              
              // Initialize selection with all items selected
              const allSelected = new Set(suggestion.foods.map((_, index) => index));
              setSelectedFoodIds(allSelected);
              
              setFoodSuggestion(suggestion);
              setShowFoodModal(true);
              completeAnalysis();
            } else if (data?.completion && !data?.errorType) {
              // Completion response - try to parse for food information
              try {
                // Try to extract food information from completion text
                const parsedFoods = tryParseCompletionForFoods(data.completion);
                if (parsedFoods && parsedFoods.length > 0) {
                  const foodsWithImage = parsedFoods.map((food: FoodItem) => ({
                    ...food,
                    image_url: previewUrl
                  }));
                  
                  const suggestion: FoodSuggestion = {
                    foods: foodsWithImage,
                    destination: 'today',
                    originalTranscription: data.originalTranscription || 'Photo analysis',
                    image_url: previewUrl
                  };
                  
                  const allSelected = new Set(suggestion.foods.map((_, index) => index));
                  setSelectedFoodIds(allSelected);
                  
                  setFoodSuggestion(suggestion);
                  setShowFoodModal(true);
                  completeAnalysis();
                } else {
                  // No foods found in completion
                  handleAnalysisError(data.completion);
                }
              } catch (error) {
                console.error('Error parsing completion for foods:', error);
                handleAnalysisError(data.completion);
              }
            } else {
              // Error response or no foods found
              handleAnalysisError(
                data?.completion || 
                'Could not identify any food items in this image. Please try a clearer photo or add food manually.'
              );
            }

          } catch (analysisError) {
            console.error('Analysis error:', analysisError);
            handleAnalysisError('Could not analyze the image. Please try again.');
          }
        } else {
          // Show error for non-premium users trying to use AI analysis
          handleAnalysisError('AI photo analysis requires a premium subscription.');
        }

      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        reset();
        
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    });
  };

  // Handler for multi-image flow
  const handleMultiImagesReady = async (images: string[]) => {
    await sessionGuard.withSessionGuard(async () => {
      try {
        startAnalysis();

        const { data, error } = await supabase.functions.invoke('analyze-food-image', {
          body: { images }, // Send array of base64 images
        });
        
        if (error) throw error;
        
        console.log('Multi-image analysis response:', data);
        
        // Create blob URL from first image for preview
        let imagePreviewUrl = '';
        if (images.length > 0) {
          try {
            // Convert base64 to blob URL
            const base64Data = images[0];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            imagePreviewUrl = URL.createObjectURL(blob);
          } catch (error) {
            console.error('Error creating preview URL from base64:', error);
          }
        }
        
        // Handle both function call and completion responses
        if (data?.functionCall?.name === 'add_multiple_foods') {
          // Function call response - food items identified
          const foodsWithImage = (data.functionCall.arguments.foods || []).map((food: FoodItem) => ({
            ...food,
            image_url: imagePreviewUrl
          }));
          
          const suggestion: FoodSuggestion = {
            foods: foodsWithImage,
            destination: data.functionCall.arguments.destination || 'today',
            originalTranscription: data.originalTranscription || '',
            image_url: imagePreviewUrl
          };
          
          // Initialize selection with all items selected
          const allSelected = new Set(suggestion.foods.map((_, index) => index));
          setSelectedFoodIds(allSelected);
          
          setFoodSuggestion(suggestion);
          setShowMultiImageFlow(false);
          setShowFoodModal(true);
          completeAnalysis();
        } else if (data?.completion && !data?.errorType) {
          // Completion response - try to parse for food information
          try {
            const parsedFoods = tryParseCompletionForFoods(data.completion);
            if (parsedFoods && parsedFoods.length > 0) {
              const foodsWithImage = parsedFoods.map((food: FoodItem) => ({
                ...food,
                image_url: imagePreviewUrl
              }));
              
              const suggestion: FoodSuggestion = {
                foods: foodsWithImage,
                destination: 'today',
                originalTranscription: data.originalTranscription || 'Photo analysis',
                image_url: imagePreviewUrl
              };
              
              const allSelected = new Set(suggestion.foods.map((_, index) => index));
              setSelectedFoodIds(allSelected);
              
              setFoodSuggestion(suggestion);
              setShowMultiImageFlow(false);
              setShowFoodModal(true);
              completeAnalysis();
            } else {
              handleAnalysisError(data.completion);
            }
          } catch (error) {
            console.error('Error parsing multi-image completion for foods:', error);
            handleAnalysisError(data.completion);
          }
        } else {
          // Error response or no foods found
          handleAnalysisError(
            data?.completion || 
            'Could not identify any food items in these images. Please try clearer photos or add food manually.'
          );
        }

      } catch (analysisError) {
        console.error('Multi-image analysis error:', analysisError);
        handleAnalysisError('Could not analyze the images. Please try again.');
      }
    });
  };

  const handleMultiImageCancel = () => {
    setShowMultiImageFlow(false);
    reset();
  };

  const handleAnalysisError = (message: string) => {
    setShowMultiImageFlow(false);
    reset();
    // Don't cleanup immediately on error - let the user see the image in the error state
    toast({
      title: "Analysis failed",
      description: message,
      variant: "destructive",
    });
  };

  // Modal handlers (unified with voice workflow)
  const handleFoodModalClose = () => {
    setShowFoodModal(false);
    setFoodSuggestion(null);
    setSelectedFoodIds(new Set());
    // Clean up image URL when modal closes without saving
    setTimeout(() => cleanup(), 100);
  };

  const handleSelectionChange = (selectedIds: Set<number>) => {
    setSelectedFoodIds(selectedIds);
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
    
    // Update selected indices after removal
    const newSelected = new Set<number>();
    selectedFoodIds.forEach(id => {
      if (id < index) {
        newSelected.add(id);
      } else if (id > index) {
        newSelected.add(id - 1);
      }
    });
    
    setSelectedFoodIds(newSelected);
    setFoodSuggestion({
      ...foodSuggestion,
      foods: updatedFoods
    });
  };

  const handleDestinationChange = (destination: 'today' | 'template') => {
    if (!foodSuggestion) return;
    setFoodSuggestion({
      ...foodSuggestion,
      destination
    });
  };

  const handleAddFoods = async () => {
    if (!foodSuggestion) return;
    
    const selectedFoods = Array.from(selectedFoodIds).map(index => {
      const food = foodSuggestion.foods[index];
      return {
        ...food,
        source: 'photo_analysis',
        image_url: imageUrl || '' // Attach the captured image to all selected foods
      };
    });
    
    // Pass the entire array to match the voice input pattern
    onFoodAdded?.(selectedFoods);
    
    toast({
      title: "✓ Food Added",
      description: `${selectedFoods.length} food item${selectedFoods.length > 1 ? 's' : ''} added to your log`,
    });
    
    handleFoodModalClose();
    
    // Clean up image URL after successful save
    setTimeout(() => cleanup(), 100);
  };

  // Helper function to try parsing completion text for food information
  const tryParseCompletionForFoods = (completion: string): FoodItem[] | null => {
    // This is a basic parser - could be enhanced
    // Look for patterns like "Apple - 95 calories, 25g carbs per 100g"
    // For now, return null to use the completion as error message
    // In the future, could implement regex parsing for basic food info
    return null;
  };

  const cleanup = () => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl('');
  };

  // Get button content based on state
  const getButtonContent = () => {
    if (isUploading || uploadState === 'analyzing') {
      return <ProcessingDots className="text-white" />;
    }
    return (
      <div className="flex items-center space-x-1">
        <Plus className="w-6 h-6" />
        <Camera className="w-12 h-12" />
      </div>
    );
  };

  return (
    <>
      <Button
        onClick={handleCameraClick}
        disabled={isUploading || showMultiImageFlow}
        variant="action-secondary"
        size="start-button"
        className={`w-full flex items-center justify-center transition-colors ${className}`}
      >
        {getButtonContent()}
      </Button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Multi-Image Capture Flow */}
      {showMultiImageFlow && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="container max-w-md mx-auto p-4 min-h-screen flex flex-col justify-center">
            <MultiImageCaptureFlow
              onImagesReady={handleMultiImagesReady}
              onCancel={handleMultiImageCancel}
              isProcessing={isUploading}
            />
          </div>
        </div>
      )}

      {/* Food Selection Modal (unified with voice) */}
      {showFoodModal && foodSuggestion && (
        <FoodSelectionModal
          isOpen={showFoodModal}
          onClose={handleFoodModalClose}
          foodSuggestion={foodSuggestion}
          selectedFoodIds={selectedFoodIds}
          onSelectionChange={handleSelectionChange}
          onFoodUpdate={handleFoodUpdate}
          onFoodRemove={handleFoodRemove}
          onDestinationChange={handleDestinationChange}
          onAddFoods={handleAddFoods}
          isProcessing={isUploading}
        />
      )}
    </>
  );
};
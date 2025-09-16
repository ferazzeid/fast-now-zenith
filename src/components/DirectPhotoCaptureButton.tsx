import React, { useRef, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessingDots } from '@/components/ProcessingDots';
import { FoodAnalysisResults } from '@/components/FoodAnalysisResults';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { useToast } from '@/hooks/use-toast';
import { useUploadLoading } from '@/hooks/useStandardizedLoading';
import { saveImageLocally } from '@/utils/localImageStorage';
import { compressImage, getBase64FromFile } from '@/utils/imageCompression';
import { getPhotoWorkflowUseConfirmation } from '@/utils/adminSettings';

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
  // Extended properties for confirmation workflow
  totalCalories?: number;
  totalCarbs?: number;
  totalProtein?: number;
  totalFat?: number;
  servingSize?: number;
  image_url?: string;
}

export const DirectPhotoCaptureButton = ({ onFoodAdded, className = "" }: DirectPhotoCaptureButtonProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const { user } = useAuth();
  const { access_level, hasAIAccess } = useAccess();
  const sessionGuard = useSessionGuard();
  const { toast } = useToast();
  const { isUploading, uploadState, startUpload, startAnalysis, completeUpload, completeAnalysis, setUploadError, reset } = useUploadLoading();

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

    // Validate file size (max 5MB before compression)
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
            
            const result = data as AnalysisResult;
            
            if (result) {
              const servingSize = result.estimated_serving_size || 100;
              const totalCalories = Math.round((result.calories_per_100g || 0) * servingSize / 100);
              const totalCarbs = Math.round((result.carbs_per_100g || 0) * servingSize / 100 * 10) / 10;
              const totalProtein = Math.round((result.protein_per_100g || 0) * servingSize / 100 * 10) / 10;
              const totalFat = Math.round((result.fat_per_100g || 0) * servingSize / 100 * 10) / 10;

              const analysisWithTotals = {
                ...result,
                totalCalories,
                totalCarbs,
                totalProtein,
                totalFat,
                servingSize,
                image_url: localImageId
              };

              // Check admin setting for workflow choice
              const useConfirmation = getPhotoWorkflowUseConfirmation();
              
              if (useConfirmation) {
                // Show confirmation dialog
                setAnalysisResult(analysisWithTotals);
                setShowConfirmation(true);
                completeAnalysis();
              } else {
                // Add immediately (original behavior)
                const foodEntry = {
                  name: result.name || 'Unknown Food',
                  serving_size: servingSize,
                  calories: totalCalories,
                  carbs: totalCarbs,
                  protein: totalProtein,
                  fat: totalFat,
                  source: 'photo_analysis',
                  image_url: localImageId
                };
                
                onFoodAdded?.(foodEntry);
                
                toast({
                  title: "✓ Food Added",
                  description: `${result.name || 'Food'} added to your log`,
                });
                
                completeAnalysis();
                cleanup();
              }
            } else {
              handleAnalysisError('Could not analyze the image. Please try again or add food manually.');
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
    }, 'Photo Capture');
  };

  const handleAnalysisError = (message: string) => {
    reset();
    cleanup();
    toast({
      title: "Analysis failed",
      description: message,
      variant: "destructive",
    });
  };

  const handleConfirmFood = (result: AnalysisResult) => {
    const foodEntry = {
      name: result.name || 'Unknown Food',
      serving_size: result.servingSize || result.estimated_serving_size || 100,
      calories: result.totalCalories || Math.round((result.calories_per_100g || 0) * (result.servingSize || result.estimated_serving_size || 100) / 100),
      carbs: result.totalCarbs || Math.round((result.carbs_per_100g || 0) * (result.servingSize || result.estimated_serving_size || 100) / 100 * 10) / 10,
      protein: result.totalProtein || Math.round((result.protein_per_100g || 0) * (result.servingSize || result.estimated_serving_size || 100) / 100 * 10) / 10,
      fat: result.totalFat || Math.round((result.fat_per_100g || 0) * (result.servingSize || result.estimated_serving_size || 100) / 100 * 10) / 10,
      source: 'photo_analysis',
      image_url: result.image_url || '' // Use the image_url from the result
    };
    
    onFoodAdded?.(foodEntry);
    
    toast({
      title: "✓ Food Added",
      description: `${result.name || 'Food'} added to your log`,
    });
    
    handleRejectFood();
  };

  const handleRejectFood = () => {
    setShowConfirmation(false);
    setAnalysisResult(null);
    cleanup();
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
        variant="action-secondary"
        size="start-button"
        className={`w-full flex items-center justify-center transition-colors ${
          isUploading || uploadState === 'analyzing'
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
            : canUseAIAnalysis 
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'bg-primary/50 text-primary-foreground opacity-50'
        }`}
        onClick={handleCameraClick}
        disabled={isUploading || uploadState === 'analyzing'}
        aria-label="AI photo analysis to add food"
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

      {/* Confirmation Modal */}
      {showConfirmation && analysisResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <FoodAnalysisResults
            result={analysisResult}
            imageUrl={imageUrl}
            onConfirm={handleConfirmFood}
            onReject={handleRejectFood}
          />
        </div>
      )}
    </>
  );
};
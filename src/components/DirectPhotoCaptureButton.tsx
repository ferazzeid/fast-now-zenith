import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessingDots } from '@/components/ProcessingDots';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { useToast } from '@/hooks/use-toast';
import { useUploadLoading } from '@/hooks/useStandardizedLoading';

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

export const DirectPhotoCaptureButton = ({ onFoodAdded, className = "" }: DirectPhotoCaptureButtonProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
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
        startUpload();
        
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
          startAnalysis();

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

              const foodItem = {
                name: result.name || 'Unknown Food',
                serving_size: servingSize,
                calories: totalCalories,
                carbs: totalCarbs,
                protein: totalProtein,
                fat: totalFat
              };

              // Add the food immediately without showing modal
              const foodEntry = {
                ...foodItem,
                source: 'photo_analysis'
              };
              
              onFoodAdded?.(foodEntry);
              
              toast({
                title: "✓ Food Added",
                description: `${result.name || 'Food'} added to your log`,
              });
              
              completeAnalysis();
            } else {
              // Show error and allow retry
              toast({
                title: "Analysis Failed",
                description: "Could not analyze the image. Please try again or add food manually.",
                variant: "destructive"
              });
              reset();
            }

          } catch (analysisError) {
            console.error('Analysis error:', analysisError);
            reset();
            
            toast({
              title: "Analysis failed",
              description: "Could not analyze the image. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // Show error for non-premium users
          reset();
          toast({
            title: "Premium Feature",
            description: "AI photo analysis requires a premium subscription.",
            variant: "destructive",
          });
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

  // Get button content based on state
  const getButtonContent = () => {
    if (isUploading || uploadState === 'analyzing') {
      return <ProcessingDots className="text-white" />;
    }
    return <Camera className="w-11 h-11" />;
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
    </>
  );
};
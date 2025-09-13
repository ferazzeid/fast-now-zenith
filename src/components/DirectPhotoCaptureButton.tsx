import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { uploadImageToCloud } from '@/utils/imageUtils';
import { useAccess } from '@/hooks/useAccess';
import { useIsMobile } from '@/hooks/use-mobile';
import { FoodAnalysisResults } from '@/components/FoodAnalysisResults';

type CaptureState = 'idle' | 'uploading' | 'analyzing' | 'results';

interface DirectPhotoCaptureButtonProps {
  onFoodAdded: (foodData: any) => void;
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

export const DirectPhotoCaptureButton = ({ 
  onFoodAdded,
  className = ""
}: DirectPhotoCaptureButtonProps) => {
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures, hasAIAccess, access_level, testRole, isTestingMode } = useAccess();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasAIAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_full') : hasAIAccess;
  
  // Check if user has access to AI analysis features
  const canUseAIAnalysis = effectiveLevel === 'admin' || effectiveHasAIAccess;
  const { withSessionGuard } = useSessionGuard();
  const isMobile = useIsMobile();

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

    await withSessionGuard(async () => {
      try {
        setCaptureState('uploading');
        
        const result = await uploadImageToCloud(file, user!.id, supabase);
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        setImageUrl(result.url);

        // Only attempt analysis if user has AI access
        if (canUseAIAnalysis) {
          setCaptureState('analyzing');
          
          toast({
            title: "Analyzing nutrition...",
            description: "Detecting food and nutritional content",
          });

          try {
            const { data, error } = await supabase.functions.invoke('analyze-food-image', {
              body: { imageUrl: result.url },
            });
            
            if (error) throw error;
            
            setCaptureState('results');
            setAnalysisResult(data);
            setShowResultsModal(true);

          } catch (analysisError) {
            console.error('Analysis error:', analysisError);
            setCaptureState('idle');
            
            // Show manual entry as fallback
            handleManualEntry(result.url);
            
            toast({
              title: "Analysis failed",
              description: "You can still add food details manually",
              variant: "default",
            });
          }
        } else {
          // Show manual entry for non-premium users
          handleManualEntry(result.url);
          
          toast({
            title: "Image captured",
            description: "Premium users get AI analysis. You can add details manually!",
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

  const handleManualEntry = (uploadedImageUrl: string) => {
    setCaptureState('idle');
    // Trigger manual entry with the uploaded image
    onFoodAdded({
      image_url: uploadedImageUrl,
      requiresManualEntry: true
    });
  };

  const handleConfirmAnalysis = (result: AnalysisResult) => {
    const servingSize = result.estimated_serving_size || 100;
    const totalCalories = Math.round((result.calories_per_100g || 0) * servingSize / 100);
    const totalCarbs = Math.round((result.carbs_per_100g || 0) * servingSize / 100 * 10) / 10;
    
    const foodData = {
      name: result.name || 'Unknown Food',
      calories: totalCalories,
      carbs: totalCarbs,
      serving_size: servingSize,
      image_url: imageUrl
    };
    
    onFoodAdded(foodData);
    setShowResultsModal(false);
    setCaptureState('idle');
    setAnalysisResult(null);
    setImageUrl('');
  };

  const handleRejectAnalysis = () => {
    setShowResultsModal(false);
    setCaptureState('idle');
    
    // Show manual entry with the captured image
    handleManualEntry(imageUrl);
  };

  const getButtonContent = () => {
    switch (captureState) {
      case 'uploading':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: 'Uploading...'
        };
      case 'analyzing':
        return {
          icon: <Sparkles className="w-5 h-5 animate-pulse text-purple-500" />,
          text: 'Analyzing...'
        };
      case 'results':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: 'Complete!'
        };
      default:
        return {
          icon: <Camera className="w-5 h-5" />,
          text: 'Photo'
        };
    }
  };

  const { icon, text } = getButtonContent();
  const isProcessing = captureState !== 'idle';

  return (
    <>
      <Button 
        variant="action-primary"
        size="action-tall"
        className={`w-full flex items-center justify-center ${className}`}
        onClick={handleCameraClick}
        disabled={isProcessing}
        aria-label="Take photo to add food"
      >
        {icon}
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

      {/* Analysis Results Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-md p-0">
          {analysisResult && (
            <FoodAnalysisResults
              result={analysisResult}
              imageUrl={imageUrl}
              onConfirm={handleConfirmAnalysis}
              onReject={handleRejectAnalysis}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
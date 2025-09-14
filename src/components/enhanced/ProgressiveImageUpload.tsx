import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, Image, CheckCircle, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { uploadImageToCloud } from '@/utils/imageUtils';
import { useAccess } from '@/hooks/useAccess';
import { useIsMobile } from '@/hooks/use-mobile';

type UploadState = 'idle' | 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'error';

interface ProgressiveImageUploadProps {
  onImageUpload: (url: string) => void;
  onAnalysisStart?: () => void;
  onAnalysisComplete?: (result: any) => void;
  onAnalysisError?: (error: string) => void;
  uploadState?: UploadState;
}

export const ProgressiveImageUpload = ({ 
  onImageUpload,
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  uploadState = 'idle'
}: ProgressiveImageUploadProps) => {
  const [internalState, setInternalState] = useState<UploadState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures, hasAIAccess, access_level } = useAccess();
  
  // Check if user has access to AI analysis features
  const canUseAIAnalysis = access_level === 'admin' || hasAIAccess;
  const { withSessionGuard } = useSessionGuard();
  const isMobile = useIsMobile();

  // Use external state if provided, otherwise use internal state
  const currentState = uploadState !== 'idle' ? uploadState : internalState;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Check authentication first
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      return;
    }

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

    // Upload the image first (this should always work if user is authenticated)
    await withSessionGuard(async () => {
      try {
        setInternalState('uploading');
        
        toast({
          title: "Uploading image...",
          description: "This may take a moment",
        });

        const result = await uploadImageToCloud(file, user!.id, supabase);
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Image upload successful - this is the critical success point
        setInternalState('uploaded');
        onImageUpload(result.url);
        
        toast({
          title: "✅ Image uploaded",
          description: "Image ready! You can now add food details.",
        });

        // Only attempt analysis if user has AI access
        if (canUseAIAnalysis) {
          // Start analysis as separate optional step
          setInternalState('analyzing');
          onAnalysisStart?.();
          
          toast({
            title: "Analyzing nutrition...",
            description: "This is optional - you can skip and enter manually",
          });

          try {
            // Verify authentication before analysis
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session || !session.access_token) {
              throw new Error('Session expired during analysis');
            }

            // Call analysis
            const { data, error } = await supabase.functions.invoke('analyze-food-image', {
              body: { imageUrl: result.url },
            });
            
            if (error) throw error;
            
            setInternalState('analyzed');
            onAnalysisComplete?.(data);
            
            // No toast here - let the parent handle confirmation

          } catch (analysisError) {
            // Analysis failed, but image is still uploaded - this is OK
            console.error('Analysis error (but image upload succeeded):', analysisError);
            
            // Keep upload state as 'uploaded' - don't change to error
            setInternalState('uploaded');
            
            let errorMessage = 'Analysis failed - you can enter food details manually';
            
            if (analysisError instanceof Error) {
              const message = analysisError.message.toLowerCase();
              if (message.includes('auth') || message.includes('session') || message.includes('token')) {
                errorMessage = 'Analysis requires fresh login - enter details manually for now';
              } else if (message.includes('network') || message.includes('fetch')) {
                errorMessage = 'Analysis failed due to network - enter details manually';
              }
            }
            
            onAnalysisError?.(errorMessage);
            
            toast({
              title: "Analysis failed",
              description: errorMessage,
              variant: "default", // Not destructive since upload worked
            });
          }
        } else {
          toast({
            title: "Premium feature",
            description: "AI analysis requires premium. You can still add food manually!",
          });
        }

      } catch (uploadError) {
        // Upload failed - this is the only real error case
        console.error('Upload error:', uploadError);
        setInternalState('error');
        
        let errorMessage = 'Failed to upload image';
        
        if (uploadError instanceof Error) {
          const message = uploadError.message.toLowerCase();
          if (message.includes('auth') || message.includes('session') || message.includes('token')) {
            errorMessage = 'Authentication error. Please refresh and try again.';
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection.';
          } else {
            errorMessage = uploadError.message;
          }
        }
        
        onAnalysisError?.(errorMessage);
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
          action: (
            <ToastAction altText="Retry upload" onClick={() => handleFileUpload(file)}>
              Retry
            </ToastAction>
          ),
        });
      }
    }, 'Image Upload');
  };

  const getStateDisplay = () => {
    switch (currentState) {
      case 'uploading':
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin" />,
          text: "Uploading...",
          subtext: "Securing your image"
        };
      case 'uploaded':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          text: "Image Ready!",
          subtext: "Add food details below"
        };
      case 'analyzing':
        return {
          icon: <Sparkles className="w-6 h-6 animate-pulse text-purple-500" />,
          text: "Analyzing...",
          subtext: "Detecting nutritional info"
        };
      case 'analyzed':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          text: "Analysis Complete!",
          subtext: "Review the results below"
        };
      case 'error':
        return {
          icon: <Upload className="w-6 h-6 text-red-500" />,
          text: "Try Again",
          subtext: "Something went wrong"
        };
      default:
        return {
          icon: <Camera className="w-6 h-6" />,
          text: "Take Photo",
          subtext: canUseAIAnalysis ? "AI will analyze nutrition" : "AI will analyze nutrition (Premium only)"
        };
    }
  };

  const { icon, text, subtext } = getStateDisplay();
  const isProcessing = ['uploading', 'uploaded', 'analyzing'].includes(currentState);

  return (
    <div className="space-y-4">
      {/* Mobile: Camera only */}
      {isMobile ? (
        <Button
          variant="outline"
          onClick={handleCameraCapture}
          disabled={isProcessing}
          className="w-full h-24 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
        >
          {icon}
          <span className="text-sm font-medium">{text}</span>
          {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
        </Button>
      ) : (
        /* Desktop: Single upload button with better spacing */
        <Button
          variant="outline"
          onClick={handleFileSelect}
          disabled={isProcessing}
          className="w-full min-h-[120px] flex-col space-y-3 p-6 bg-ceramic-base border-ceramic-rim"
        >
          <div className="flex flex-col items-center space-y-3">
            {icon}
            <div className="text-center space-y-1">
              <div className="text-base font-medium">{text}</div>
              <div className="text-sm text-muted-foreground">{subtext}</div>
            </div>
          </div>
        </Button>
      )}

      {/* Progress indicator for processing states */}
      {isProcessing && (
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              currentState === 'uploading' ? 'w-1/3 bg-blue-500' :
              currentState === 'uploaded' ? 'w-2/3 bg-green-500' :
              'w-full bg-purple-500'
            }`} 
          />
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
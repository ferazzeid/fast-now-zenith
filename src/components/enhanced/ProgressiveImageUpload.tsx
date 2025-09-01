import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, Image, CheckCircle, Sparkles } from 'lucide-react';
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
  const { hasPremiumFeatures } = useAccess();
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
        description: "Please sign in to analyze food images",
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

    // Check premium access
    if (!hasPremiumFeatures) {
      toast({
        title: "Premium Required",
        description: "AI food analysis is available for premium users",
        variant: "destructive",
      });
      return;
    }

    // Use session guard to protect the upload operation
    await withSessionGuard(async () => {
      try {

        setInternalState('uploading');
        
        // Show immediate feedback
        toast({
          title: "Uploading image...",
          description: "This may take a moment",
        });

        const result = await uploadImageToCloud(file, user!.id, supabase);
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        setInternalState('uploaded');
        onImageUpload(result.url);
        
        // Start analysis immediately
        setInternalState('analyzing');
        onAnalysisStart?.();
        
        toast({
          title: "✅ Image uploaded",
          description: "Now analyzing nutritional content...",
          className: "bg-gradient-to-r from-green-500 to-blue-500 text-white border-0",
        });

        // Verify authentication before analysis
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth validation before analysis:', { 
          hasUser: !!user, 
          hasSession: !!session,
          sessionExpiry: session?.expires_at,
          userId: user?.id,
          isExpired: session ? new Date() > new Date(session.expires_at * 1000) : true
        });

        if (!session || !session.access_token) {
          throw new Error('Your session has expired. Please sign in again to analyze images.');
        }

        // Call analysis
        const { data, error } = await supabase.functions.invoke('analyze-food-image', {
          body: { imageUrl: result.url },
        });
        
        if (error) throw error;
        
        setInternalState('analyzed');
        onAnalysisComplete?.(data);
        
        toast({
          title: "🎉 Analysis complete!",
          description: "Review the detected food information",
          className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
          duration: 2000,
        });

      } catch (error) {
        console.error('Upload or analysis error:', error);
        setInternalState('error');
        
        // Enhanced error handling with specific messages
        let errorMessage = 'Failed to process image';
        let shouldRetry = false;
        
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('auth') || message.includes('session') || message.includes('token')) {
            errorMessage = 'Authentication expired. Please refresh the page and try again.';
            shouldRetry = false;
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
            shouldRetry = true;
          } else {
            errorMessage = error.message;
            shouldRetry = true;
          }
        }
        
        onAnalysisError?.(errorMessage);
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          action: shouldRetry ? (
            <ToastAction altText="Retry upload" onClick={() => handleFileUpload(file)}>
              Retry
            </ToastAction>
          ) : undefined,
        });
      }
    }, 'Image Upload and Analysis');
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
          text: "Uploaded!",
          subtext: "Starting analysis..."
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
          icon: isMobile ? <Camera className="w-6 h-6" /> : <Upload className="w-6 h-6" />,
          text: isMobile ? "Take Photo" : "Upload Photo",
          subtext: "AI will analyze nutrition"
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
          {currentState === 'idle' ? (
            <>
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Use Camera</span>
            </>
          ) : (
            <>
              {icon}
              <span className="text-sm font-medium">{text}</span>
              {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
            </>
          )}
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
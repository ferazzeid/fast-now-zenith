import { useState, useRef, DragEvent } from 'react';
import { Upload, Camera, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImageHybrid } from '@/utils/imageUtils';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { PremiumGate } from '@/components/PremiumGate';


interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  showUploadOptionsWhenImageExists?: boolean;
  regenerateButton?: React.ReactNode;
  // New props for AI generation
  aiGenerationPrompt?: string;
  motivatorId?: string;
  onAiGenerate?: () => void;
  isGenerating?: boolean;
  bucket?: string; // Storage bucket to upload to
}

export const ImageUpload = ({ 
  currentImageUrl, 
  onImageUpload, 
  onImageRemove, 
  showUploadOptionsWhenImageExists = false, 
  regenerateButton,
  aiGenerationPrompt,
  motivatorId,
  onAiGenerate,
  isGenerating = false,
  bucket = 'motivator-images' // Default to motivator-images for backward compatibility
}: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures, isAdmin } = useUnifiedSubscription();
  const isMobile = useIsMobile();

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    }
  };

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
    console.log('🖼️ ImageUpload: Starting upload process for file:', file.name, 'size:', file.size);
    
    if (!user) {
      console.log('🖼️ ImageUpload: No user found, aborting upload');
      toast({
        title: "Error",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('🖼️ ImageUpload: Invalid file type:', file.type);
      toast({
        title: "Error", 
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('🖼️ ImageUpload: File too large:', file.size);
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    console.log('🖼️ ImageUpload: Set uploading state to true');

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      console.log('🖼️ ImageUpload: Created preview URL:', preview);
      setPreviewUrl(preview);

      // Clear any cached upload URLs
      localStorage.removeItem('uploadUrl');
      sessionStorage.removeItem('uploadUrl');
      
      console.log('🖼️ ImageUpload: About to call uploadImageHybrid with:', {
        fileName: file.name,
        userId: user.id,
        hasPremiumFeatures,
        bucket,
        isAdmin
      });

      // Use hybrid upload system with specified bucket
      // For default foods, use admin upload path if user is admin
      const isDefaultFoodUpload = bucket === 'food-images' && isAdmin;
      const result = await uploadImageHybrid(
        file, 
        user.id, 
        hasPremiumFeatures, 
        supabase, 
        bucket,
        isDefaultFoodUpload
      );
      
      console.log('🖼️ ImageUpload: uploadImageHybrid completed with result:', result);
      
      if (!result.success) {
        console.error('🖼️ ImageUpload: Upload failed with error:', result.error);
        throw new Error(result.error || 'Upload failed');
      }

      console.log('🖼️ ImageUpload: About to call onImageUpload with URL:', result.url);
      onImageUpload(result.url!);
      console.log('🖼️ ImageUpload: onImageUpload callback completed');
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      console.log('🖼️ ImageUpload: Success toast sent');

    } catch (error) {
      console.error('🖼️ ImageUpload: Upload error:', error);
      console.error('🖼️ ImageUpload: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      console.log('🖼️ ImageUpload: Set uploading state to false');
    }
  };


  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove();
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative">
            <div className="aspect-video max-h-[70vh] bg-ceramic-rim rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 h-8 w-8 p-0"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
            
            {/* Custom regenerate button */}
            {regenerateButton && (
              <div className="absolute top-2 right-12">
                {regenerateButton}
              </div>
            )}
          </div>
          
          {showUploadOptionsWhenImageExists && (
            <div className="space-y-3">
              {/* Mobile: Separate buttons */}
              {isMobile && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleFileSelect}
                    disabled={isUploading}
                    className="h-16 flex-col space-y-1 bg-ceramic-base border-ceramic-rim"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-xs">Upload photo</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCameraCapture}
                    disabled={isUploading}
                    className="h-16 flex-col space-y-1 bg-ceramic-base border-ceramic-rim"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-xs">Use camera</span>
                  </Button>
                </div>
              )}

              {/* Desktop: Single upload button */}
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={isUploading}
                  className="w-full bg-ceramic-base border-ceramic-rim"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Image
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop: Drag & drop area */}
          {!isMobile && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragOver ? 'border-primary bg-primary/5' : 'border-ceramic-rim'}
                ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!isUploading ? handleFileSelect : undefined}
            >
              {isUploading ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-warm-text">
                    Upload photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or click to browse
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mobile: Separate buttons */}
          {isMobile && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleFileSelect}
                disabled={isUploading}
                className="h-24 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
                >
                  <Image className="w-6 h-6" />
                  <span className="text-sm">Upload photo</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCameraCapture}
                  disabled={isUploading}
                  className="h-24 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm">Use camera</span>
                </Button>
            </div>
          )}


          {/* Desktop: Additional button if no drag & drop used */}
          {!isMobile && (
            <Button
              variant="outline"
              onClick={handleFileSelect}
              disabled={isUploading}
              className="w-full bg-ceramic-base border-ceramic-rim"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload photo
            </Button>
          )}
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
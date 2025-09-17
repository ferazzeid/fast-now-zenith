import { useState, useRef, DragEvent } from 'react';
import { Upload, Camera, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImageToCloud } from '@/utils/imageUtils';
import { useAccess } from '@/hooks/useAccess';
import { useIsMobile } from '@/hooks/use-mobile';
import { PremiumGate } from '@/components/PremiumGate';
import { useUploadLoading } from '@/hooks/useStandardizedLoading';


interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove?: () => void;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures } = useAccess();
  const isMobile = useIsMobile();
  const { isUploading, startUpload, completeUpload, setUploadError } = useUploadLoading();

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
    if (!user) {
      toast({
        title: "Error",
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

    startUpload();

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Premium users only - cloud storage
      if (!hasPremiumFeatures) {
        toast({
          title: "Premium Required",
          description: "Image uploads are only available for premium users",
          variant: "destructive",
        });
        setPreviewUrl(currentImageUrl || null);
        return;
      }

      const result = await uploadImageToCloud(file, user.id, supabase, bucket, currentImageUrl);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      onImageUpload(result.url);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      completeUpload();
    }
  };


  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove?.();
  };

  return (
        <div className="space-y-3">
          {previewUrl ? (
            <div className="space-y-2">
              <div className="relative">
                <div className="aspect-video max-h-[120px] bg-ceramic-rim rounded-lg overflow-hidden flex items-center justify-center">
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
                  <div className="absolute top-1 right-8">
                    {regenerateButton}
                  </div>
                )}
              </div>
              
              {showUploadOptionsWhenImageExists && (
                <div>
                  {/* Mobile: Single camera button */}
                  {isMobile && (
                    <Button
                      variant="outline"
                      onClick={handleCameraCapture}
                      disabled={isUploading}
                      className="w-full h-12 flex-col space-y-1 bg-ceramic-base border border-ceramic-shadow"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-xs">Use camera</span>
                    </Button>
                  )}

                  {/* Desktop: Single upload button */}
                  {!isMobile && (
                    <Button
                      variant="outline"
                      onClick={handleFileSelect}
                      disabled={isUploading}
                      className="w-full bg-ceramic-base border border-ceramic-shadow"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Image
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Desktop: Drag & drop area - Big camera */}
              {!isMobile && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragOver ? 'border-primary bg-primary/5' : 'border-ceramic-shadow'}
                ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!isUploading ? handleFileSelect : undefined}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Camera className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {/* Mobile: Big camera button */}
          {isMobile && (
            <Button
              variant="outline"
              onClick={handleCameraCapture}
              disabled={isUploading}
              className="w-full h-32 flex-col bg-ceramic-base border border-ceramic-shadow"
            >
              <Camera className="w-12 h-12" />
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
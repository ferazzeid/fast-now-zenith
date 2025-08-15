import { useState, useRef, DragEvent } from 'react';
import { Upload, Camera, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage, uploadImageHybrid } from '@/utils/imageUtils';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnhancedFoodImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove?: () => void;
  showUploadOptionsWhenImageExists?: boolean;
}

export const EnhancedFoodImageUpload = ({ 
  currentImageUrl, 
  onImageUpload, 
  onImageRemove,
  showUploadOptionsWhenImageExists = true
}: EnhancedFoodImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures } = useUnifiedSubscription();
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

    setIsUploading(true);

    try {
      // Compress the image first to handle large camera photos
      const compressed = await compressImage(file, 1920, 1920, 0.8);
      
      // Now validate the compressed size (should be much smaller)
      if (compressed.blob.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Compressed image is still too large. Please try a different photo.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Create preview immediately
      setPreviewUrl(compressed.dataUrl);

      // Create a File object from the compressed blob
      const compressedFile = new File([compressed.blob], file.name, {
        type: compressed.blob.type,
        lastModified: Date.now(),
      });

      // Use hybrid upload system with compressed file - CRITICAL: Use food-images bucket
      const result = await uploadImageHybrid(compressedFile, user.id, hasPremiumFeatures, supabase, 'food-images');
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      onImageUpload(result.url);
      
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove?.();
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative">
            <div className="aspect-video max-h-[200px] bg-ceramic-rim rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Food preview"
                className="w-full h-full object-contain"
              />
            </div>
            {onImageRemove && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 h-8 w-8 p-0"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
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
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Image className="w-6 h-6" />
                    <span className="text-sm">Upload photo</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCameraCapture}
                disabled={isUploading}
                className="h-24 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    <span className="text-sm">Take Photo</span>
                  </>
                )}
              </Button>
            </div>
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
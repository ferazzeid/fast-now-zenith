import { useState, useRef, DragEvent } from 'react';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { saveImageLocally, getLocalImageUrl, deleteLocalImage } from '@/utils/localImageStorage';
import { LocalImage } from '@/components/LocalImage';

interface LocalImageUploadProps {
  currentImageId?: string;
  onImageUpload: (imageId: string) => void;
  onImageRemove?: () => void;
  showUploadOptionsWhenImageExists?: boolean;
}

export const LocalImageUpload = ({ 
  currentImageId, 
  onImageUpload, 
  onImageRemove, 
  showUploadOptionsWhenImageExists = false
}: LocalImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
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
    // Reset the input so the same file can be selected again
    e.target.value = '';
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

    // Validate file size (max 10MB for local storage)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Delete old image if exists
      if (currentImageId) {
        await deleteLocalImage(currentImageId);
      }

      // Save new image locally
      const imageId = await saveImageLocally(file);
      onImageUpload(imageId);

      toast({
        title: "Image uploaded",
        description: "Image saved successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to save image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (currentImageId) {
      await deleteLocalImage(currentImageId);
    }
    onImageRemove?.();
  };

  return (
    <div className="space-y-4">
      {currentImageId ? (
        <div className="space-y-4">
          <div className="relative">
            <div className="aspect-video max-h-[70vh] bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
              <LocalImage
                imageId={currentImageId}
                alt="Food image"
                className="w-full h-full object-contain"
                fallback={
                  <div className="flex items-center justify-center w-full h-full">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  </div>
                }
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
          </div>
          
          {showUploadOptionsWhenImageExists && (
            <div className="space-y-3">
              {/* Mobile: Single camera button */}
              {isMobile && (
                <Button
                  variant="outline"
                  onClick={handleCameraCapture}
                  disabled={isUploading}
                  className="w-full h-16 flex-col space-y-1"
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
                  className="w-full"
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
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
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
                  <p className="text-sm text-muted-foreground mt-2">Saving image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Camera className="w-16 h-16 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop an image here, or click to select
                  </p>
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
              className="w-full h-32 flex-col"
            >
              {isUploading ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : (
                <Camera className="w-12 h-12" />
              )}
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
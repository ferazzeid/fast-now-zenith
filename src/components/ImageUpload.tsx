import { useState, useRef, DragEvent } from 'react';
import { Upload, Camera, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImageHybrid } from '@/utils/imageUtils';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
}

export const ImageUpload = ({ currentImageUrl, onImageUpload, onImageRemove }: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasCloudStorage } = useSubscription();
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Use hybrid upload system
      const result = await uploadImageHybrid(file, user.id, hasCloudStorage, supabase);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      onImageUpload(result.url);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove();
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative">
          <div className="aspect-video bg-ceramic-rim rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2"
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
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
                    Upload Photo
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
                <span className="text-sm">Choose from Gallery</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCameraCapture}
                disabled={isUploading}
                className="h-24 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
              >
                <Camera className="w-6 h-6" />
                <span className="text-sm">Take Photo</span>
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
              Choose File
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
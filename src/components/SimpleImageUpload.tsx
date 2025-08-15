import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImageHybrid } from '@/utils/imageUtils';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleImageUploadProps {
  onImageUpload: (url: string) => void;
}

export const SimpleImageUpload = ({ onImageUpload }: SimpleImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures } = useUnifiedSubscription();
  const isMobile = useIsMobile();

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
      // Use hybrid upload system - CRITICAL: Use food-images bucket for food components
      const result = await uploadImageHybrid(file, user.id, hasPremiumFeatures, supabase, 'food-images');
      
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile: Camera and Gallery buttons */}
      {isMobile ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleCameraCapture}
            disabled={isUploading}
            className="h-20 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm">Use camera</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleFileSelect}
            disabled={isUploading}
            className="h-20 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
          >
            <Image className="w-6 h-6" />
            <span className="text-sm">Upload photo</span>
          </Button>
        </div>
      ) : (
        /* Desktop: Single upload button */
        <Button
          variant="outline"
          onClick={handleFileSelect}
          disabled={isUploading}
          className="w-full h-20 flex-col space-y-2 bg-ceramic-base border-ceramic-rim"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-sm">Upload photo</span>
            </>
          )}
        </Button>
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
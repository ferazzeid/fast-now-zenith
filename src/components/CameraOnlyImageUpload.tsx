import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { compressImage, uploadImageHybrid } from '@/utils/imageUtils';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

interface CameraOnlyImageUploadProps {
  onImageUpload: (url: string) => void;
}

export const CameraOnlyImageUpload = ({ onImageUpload }: CameraOnlyImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures } = useUnifiedSubscription();

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

      // Create a File object from the compressed blob
      const compressedFile = new File([compressed.blob], file.name, {
        type: compressed.blob.type,
        lastModified: Date.now(),
      });

      // Use hybrid upload system with compressed file
      const result = await uploadImageHybrid(compressedFile, user.id, hasPremiumFeatures, supabase);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      onImageUpload(result.url);
      
      console.log('🔍 CameraOnlyImageUpload: About to call onImageUpload with URL:', result.url);
      console.log('🔍 CameraOnlyImageUpload: Upload result:', result);
      
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        variant="outline"
        onClick={handleCameraCapture}
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
            <Camera className="w-6 h-6" />
            <span className="text-sm">Take Photo</span>
          </>
        )}
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
    </div>
  );
};
import { useState, useRef } from 'react';
import { Camera, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImageHybrid } from '@/utils/imageUtils';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/use-mobile';

interface CompactImageUploadProps {
  onImageUpload: (url: string) => void;
}

export const CompactImageUpload = ({ onImageUpload }: CompactImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscribed } = useSubscription();
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
      // Use hybrid upload system
      const result = await uploadImageHybrid(file, user.id, subscribed, supabase);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      onImageUpload(result.url);
      
      toast({
        title: "Success",
        description: "Image uploaded and analyzing...",
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
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        onClick={handleFileSelect}
        disabled={isUploading}
        className="h-12 flex items-center space-x-2 bg-ceramic-base border-ceramic-rim"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Image className="w-4 h-4" />
        )}
        <span className="text-sm">Gallery</span>
      </Button>
      
      <Button
        variant="outline"
        onClick={handleCameraCapture}
        disabled={isUploading}
        className="h-12 flex items-center space-x-2 bg-ceramic-base border-ceramic-rim"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
        <span className="text-sm">Camera</span>
      </Button>

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
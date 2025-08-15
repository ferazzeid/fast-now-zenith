import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminImageUploadSilentProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  currentImageUrl?: string;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const AdminImageUploadSilent = ({ 
  onImageUpload, 
  onImageRemove, 
  currentImageUrl,
  onError,
  onSuccess,
}: AdminImageUploadSilentProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (!user) {
      onError?.("Please sign in to upload images");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename for admin goal ideas
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-admin-goal.${fileExt}`;
      
      console.log('🔄 Uploading admin goal image to:', fileName);
      console.log('📊 File size:', file.size, 'bytes');
      console.log('📄 File type:', file.type);

      // Upload to Supabase Storage (motivator-images bucket)
      const { data, error } = await supabase.storage
        .from('motivator-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from upload');
        throw new Error('Upload failed: No data returned');
      }

      console.log('✅ File uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('motivator-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        console.error('❌ Failed to get public URL');
        throw new Error('Failed to get public URL');
      }

      const publicUrl = urlData.publicUrl;
      console.log('✅ Public URL generated:', publicUrl);

      onImageUpload(publicUrl);
      onSuccess?.("Image uploaded successfully");

    } catch (error: any) {
      console.error('❌ Upload error details:', {
        message: error.message,
        stack: error.stack,
        error
      });
      
      onError?.(error.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onImageRemove();
    onSuccess?.("Image removed");
  };

  return (
    <div className="space-y-3">
      {/* Current image display with remove option */}
      {currentImageUrl && (
        <div className="relative">
          <img 
            src={currentImageUrl} 
            alt="Goal idea" 
            className="w-full h-32 object-cover rounded-lg border border-ceramic-rim"
          />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleRemove}
            className="absolute top-2 right-2 h-6 w-6 p-0"
            disabled={isUploading}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      {/* Upload area */}
      {!currentImageUrl && (
        <div className="border-2 border-dashed border-ceramic-rim rounded-lg p-6 text-center bg-ceramic-plate">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload an image for this goal idea
          </p>
          <label htmlFor="admin-image-upload-silent" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="bg-ceramic-base border-ceramic-rim"
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </>
                )}
              </span>
            </Button>
          </label>
          <input
            id="admin-image-upload-silent"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

      {/* Replace image button when image exists */}
      {currentImageUrl && (
        <div className="flex justify-center">
          <label htmlFor="admin-image-replace-silent" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="bg-ceramic-base border-ceramic-rim"
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Replace Image
                  </>
                )}
              </span>
            </Button>
          </label>
          <input
            id="admin-image-replace-silent"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
};
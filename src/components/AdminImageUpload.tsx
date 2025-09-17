
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { deleteImageFromStorage } from '@/utils/imageUtils';
import { useUploadLoading } from '@/hooks/useStandardizedLoading';

interface AdminImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  currentImageUrl?: string;
}

export const AdminImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  currentImageUrl,
}: AdminImageUploadProps) => {
  const { 
    isUploading, 
    error, 
    startUpload, 
    completeUpload, 
    setUploadError, 
    reset 
  } = useUploadLoading();
  const { toast } = useToast();
  const { user } = useAuth();
  const { withSessionGuard } = useSessionGuard();

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
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

    // Use session guard to protect the upload operation
    await withSessionGuard(async () => {
      startUpload();

      try {
        // Delete old image first (non-blocking)
        if (currentImageUrl) {
          const deleteResult = await deleteImageFromStorage(currentImageUrl, 'motivator-images', supabase);
          if (!deleteResult.success) {
            console.warn('Failed to delete old image (continuing with upload):', deleteResult.error);
          }
        }
        
        // Generate unique filename for admin goal ideas
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-admin-goal.${fileExt}`;
        
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

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('motivator-images')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          console.error('❌ Failed to get public URL');
          throw new Error('Failed to get public URL');
        }

        const publicUrl = urlData.publicUrl;
        onImageUpload(publicUrl);
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });

      } catch (error: any) {
        console.error('❌ Upload error details:', {
          message: error.message,
          stack: error.stack,
          error
        });
      
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        throw error; // Re-throw to let session guard handle it
      } finally {
        completeUpload();
      }
    }, 'Image Upload');
  };

  const handleRemove = () => {
    onImageRemove();
    toast({
      title: "Image removed",
      description: "The image has been removed",
    });
  };

  return (
    <div className="space-y-3">
      {/* Current image display with remove option */}
      {currentImageUrl && (
        <div className="relative">
          <img 
            src={currentImageUrl} 
            alt="Goal idea" 
            className="w-full h-32 object-cover rounded-lg border-subtle"
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
        <div className="border-2 border-dashed border-subtle rounded-lg p-6 text-center bg-ceramic-plate">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload an image for this goal idea
          </p>
          <label htmlFor="admin-image-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="bg-ceramic-base border-subtle"
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
            id="admin-image-upload"
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
          <label htmlFor="admin-image-replace" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="bg-ceramic-base border-subtle"
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
            id="admin-image-replace"
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

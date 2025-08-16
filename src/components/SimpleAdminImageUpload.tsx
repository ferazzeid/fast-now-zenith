import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminImageUpload } from '@/hooks/useAdminImageUpload';

interface SimpleAdminImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  currentImageUrl?: string;
}

export const SimpleAdminImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  currentImageUrl 
}: SimpleAdminImageUploadProps) => {
  const { uploadImage, deleteImage, isUploading } = useAdminImageUpload();

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      // Delete old image first if exists
      if (currentImageUrl) {
        await deleteImage(currentImageUrl);
      }
      onImageUpload(imageUrl);
    }
  };

  const handleRemove = async () => {
    if (currentImageUrl) {
      const success = await deleteImage(currentImageUrl);
      if (success) {
        onImageRemove();
      }
    } else {
      onImageRemove();
    }
  };

  return (
    <div className="space-y-3">
      {/* Current image display */}
      {currentImageUrl && (
        <div className="relative">
          <img 
            src={currentImageUrl} 
            alt="Admin upload" 
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
            Upload an image
          </p>
          <label htmlFor="simple-admin-upload" className="cursor-pointer">
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
            id="simple-admin-upload"
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

      {/* Replace button when image exists */}
      {currentImageUrl && (
        <div className="flex justify-center">
          <label htmlFor="simple-admin-replace" className="cursor-pointer">
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
            id="simple-admin-replace"
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
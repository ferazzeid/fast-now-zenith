import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModernImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  currentImageUrl?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export const ModernImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  currentImageUrl,
  accept = "image/*",
  maxSize = 5 
}: ModernImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    try {
      // Create a temporary URL for immediate preview
      const tempUrl = URL.createObjectURL(file);
      onImageUpload(tempUrl);
      
      // Here you would typically upload to your storage service
      // For now, we'll just use the temporary URL
      
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentImageUrl);
    }
    onImageRemove();
  };

  return (
    <div className="space-y-3">
      {currentImageUrl ? (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border border-ceramic-rim"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-ceramic-rim rounded-lg p-6 text-center bg-ceramic-plate">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload an image or drag and drop
          </p>
          <label htmlFor="image-upload" className="cursor-pointer">
            <Button type="button" variant="outline" size="sm" disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      )}
    </div>
  );
};
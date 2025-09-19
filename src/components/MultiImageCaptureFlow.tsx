import React, { useState, useRef } from 'react';
import { Camera, Plus, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessingDots } from '@/components/ProcessingDots';
import { useToast } from '@/hooks/use-toast';
import { compressImage, getBase64FromFile } from '@/utils/imageCompression';

interface CapturedImage {
  file: File;
  previewUrl: string;
  base64: string;
}

interface MultiImageCaptureFlowProps {
  onImagesReady: (images: string[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  className?: string;
}

export const MultiImageCaptureFlow = ({ 
  onImagesReady, 
  onCancel, 
  isProcessing = false,
  className = "" 
}: MultiImageCaptureFlowProps) => {
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCameraClick = () => {
    if (capturedImages.length >= 2) {
      toast({
        title: "Maximum images reached",
        description: "You can capture up to 2 images",
        variant: "destructive",
      });
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Clear the input to allow the same file to be selected again
    event.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    await processImage(file);
  };

  const processImage = async (file: File) => {
    try {
      setIsCompressing(true);
      
      // Compress image
      const compressedFile = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7
      });
      
      // Get base64 data
      const base64Data = await getBase64FromFile(compressedFile);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile);
      
      // Add to captured images
      const newImage: CapturedImage = {
        file: compressedFile,
        previewUrl,
        base64: base64Data
      };
      
      setCapturedImages(prev => [...prev, newImage]);
      
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: "Processing failed",
        description: "Could not process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      
      // Cleanup object URL
      if (removed.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      
      return updated;
    });
  };

  const handleAnalyze = () => {
    if (capturedImages.length === 0) {
      toast({
        title: "No images to analyze",
        description: "Please capture at least one image",
        variant: "destructive",
      });
      return;
    }

    const base64Images = capturedImages.map(img => img.base64);
    onImagesReady(base64Images);
  };

  const handleCancel = () => {
    // Cleanup object URLs
    capturedImages.forEach(img => {
      if (img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setCapturedImages([]);
    onCancel();
  };

  const canAddMore = capturedImages.length < 2;
  const canAnalyze = capturedImages.length > 0 && !isProcessing && !isCompressing;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Capture Food Photos</h3>
        <p className="text-sm text-muted-foreground">
          Take 1-2 photos (e.g., front and back of package) for better analysis
        </p>
      </div>

      {/* Image Preview Grid */}
      {capturedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {capturedImages.map((image, index) => (
            <div key={index} className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img 
                  src={image.previewUrl} 
                  alt={`Captured image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Capture Button */}
      {canAddMore && (
        <Button
          onClick={handleCameraClick}
          disabled={isCompressing}
          variant="outline"
          size="lg"
          className="w-full h-20 border-dashed border-2"
        >
          {isCompressing ? (
            <ProcessingDots className="text-current" />
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs">
                {capturedImages.length === 0 ? 'Take first photo' : 'Take second photo (optional)'}
              </span>
            </div>
          )}
        </Button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCancel}
          variant="outline"
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="flex-1"
        >
          {isProcessing ? (
            <ProcessingDots className="text-white" />
          ) : (
            `Analyze ${capturedImages.length} Image${capturedImages.length > 1 ? 's' : ''}`
          )}
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Tips:</strong> For packaged foods, take photos of both the front (product name) 
          and back (nutrition label) for more accurate analysis.
        </p>
      </div>

      {/* Hidden file input */}
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
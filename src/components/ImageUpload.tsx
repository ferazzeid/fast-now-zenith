import { useState, useRef, DragEvent } from 'react';
import { Upload, Camera, X, Loader2, Image, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImageHybrid } from '@/utils/imageUtils';
import { useOptimizedSubscription } from '@/hooks/optimized/useOptimizedSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { PremiumGate } from '@/components/PremiumGate';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  showUploadOptionsWhenImageExists?: boolean;
  regenerateButton?: React.ReactNode;
  // New props for AI generation
  aiGenerationPrompt?: string;
  motivatorId?: string;
  onAiGenerate?: () => void;
  isGenerating?: boolean;
}

export const ImageUpload = ({ 
  currentImageUrl, 
  onImageUpload, 
  onImageRemove, 
  showUploadOptionsWhenImageExists = false, 
  regenerateButton,
  aiGenerationPrompt,
  motivatorId,
  onAiGenerate,
  isGenerating = false
}: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPremiumFeatures } = useOptimizedSubscription();
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
      const result = await uploadImageHybrid(file, user.id, hasPremiumFeatures, supabase);
      
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

  const handleGenerateImage = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to generate images",
        variant: "destructive",
      });
      return;
    }

    if (!aiGenerationPrompt?.trim()) {
      toast({
        title: "Error",
        description: "Please add content to generate an image",
        variant: "destructive",
      });
      return;
    }

    // If we have a motivatorId, use background generation like the frontend button
    if (motivatorId) {
      if (onAiGenerate) {
        onAiGenerate();
      }
      return;
    }

    // For other cases, use direct generation (fallback)
    if (onAiGenerate) {
      onAiGenerate();
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove();
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="space-y-4">
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
              className="absolute top-2 right-2 h-8 w-8 p-0"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
            
            {/* AI Generate/Regenerate button positioned on image */}
            {aiGenerationPrompt && (
              <div className="absolute top-2 right-12">
                <PremiumGate feature="AI Image Generation" showUpgrade={false}>
                  <Button
                    variant="ai"
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="h-8 w-8 p-0"
                    title={previewUrl && currentImageUrl ? "Regenerate with AI" : "Generate with AI"}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (previewUrl && currentImageUrl) ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </PremiumGate>
              </div>
            )}
          </div>
          
          {showUploadOptionsWhenImageExists && (
            <div className="space-y-3">
              {/* Mobile: Separate buttons */}
              {isMobile && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleFileSelect}
                    disabled={isUploading}
                    className="h-16 flex-col space-y-1 bg-ceramic-base border-ceramic-rim"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-xs">Gallery</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCameraCapture}
                    disabled={isUploading}
                    className="h-16 flex-col space-y-1 bg-ceramic-base border-ceramic-rim"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-xs">Camera</span>
                  </Button>
                </div>
              )}

              {/* Desktop: Single upload button */}
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={isUploading}
                  className="w-full bg-ceramic-base border-ceramic-rim"
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
                <span className="text-sm">Choose</span>
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

          {/* AI Generation Button for Empty State */}
          {aiGenerationPrompt && (
            <PremiumGate feature="AI Image Generation" showUpgrade={false}>
              <Button
                variant="ai"
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </PremiumGate>
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
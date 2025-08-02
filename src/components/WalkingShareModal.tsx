import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SimpleImageUpload } from '@/components/SimpleImageUpload';
import { formatWalkingShareMessage, generateFacebookShareUrl, copyToClipboard } from '@/utils/socialSharing';
import { Share2, Facebook, Copy, Camera } from 'lucide-react';

interface WalkingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  walkingStats: {
    time: string;
    distance: number;
    calories: number;
    speed: number;
    units: 'metric' | 'imperial';
  };
}

export const WalkingShareModal = ({ isOpen, onClose, walkingStats }: WalkingShareModalProps) => {
  const [shareMessage, setShareMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      generateShareMessage();
    }
  }, [isOpen, walkingStats]);

  const generateShareMessage = async () => {
    try {
      setIsLoading(true);
      const message = await formatWalkingShareMessage(walkingStats);
      setShareMessage(message);
    } catch (error) {
      console.error('Error generating share message:', error);
      toast({
        title: "Error",
        description: "Failed to generate share message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookShare = () => {
    const facebookUrl = generateFacebookShareUrl(shareMessage);
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    toast({
      title: "Shared!",
      description: "Opening Facebook to share your walking achievement",
    });
  };

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(shareMessage);
    if (success) {
      toast({
        title: "Copied!",
        description: "Share message copied to clipboard",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    toast({
      title: "Photo added!",
      description: "Your walking photo has been uploaded",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Walking Achievement
          </DialogTitle>
          <DialogDescription>
            Share your walking progress with friends and family on Facebook
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Upload Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Add a photo (optional)
            </Label>
            <SimpleImageUpload
              onImageUpload={handleImageUpload}
            />
            {uploadedImage && (
              <div className="mt-2">
                <img
                  src={uploadedImage}
                  alt="Walking location"
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Share Message Preview */}
          <div className="space-y-2">
            <Label htmlFor="shareMessage" className="text-sm font-medium">
              Share Message
            </Label>
            <Textarea
              id="shareMessage"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Loading message..."
              className="min-h-[120px] text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Share Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleFacebookShare}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
              disabled={isLoading || !shareMessage}
            >
              <Facebook className="w-4 h-4 mr-2" />
              Share on Facebook
            </Button>

            <Button
              onClick={handleCopyToClipboard}
              variant="outline"
              className="w-full justify-start"
              disabled={isLoading || !shareMessage}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {uploadedImage 
              ? "Note: Photos need to be shared manually on Facebook after posting the text"
              : "Add a photo of your walking route or scenery to make your post more engaging!"
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
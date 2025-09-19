import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

interface PremiumVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumVoiceModal = ({ isOpen, onClose }: PremiumVoiceModalProps) => {
  const { createSubscription } = useAccess();

  const handleUpgrade = () => {
    createSubscription();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            Premium Features Required
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mic className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Voice Input</h4>
              <p className="text-sm text-muted-foreground">
                Input text using your voice and let AI help smoothen out the process
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Premium users can use voice input to quickly create content. Free users can use manual text input.
          </p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Continue with Manual
            </Button>
            <Button 
              onClick={handleUpgrade}
              variant="default"
              className="flex-1"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
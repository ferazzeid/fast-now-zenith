import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Mic, Camera } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

interface PremiumFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumFoodModal = ({ isOpen, onClose }: PremiumFoodModalProps) => {
  const { createSubscription } = useAccess();

  const handleUpgrade = () => {
    createSubscription();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-500" />
            AI Features Require Premium
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mic className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium">AI Voice Features</h4>
              <p className="text-sm text-muted-foreground">
                Describe your meals naturally with voice input and get instant nutrition analysis
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium">AI Photo Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Take photos of your food and get automatic nutrition tracking with smart portion estimation
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Free users are limited to manual input only. Upgrade now to unlock AI-powered functionality!
          </p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Continue with Manual
            </Button>
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
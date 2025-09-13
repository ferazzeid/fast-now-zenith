import { ExternalLink, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';

export const BillingInformation = () => {
  const { openCustomerPortal, isPremium, daysRemaining } = useAccess();
  const { toast } = useToast();

  const handleOpenPortal = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isPremium) {
    return (
      <div className="text-sm text-muted-foreground">
        No active subscription
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>Next renewal</span>
        </div>
        <span className="text-foreground">
          {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span>Payment method</span>
        </div>
        <span className="text-muted-foreground">•••• •••• •••• ••••</span>
      </div>

      <Button
        variant="outline"
        onClick={handleOpenPortal}
        className="w-full justify-start"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Manage Billing
      </Button>
    </div>
  );
};
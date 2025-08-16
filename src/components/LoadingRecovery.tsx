import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingRecoveryProps {
  onRetry: () => void;
  message?: string;
  showError?: boolean;
}

export const LoadingRecovery = ({ 
  onRetry, 
  message = "Taking longer than expected...",
  showError = false 
}: LoadingRecoveryProps) => {
  return (
    <Card className="p-6 text-center space-y-4 border-muted">
      <div className="flex justify-center">
        {showError ? (
          <AlertCircle className="w-8 h-8 text-destructive" />
        ) : (
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{message}</p>
        {showError && (
          <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
        )}
      </div>
      
      <Button 
        onClick={onRetry} 
        variant="outline" 
        size="sm"
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </Button>
    </Card>
  );
};
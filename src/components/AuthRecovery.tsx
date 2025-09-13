import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface AuthRecoveryProps {
  onRetry: () => void;
  onClearData: () => void;
}

export const AuthRecovery = ({ onRetry, onClearData }: AuthRecoveryProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Connection Issue</CardTitle>
          <CardDescription>
            We're having trouble connecting to your account. This might be due to a slow connection or stored data that needs refreshing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={onRetry}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={onClearData}
            className="w-full"
            variant="outline"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Data & Restart
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            If the issue persists, try clearing your data. This will sign you out but may resolve connection issues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
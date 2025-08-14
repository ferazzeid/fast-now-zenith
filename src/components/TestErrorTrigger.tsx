import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NetworkErrorBoundary } from '@/components/NetworkErrorBoundary';

const ErrorThrowingComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Network request failed: Failed to fetch');
  }
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-green-600">✓ Component loaded successfully</p>
      <p className="text-xs text-muted-foreground">Click below to simulate a network error</p>
    </div>
  );
};

export const TestErrorTrigger = () => {
  const [triggerError, setTriggerError] = useState(false);

  const handleTriggerError = () => {
    setTriggerError(true);
  };

  const handleReset = () => {
    setTriggerError(false);
  };

  return (
    <div className="space-y-3">
      <NetworkErrorBoundary>
        <ErrorThrowingComponent shouldError={triggerError} />
        {!triggerError && (
          <Button 
            onClick={handleTriggerError}
            variant="outline" 
            size="sm"
          >
            Trigger Network Error
          </Button>
        )}
      </NetworkErrorBoundary>
      
      {triggerError && (
        <Button 
          onClick={handleReset}
          variant="outline" 
          size="sm"
          className="mt-2"
        >
          Reset Test
        </Button>
      )}
    </div>
  );
};
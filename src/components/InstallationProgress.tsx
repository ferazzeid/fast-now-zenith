import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useInstallationProgress } from '@/utils/installationManager';

interface InstallationProgressProps {
  onComplete?: () => void;
  showOnlyDuringInstall?: boolean;
}

export const InstallationProgress = ({ 
  onComplete, 
  showOnlyDuringInstall = true 
}: InstallationProgressProps) => {
  const { progress, forceReinstall, checkOfflineAvailability } = useInstallationProgress();
  const [isVisible, setIsVisible] = useState(false);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  // Check offline data availability on mount
  useEffect(() => {
    checkOfflineAvailability().then(setHasOfflineData);
  }, [checkOfflineAvailability]);

  // Handle visibility logic
  useEffect(() => {
    if (showOnlyDuringInstall) {
      // Show during installation/preloading, hide when complete
      setIsVisible(progress.stage !== 'complete');
    } else {
      // Always show when not complete
      setIsVisible(true);
    }

    // Call onComplete callback
    if (progress.stage === 'complete' && onComplete) {
      setTimeout(onComplete, 1000); // Small delay for UX
    }
  }, [progress.stage, onComplete, showOnlyDuringInstall]);

  // Don't render if not visible
  if (!isVisible && progress.stage === 'complete') {
    return null;
  }

  const getStatusIcon = () => {
    switch (progress.stage) {
      case 'complete':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <RefreshCw className="w-6 h-6 text-primary animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.stage) {
      case 'complete':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4 shadow-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          <h2 className="text-xl font-semibold">FastNow Installation</h2>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {progress.message}
            </span>
            <span className="text-sm text-muted-foreground">
              {progress.progress}%
            </span>
          </div>
          
          <Progress 
            value={progress.progress} 
            className="w-full"
          />
        </div>


        {/* Error Actions */}
        {progress.stage === 'error' && (
          <div className="space-y-2">
            <Button 
              onClick={forceReinstall}
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Installation
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="secondary"
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        )}

        {/* Complete Actions */}
        {progress.stage === 'complete' && !showOnlyDuringInstall && (
          <div className="text-center">
            <p className="text-sm text-green-600 dark:text-green-400 mb-3">
              🎉 App ready!
            </p>
            <Button 
              onClick={onComplete}
              className="w-full"
            >
              Continue to App
            </Button>
          </div>
        )}

        {/* Removed redundant "Starting up your app..." message */}
      </div>
    </div>
  );
};

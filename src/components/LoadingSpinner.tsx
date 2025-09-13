import { EnhancedLoadingScreen, SmartInlineLoading } from './enhanced/SmartLoadingStates';
import { useAppLogo } from '@/hooks/useAppLogo';

export const LoadingSpinner = ({ 
  fullScreen = true, 
  text = "Loading",
  subText = "Preparing your experience",
  showLogo = true
}: {
  fullScreen?: boolean;
  text?: string;
  subText?: string;
  showLogo?: boolean;
}) => {
  const { appLogo, loading: logoLoading } = useAppLogo();
  
  const content = (
    <div className="text-center space-y-4">
      {/* App Logo - Don't block loading on logo */}
      {showLogo && appLogo && !logoLoading && (
        <img 
          src={appLogo} 
          alt="App Logo" 
          className="w-16 h-16 object-contain rounded-lg mx-auto"
        />
      )}
      
      {/* Fallback logo placeholder */}
      {showLogo && !appLogo && !logoLoading && (
        <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">F</span>
        </div>
      )}
      
      {/* Enhanced animated spinner */}
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-2 border-primary/30 rounded-full"></div>
      </div>
      
      {/* Loading text with subtle animation */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground">{text}</p>
        <p className="text-sm text-muted-foreground">{subText}</p>
      </div>
      
      {/* Progress dots */}
      <div className="flex justify-center space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
};
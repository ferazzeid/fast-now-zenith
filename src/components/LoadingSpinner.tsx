export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Animated hourglass/clock icon */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-primary/30 rounded-full"></div>
        </div>
        
        {/* Loading text with subtle animation */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">Loading...</p>
          <p className="text-sm text-muted-foreground">Preparing your experience</p>
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};
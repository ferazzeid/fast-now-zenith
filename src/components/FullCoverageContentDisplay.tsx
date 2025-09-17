import React from 'react';
import { cn } from '@/lib/utils';

interface FullCoverageContentDisplayProps {
  stage?: string;
  content?: string;
  imageUrl?: string;
  isTransitioning?: boolean;
  className?: string;
  showAdminHour?: boolean;
  adminHour?: number;
}

export const FullCoverageContentDisplay: React.FC<FullCoverageContentDisplayProps> = ({
  stage,
  content,
  imageUrl,
  isTransitioning = false,
  className,
  showAdminHour = false,
  adminHour
}) => {
  const hasImage = !!imageUrl;

  return (
    <div 
      className={cn(
        "relative w-full min-h-[120px] overflow-hidden rounded-lg",
        "transition-all duration-500 ease-in-out",
        isTransitioning && "opacity-0",
        className
      )}
    >
      {/* Background Image */}
      {hasImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Overlay Background */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-500",
          hasImage 
            ? "bg-black/60 backdrop-blur-[0.5px]" // Semi-transparent dark overlay for images
            : "bg-background" // Clean background for text-only, no border here
        )}
      />

      {/* Border for text-only version - separate from background to fix corner issue */}
      {!hasImage && (
        <div className="absolute inset-0 border border-border rounded-lg pointer-events-none" />
      )}

      {/* Content Container */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-center">
        {/* Admin Hour Indicator */}
        {showAdminHour && adminHour !== undefined && (
          <div className="absolute top-3 right-3 bg-muted/20 text-foreground border border-muted rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
            {adminHour}
          </div>
        )}

        {/* Stage Title */}
        {stage && (
          <div 
            className={cn(
              "font-semibold mb-3 text-base leading-tight transition-all duration-500",
              hasImage 
                ? "text-white" // White text on image
                : "text-foreground" // Theme-appropriate text on plain background
            )}
          >
            {stage}
          </div>
        )}

        {/* Main Content */}
        {content && (
          <div 
            className={cn(
              "text-sm leading-relaxed transition-all duration-500",
              "animate-fade-in",
              hasImage 
                ? "text-white/90" // Slightly transparent white on image
                : "text-muted-foreground" // Theme-appropriate muted text
            )}
            style={{
              animation: isTransitioning 
                ? 'fade-in 0.3s ease-in-out' 
                : 'fade-in 0.8s ease-in-out'
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
};
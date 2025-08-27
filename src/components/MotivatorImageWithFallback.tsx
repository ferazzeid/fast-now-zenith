import React, { useState } from 'react';
import { Image, Plus } from 'lucide-react';
import placeholderImage from '@/assets/motivator-placeholder.jpg';

interface MotivatorImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
  onAddImageClick?: () => void;
  showAddImagePrompt?: boolean;
}

export const MotivatorImageWithFallback: React.FC<MotivatorImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  style,
  onError,
  onAddImageClick,
  showAddImagePrompt = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const handleFallbackError = () => {
    setFallbackError(true);
  };

  // If no src provided or both main and fallback failed, show add image prompt or icon
  if (!src || (imageError && fallbackError)) {
    if (showAddImagePrompt && onAddImageClick && !src) {
      return (
        <div 
          className={`bg-muted/40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/60 transition-colors ${className}`}
          style={style}
          onClick={onAddImageClick}
        >
          <Plus className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">add image</span>
        </div>
      );
    }
    
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={style}
      >
        <Image className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }

  // If main image failed, use fallback
  if (imageError) {
    return (
      <img
        src={placeholderImage}
        alt={alt}
        className={className}
        style={style}
        onError={handleFallbackError}
        loading="lazy"
      />
    );
  }

  // Show main image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
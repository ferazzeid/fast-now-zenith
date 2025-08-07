import React, { useState } from 'react';
import { Image } from 'lucide-react';
import placeholderImage from '@/assets/motivator-placeholder.jpg';

interface MotivatorImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

export const MotivatorImageWithFallback: React.FC<MotivatorImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  style,
  onError
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

  // If no src provided or both main and fallback failed, show icon
  if (!src || (imageError && fallbackError)) {
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
    />
  );
};
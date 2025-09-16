import React, { useState, useEffect } from 'react';
import { LocalImage } from './LocalImage';

interface SmartImageProps {
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Smart image component that can handle both local image IDs and remote URLs
 * - If imageUrl looks like a local ID (no http/https), uses LocalImage
 * - If imageUrl is a remote URL (starts with http/https), uses regular img
 * - Shows fallback if no imageUrl or on error
 */
export const SmartImage: React.FC<SmartImageProps> = ({ 
  imageUrl, 
  alt = "Image", 
  className = "",
  fallback = <div className="bg-muted animate-pulse rounded" />
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // No image URL provided
  if (!imageUrl) {
    return <div className={className}>{fallback}</div>;
  }

  // Check if it's a remote URL (starts with http/https)
  const isRemoteUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
  
  if (isRemoteUrl) {
    // Handle remote URLs with regular img tag
    if (imageError) {
      return <div className={className}>{fallback}</div>;
    }

    return (
      <img 
        src={imageUrl} 
        alt={alt} 
        className={className}
        onError={() => setImageError(true)}
      />
    );
  } else {
    // Handle local image IDs with LocalImage component
    return (
      <LocalImage 
        imageId={imageUrl} 
        alt={alt} 
        className={className}
        fallback={fallback}
      />
    );
  }
};
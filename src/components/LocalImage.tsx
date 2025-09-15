import React, { useEffect, useState } from 'react';
import { getLocalImageUrl } from '@/utils/localImageStorage';

interface LocalImageProps {
  imageId: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const LocalImage: React.FC<LocalImageProps> = ({ 
  imageId, 
  alt = "Local image", 
  className = "",
  fallback = <div className="bg-muted animate-pulse rounded" />
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const url = await getLocalImageUrl(imageId);
        
        if (mounted) {
          if (url) {
            objectUrl = url;
            setImageUrl(url);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading local image:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    // Cleanup function to revoke object URL
    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId]);

  if (loading) {
    return <div className={`${className} bg-muted animate-pulse rounded`} />;
  }

  if (error || !imageUrl) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
};
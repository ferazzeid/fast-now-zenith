// Image compression and storage utilities

export interface CompressedImage {
  blob: Blob;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

/**
 * Compress an image file to reduce size while maintaining quality
 */
export const compressImage = async (
  file: File, 
  maxWidth = 1024, 
  maxHeight = 1024, 
  quality = 0.8
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve({
              blob,
              dataUrl,
              size: blob.size,
              width,
              height
            });
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get user's image storage limit based on subscription status
 */
export const getImageStorageLimit = (isPaidUser: boolean): number => {
  return isPaidUser ? Infinity : 100; // 100 images for free users, unlimited for paid
};

/**
 * Check if user has reached their storage limit
 */
export const checkStorageLimit = async (
  userId: string, 
  isPaidUser: boolean
): Promise<{ canUpload: boolean; currentCount: number; limit: number }> => {
  const limit = getImageStorageLimit(isPaidUser);
  
  if (isPaidUser) {
    return { canUpload: true, currentCount: 0, limit };
  }

  // For free users, check local storage count
  const localImages = getLocalImages(userId);
  const currentCount = localImages.length;
  
  return {
    canUpload: currentCount < limit,
    currentCount,
    limit
  };
};

/**
 * Local storage management for free users
 */
const LOCAL_STORAGE_KEY = 'motivator_images';

interface LocalImage {
  id: string;
  userId: string;
  dataUrl: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

export const saveImageLocally = (
  userId: string, 
  imageData: CompressedImage, 
  originalName: string
): string => {
  const imageId = `${userId}_${Date.now()}`;
  const localImage: LocalImage = {
    id: imageId,
    userId,
    dataUrl: imageData.dataUrl,
    originalName,
    size: imageData.size,
    uploadedAt: new Date().toISOString()
  };

  const existingImages = getLocalImages();
  existingImages.push(localImage);
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingImages));
  return imageId;
};

export const getLocalImages = (userId?: string): LocalImage[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const allImages: LocalImage[] = stored ? JSON.parse(stored) : [];
    
    return userId 
      ? allImages.filter(img => img.userId === userId)
      : allImages;
  } catch (error) {
    console.error('Error reading local images:', error);
    return [];
  }
};

export const getLocalImage = (imageId: string): LocalImage | null => {
  const images = getLocalImages();
  return images.find(img => img.id === imageId) || null;
};

export const deleteLocalImage = (imageId: string): boolean => {
  try {
    const images = getLocalImages();
    const filteredImages = images.filter(img => img.id !== imageId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredImages));
    return true;
  } catch (error) {
    console.error('Error deleting local image:', error);
    return false;
  }
};

/**
 * Clean up old images if storage gets too large
 */
export const cleanupLocalStorage = (maxSizeMB = 50): void => {
  try {
    const images = getLocalImages();
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (totalSize > maxSizeBytes) {
      // Sort by upload date (oldest first) and remove until under limit
      images.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      
      let currentSize = totalSize;
      const toKeep: LocalImage[] = [];
      
      for (let i = images.length - 1; i >= 0; i--) {
        if (currentSize <= maxSizeBytes) {
          toKeep.unshift(images[i]);
        } else {
          currentSize -= images[i].size;
        }
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toKeep));
    }
  } catch (error) {
    console.error('Error cleaning up local storage:', error);
  }
};

/**
 * Hybrid upload: local for free users, cloud for paid users
 */
export const uploadImageHybrid = async (
  file: File,
  userId: string,
  isPaidUser: boolean,
  supabase: any
): Promise<{ success: boolean; imageId: string; url: string; error?: string }> => {
  try {
    // Check storage limit
    const { canUpload, currentCount, limit } = await checkStorageLimit(userId, isPaidUser);
    
    if (!canUpload) {
      return {
        success: false,
        imageId: '',
        url: '',
        error: `Storage limit reached (${currentCount}/${limit} images). Upgrade to Pro for unlimited storage.`
      };
    }

    // Compress image
    const compressed = await compressImage(file);
    
    if (isPaidUser) {
      // Upload to Supabase Storage for paid users
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('motivator-images')
        .upload(fileName, compressed.blob);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('motivator-images')
        .getPublicUrl(fileName);

      return {
        success: true,
        imageId: fileName,
        url: urlData.publicUrl,
      };
    } else {
      // Save locally for free users
      const imageId = saveImageLocally(userId, compressed, file.name);
      
      // Clean up if needed
      cleanupLocalStorage();
      
      return {
        success: true,
        imageId,
        url: compressed.dataUrl,
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      imageId: '',
      url: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};
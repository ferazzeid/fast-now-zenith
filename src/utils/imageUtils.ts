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
 * Premium-only cloud storage for image uploads
 * Free users get no upload capability - only placeholders
 */

/**
 * Delete an image from Supabase Storage
 */
export const deleteImageFromStorage = async (
  imageUrl: string,
  bucketName: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!imageUrl) return { success: true }; // Nothing to delete
    
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === bucketName);
    
    if (bucketIndex === -1) {
      console.warn('Could not extract filename from URL:', imageUrl);
      return { success: false, error: 'Invalid image URL format' };
    }
    
    // Get the path after the bucket name
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    if (!filePath) {
      console.warn('Empty file path extracted from URL:', imageUrl);
      return { success: false, error: 'Could not determine file path' };
    }
    
    console.log('🗑️ Deleting image:', { imageUrl, bucketName, filePath });
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
      
    if (error) {
      console.error('Storage deletion error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Image deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Delete operation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
};

/**
 * Premium-only cloud storage upload with optional old image cleanup
 * Free users will be blocked at the component level
 */
export const uploadImageToCloud = async (
  file: File, 
  userId: string, 
  supabase: any,
  bucketName: string = 'motivator-images',
  oldImageUrl?: string
): Promise<{ success: boolean; imageId: string; url: string; error?: string }> => {
  try {
    // Delete old image first (non-blocking - don't fail upload if deletion fails)
    if (oldImageUrl) {
      const deleteResult = await deleteImageFromStorage(oldImageUrl, bucketName, supabase);
      if (!deleteResult.success) {
        console.warn('Failed to delete old image (continuing with upload):', deleteResult.error);
      }
    }
    
    // Compress image for optimal storage
    const compressed = await compressImage(file);
    
    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressed.blob);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      success: true,
      imageId: fileName,
      url: urlData.publicUrl,
    };
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
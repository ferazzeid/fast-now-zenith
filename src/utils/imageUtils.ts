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
 * Premium-only cloud storage upload
 * Free users will be blocked at the component level
 */
export const uploadImageToCloud = async (
  file: File, 
  userId: string, 
  supabase: any,
  bucketName: string = 'motivator-images'
): Promise<{ success: boolean; imageId: string; url: string; error?: string }> => {
  try {
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
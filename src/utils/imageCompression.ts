// Image compression utility for faster uploads and AI analysis
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

export const compressImage = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.7,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Cannot get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while preserving aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, `.${format}`),
            { 
              type: `image/${format}`,
              lastModified: Date.now()
            }
          );

          console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
          resolve(compressedFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};

export const getBase64FromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
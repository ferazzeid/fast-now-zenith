import { generateImage } from '@/integrations/imageGeneration';

export const generate_image = async (prompt: string, filename: string, bucket?: string): Promise<string> => {
  try {
    const imageUrl = await generateImage(prompt, filename, bucket);
    return imageUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
};
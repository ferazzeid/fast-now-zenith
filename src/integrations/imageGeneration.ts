import { supabase } from '@/integrations/supabase/client';

export const generateImage = async (prompt: string, filename: string, bucket?: string): Promise<string> => {
  try {
    // No longer supporting API keys - use shared service

    // Call the image generation edge function
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { 
        prompt,
        filename,
        bucket
      }
    });

    if (error) {
      console.error('Supabase function error details:', {
        message: error.message,
        context: error.context,
        details: error.details
      });
      throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.imageUrl) {
      throw new Error('No image URL returned from edge function');
    }
    
    return data.imageUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error('Failed to generate image');
  }
};
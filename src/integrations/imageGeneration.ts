import { supabase } from '@/integrations/supabase/client';

export const generateImage = async (prompt: string, filename: string): Promise<string> => {
  try {
    // Call the image generation edge function (you'll need to create this)
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { 
        prompt,
        filename 
      }
    });

    if (error) throw error;
    
    return data.imageUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error('Failed to generate image');
  }
};
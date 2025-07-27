import { supabase } from '@/integrations/supabase/client';

export const generateImage = async (prompt: string, filename: string): Promise<string> => {
  try {
    // Get user's OpenAI API key if they use their own
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_api_key, use_own_api_key')
      .single();

    const apiKey = profile?.use_own_api_key ? profile.openai_api_key : undefined;

    // Call the image generation edge function
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { 
        prompt,
        filename,
        apiKey
      }
    });

    if (error) throw error;
    
    return data.imageUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error('Failed to generate image');
  }
};
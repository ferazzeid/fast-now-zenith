import { supabase } from '@/integrations/supabase/client';

export const generateImage = async (prompt: string, filename: string, bucket?: string): Promise<string> => {
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
        apiKey,
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
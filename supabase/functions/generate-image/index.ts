import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173,https://fastnow.app,https://www.fastnow.app')
  .split(',')
  .map(o => o.trim());

function buildCorsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;
}

serve(async (req) => {
  console.log('Image generation function called:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body received:', { 
      hasPrompt: !!body.prompt, 
      hasFilename: !!body.filename,
      hasApiKey: !!body.apiKey,
      hasBucket: !!body.bucket,
      hasMotivatorId: !!body.motivatorId,
      hasUserId: !!body.userId
    });

    const { prompt, filename, apiKey, bucket = 'motivator-images', motivatorId, userId } = body;

    if (!prompt || !filename) {
      const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
      console.error('Missing required fields:', { prompt: !!prompt, filename: !!filename });
      return new Response(
        JSON.stringify({ error: 'Missing prompt or filename' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let generationId = null;

    // If motivatorId and userId are provided, track this generation
    if (motivatorId && userId) {
      const { data: generationData, error: generationError } = await supabase
        .from('motivator_image_generations')
        .insert({
          motivator_id: motivatorId,
          user_id: userId,
          status: 'generating',
          prompt: prompt,
          filename: filename,
          bucket: bucket
        })
        .select('id')
        .single();

      if (generationError) {
        console.error('Error creating generation record:', generationError);
      } else {
        generationId = generationData.id;
        console.log('Created generation record:', generationId);
      }
    }

    // Background generation function
    const generateImage = async () => {
      try {
        // Use provided API key or fall back to environment variable
        const openAIApiKey = apiKey || Deno.env.get('OPENAI_API_KEY');
        if (!openAIApiKey) {
          throw new Error('OpenAI API key not provided');
        }

        console.log('Generating image with prompt length:', prompt.length);

        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'hd',
            response_format: 'b64_json'
          }),
        });

        console.log('OpenAI response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          throw new Error(`Failed to generate image: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const imageBase64 = data.data[0].b64_json;
        console.log('Image generated successfully, uploading to storage...');

        // Convert base64 to blob for upload
        const imageBlob = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

        // Upload to Supabase storage - use specified bucket or default to motivator-images
        const targetBucket = bucket || 'motivator-images';
        console.log('Uploading to bucket:', targetBucket);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(filename, imageBlob, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload image: ${JSON.stringify(uploadError)}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(filename);

        console.log('Image uploaded successfully:', urlData.publicUrl);

        // Update generation record with success
        if (generationId) {
          await supabase
            .from('motivator_image_generations')
            .update({
              status: 'completed',
              image_url: urlData.publicUrl,
              completed_at: new Date().toISOString()
            })
            .eq('id', generationId);

          console.log('Updated generation record with success:', generationId);
        }

        // Update the motivator with the new image URL if provided
        if (motivatorId) {
          await supabase
            .from('motivators')
            .update({ image_url: urlData.publicUrl })
            .eq('id', motivatorId);

          console.log('Updated motivator with new image URL:', motivatorId);
        }

        return urlData.publicUrl;
      } catch (error) {
        console.error('Background generation error:', error);
        
        // Update generation record with failure
        if (generationId) {
          await supabase
            .from('motivator_image_generations')
            .update({
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', generationId);

          console.log('Updated generation record with failure:', generationId);
        }
        
        throw error;
      }
    };

    // If we have tracking info, run in background and return immediately
    if (motivatorId && userId) {
      // Use EdgeRuntime.waitUntil for true background processing
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(generateImage());
      } else {
        // Fallback for environments without EdgeRuntime
        generateImage().catch(console.error);
      }

      const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
      return new Response(
        JSON.stringify({ 
          message: 'Image generation started in background',
          generationId: generationId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 202 // Accepted
        }
      );
    } else {
      // For backward compatibility, run synchronously
      const imageUrl = await generateImage();
      const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in generate-image function:', error);
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
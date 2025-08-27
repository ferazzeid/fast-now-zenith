import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { 
  PROTECTED_CORS_HEADERS, 
  PROTECTED_OPENAI_CONFIG, 
  resolveOpenAIApiKey,
  logConfigurationState,
  SECURITY_NOTICE
} from '../_shared/protected-config.ts';

// 🔒 PROTECTED: Use standardized CORS headers
const corsHeaders = PROTECTED_CORS_HEADERS;

// 📊 Log configuration state for debugging
logConfigurationState();

serve(async (req) => {
  console.log('Image generation function called:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const authUserId = userData.user.id;

    // Get user profile for access control
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, subscription_status, access_level, premium_expires_at')
      .eq('user_id', authUserId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Check if premium access is expired (except for admins)
    const isExpired = profile.premium_expires_at ? 
      new Date(profile.premium_expires_at) < new Date() : false;
    const effectiveLevel = isExpired && profile.access_level !== 'admin' ? 
      'trial' : profile.access_level;

    // Get both trial and premium limits from settings
    const { data: settings } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['trial_request_limit', 'monthly_request_limit']);

    const trialLimit = parseInt(settings?.find(s => s.setting_key === 'trial_request_limit')?.setting_value || '50');
    const premiumLimit = parseInt(settings?.find(s => s.setting_key === 'monthly_request_limit')?.setting_value || '1000');

    // Determine appropriate limit based on user tier
    let currentLimit: number;
    let limitType: string;

    if (effectiveLevel === 'admin') {
      console.log('Admin user - unlimited AI access');
      currentLimit = Infinity;
      limitType = 'unlimited';
    } else if (effectiveLevel === 'premium') {
      currentLimit = premiumLimit;
      limitType = 'premium';
    } else {
      // Trial users (includes expired premium users)
      currentLimit = trialLimit;
      limitType = 'trial';
    }

    // Check access permissions and limits
    if (effectiveLevel === 'free') {
      throw new Error('AI features are only available to premium users. Start your free trial or upgrade to continue.');
    }

    // Check limits (skip for admin)
    if (effectiveLevel !== 'admin' && profile.monthly_ai_requests >= currentLimit) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      const resetDateString = resetDate.toLocaleDateString();
      
      if (limitType === 'trial') {
        throw new Error(`You've used all ${currentLimit} trial AI requests this month. Upgrade to premium for ${premiumLimit} monthly requests. Your trial limit will reset on ${resetDateString}.`);
      } else {
        throw new Error(`You've used all ${currentLimit} premium AI requests this month. Your limit will reset on ${resetDateString}.`);
      }
    }

    let userProfile = profile;

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
        // 🔒 PROTECTED: Use standardized API key resolution
        const clientApiKey = req.headers.get('X-OpenAI-API-Key');
        const openAIApiKey = await resolveOpenAIApiKey(
          supabase,
          userProfile,
          apiKey,
          clientApiKey
        );

        console.log('Generating image with prompt length:', prompt.length);

        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: PROTECTED_OPENAI_CONFIG.IMAGE_MODEL,
            prompt: prompt,
            n: 1,
            size: PROTECTED_OPENAI_CONFIG.IMAGE_SIZE,
            response_format: PROTECTED_OPENAI_CONFIG.IMAGE_FORMAT
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

        // Increment usage counter (all users count against limits now)
        try {
          await supabase
            .from('profiles')
            .update({ 
              monthly_ai_requests: profile.monthly_ai_requests + 1 
            })
            .eq('user_id', authUserId);
        } catch (e) {
          console.warn('Non-blocking: failed to increment monthly_ai_requests', e);
        }

        try {
          await supabase.rpc('track_usage_event', {
            _user_id: authUserId,
            _event_type: 'image_generation',
            _requests_count: 1,
            _subscription_status: profile.subscription_status
          });
        } catch (e) {
          console.warn('Non-blocking: failed to log usage analytics', e);
        }

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
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
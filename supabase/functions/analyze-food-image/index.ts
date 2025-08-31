import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173,https://fastnow.app,https://www.fastnow.app')
  .split(',')
  .map(o => o.trim());

function buildCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Food image analysis request received');
    const { imageData, imageUrl } = await req.json();
    
    if (!imageData && !imageUrl) {
      throw new Error('No image data or URL provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://texnkijwcygodtywgedm.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not available');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const userId = userData.user.id;

    // Get user profile and check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, subscription_status, access_level, premium_expires_at')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    console.log('User access level:', profile.access_level, 'AI requests:', profile.monthly_ai_requests);

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

    // Get OpenAI API key from shared settings or environment
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      // Get from shared settings
      const { data: sharedKey } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      
      openaiApiKey = sharedKey?.setting_value;
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please contact support.');
    }

    console.log('Analyzing food image with OpenAI Vision API');

    // Prepare the image content for OpenAI
    let imageContent;
    let finalImageUrl;
    
    if (imageUrl) {
      console.log('Processing imageUrl:', imageUrl.substring(0, 50) + '...');
      
      if (imageUrl.startsWith('data:')) {
        // Data URL passed via imageUrl parameter - use as is
        finalImageUrl = imageUrl;
        console.log('Data URL detected in imageUrl parameter');
      } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Already absolute HTTP/HTTPS URL - use as is
        finalImageUrl = imageUrl;
        console.log('HTTP URL detected:', imageUrl);
      } else {
        // Relative path - make it absolute using Supabase storage
        finalImageUrl = `https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images${imageUrl}`;
        console.log('Relative path converted to Supabase storage URL:', finalImageUrl);
      }
      
      imageContent = { type: "image_url", image_url: { url: finalImageUrl } };
    } else if (imageData) {
      console.log('Processing imageData:', imageData.substring(0, 50) + '...');
      
      // Handle imageData - check if it's already a complete data URL
      if (imageData.startsWith('data:')) {
        // Already a complete data URL - use as is
        finalImageUrl = imageData;
        console.log('Complete data URL detected in imageData');
      } else {
        // Raw base64 - add the data URL prefix
        finalImageUrl = `data:image/jpeg;base64,${imageData}`;
        console.log('Added data URL prefix to base64 data');
      }
      
      imageContent = { type: "image_url", image_url: { url: finalImageUrl } };
    } else {
      throw new Error('No valid image data provided');
    }

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert analyzing food images. Your goals: (1) identify the food precisely (read any on-pack text/brand/flavor), (2) read nutrition labels when visible, (3) if no label, estimate from typical values and visible cues. Pay extra attention to dairy/yogurt variants (Greek, Skyr, plain vs flavored). If a fat percentage is shown (e.g., 0%, 2%, 10%), use it to adjust calories and macros.
            Return ONLY JSON with this shape:
            {
              "name": "Food name (include brand/type if visible)",
              "calories_per_100g": number,
              "carbs_per_100g": number,
              "estimated_serving_size": number, // grams
              "confidence": number, // 0-1
              "description": "Brief rationale (e.g., label read, visible yogurt 2% fat, vanilla)"
            }
            If a barcode or label text is visible, incorporate it. Always return valid JSON only, no other text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image and extract nutritional information.'
              },
              imageContent
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const analysisResult = data.choices[0].message.content;
    console.log('Analysis result:', analysisResult);

    // Try to parse the JSON response
    let nutritionData;
    try {
      nutritionData = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      
      // Enhanced fallback: handle markdown-wrapped JSON
      let cleanedResponse = analysisResult;
      
      // Strip markdown code blocks if present
      if (analysisResult.includes('```')) {
        const markdownMatch = analysisResult.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        if (markdownMatch) {
          cleanedResponse = markdownMatch[1];
        }
      }
      
      try {
        nutritionData = JSON.parse(cleanedResponse);
      } catch (secondParseError) {
        // Final fallback: extract JSON from the response
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            nutritionData = JSON.parse(jsonMatch[0]);
          } catch (thirdParseError) {
            console.error('All JSON parsing attempts failed:', { 
              original: analysisResult, 
              cleaned: cleanedResponse, 
              extracted: jsonMatch ? jsonMatch[0] : null 
            });
            throw new Error('Failed to extract valid JSON from OpenAI response');
          }
        } else {
          throw new Error('No JSON found in OpenAI response');
        }
      }
    }

    // Validate the required fields
    if (!nutritionData.name || typeof nutritionData.calories_per_100g !== 'number' || typeof nutritionData.carbs_per_100g !== 'number') {
      throw new Error('Invalid nutrition data format from OpenAI');
    }

    console.log('Successfully analyzed food image:', nutritionData);

    // Increment usage counter (all users count against limits now)
    try {
      await supabase
        .from('profiles')
        .update({ 
          monthly_ai_requests: profile.monthly_ai_requests + 1 
        })
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Non-blocking: failed to increment monthly_ai_requests', e);
    }

    try {
      await supabase.rpc('track_usage_event', {
        _user_id: userId,
        _event_type: 'food_image_analysis',
        _requests_count: 1,
        _subscription_status: profile.subscription_status
      });
    } catch (e) {
      console.warn('Non-blocking: failed to log usage analytics', e);
    }

    return new Response(
      JSON.stringify({
        name: nutritionData.name,
        calories_per_100g: Math.round(nutritionData.calories_per_100g * 100) / 100,
        carbs_per_100g: Math.round(nutritionData.carbs_per_100g * 100) / 100,
        estimated_serving_size: nutritionData.estimated_serving_size || 100,
        confidence: nutritionData.confidence || 0.8,
        description: nutritionData.description || ''
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-food-image function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
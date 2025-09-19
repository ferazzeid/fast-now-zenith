import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Utility function to capitalize food names properly
const capitalizeFoodName = (foodName: string): string => {
  if (!foodName || typeof foodName !== 'string') return '';
  
  // Words that should remain lowercase unless at the beginning
  const lowercaseWords = ['and', 'with', 'from', 'of', 'in', 'on', 'at', 'to', 'for', 'the', 'a', 'an'];
  
  return foodName
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Keep certain words lowercase unless they're the first word
      if (lowercaseWords.includes(word)) {
        return word;
      }
      
      // Capitalize other words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173,https://fastnow.app,https://www.fastnow.app')
  .split(',')
  .map(o => o.trim());

function buildCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;
}

async function buildImageAnalysisPrompt(supabase: any): Promise<string> {
  try {
    const { data: promptsData } = await supabase
      .from('ai_function_prompts')
      .select('prompt_section, prompt_content')
      .eq('function_name', 'analyze-food-image');

    const prompts = {
      food_identification: promptsData?.find(p => p.prompt_section === 'food_identification')?.prompt_content || 
        'Identify ALL visible food items in this image. Look for: (1) individual foods, (2) packaged products with labels, (3) multiple distinct items. Read any visible text/brands/flavors.',
      
      nutrition_reading: promptsData?.find(p => p.prompt_section === 'nutrition_reading')?.prompt_content ||
        'When nutrition labels are visible, read them carefully. Pay special attention to dairy variants (Greek, Skyr, plain vs flavored) and fat percentages.',
      
      fallback_estimation: promptsData?.find(p => p.prompt_section === 'fallback_estimation')?.prompt_content ||
        'For items without visible labels, estimate nutrition based on typical values. If multiple foods are visible, create separate entries for each.',
      
      output_format: promptsData?.find(p => p.prompt_section === 'output_format')?.prompt_content ||
        'Use the add_multiple_foods function to return all identified foods. Each food should have accurate nutrition per 100g and estimated serving size. Set destination to "today".'
    };

    return `You are a nutrition expert analyzing food images. ${prompts.food_identification} ${prompts.nutrition_reading} ${prompts.fallback_estimation} ${prompts.output_format}

CRITICAL: Identify ALL separate food items visible in the image. If you see multiple distinct foods, create separate entries for each one. If you see a single food item, still return it as an array with one item.`;
  } catch (error) {
    console.error('Error loading image analysis prompts, using fallback:', error);
    return `You are a nutrition expert analyzing food images. Identify ALL visible food items. Look for individual foods, packaged products with labels, and multiple distinct items. Read any visible text/brands/flavors.

When nutrition labels are visible, read them carefully. For items without visible labels, estimate nutrition based on typical values.

Use the add_multiple_foods function to return all identified foods. Each food should have accurate nutrition per 100g and estimated serving size. Set destination to "today".

CRITICAL: If multiple foods are visible, create separate entries for each one. If only one food is visible, still return it as an array with one item.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Food image analysis request received');
    const { imageData, imageUrl, images } = await req.json();
    
    // Support both single and multiple image formats
    if (!imageData && !imageUrl && !images) {
      throw new Error('No image data, URL, or images array provided');
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://texnkijwcygodtywgedm.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      throw new Error('Supabase configuration not available');
    }
    
    
    // Create client for JWT validation (use service role if available, otherwise anon)
    const authClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // Create data client with service role for database operations
    const dataClient = supabaseServiceKey ? 
      createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } }) :
      authClient;

    // Enhanced authentication validation
    const authHeader = req.headers.get('Authorization');
    console.log('=== Authentication Check ===');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header format valid:', authHeader?.startsWith('Bearer '));
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          details: 'Please sign in to analyze food images',
          code: 'AUTH_HEADER_MISSING'
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('Invalid authorization header format');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication format',
          details: 'Authorization header must start with "Bearer "',
          code: 'AUTH_FORMAT_INVALID'
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length, 'first 20 chars:', token.substring(0, 20) + '...');

    // Validate the JWT token with detailed error handling
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    console.log('JWT Validation result:', { 
      hasUser: !!userData?.user, 
      error: userError?.message,
      errorCode: userError?.code,
      userId: userData?.user?.id,
      userEmail: userData?.user?.email 
    });

    if (userError) {
      console.error('JWT validation failed:', userError);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Authentication failed';
      let userFriendlyMessage = 'Please sign in again';
      
      if (userError.message?.includes('expired') || userError.code === 'token_expired') {
        errorMessage = 'Session expired';
        userFriendlyMessage = 'Your session has expired. Please sign in again.';
      } else if (userError.message?.includes('invalid') || userError.code === 'invalid_token') {
        errorMessage = 'Invalid session';
        userFriendlyMessage = 'Invalid session. Please sign in again.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: userFriendlyMessage,
          code: userError.code || 'AUTH_VALIDATION_FAILED'
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (!userData?.user) {
      console.error('No user found despite successful JWT validation');
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          details: 'Valid session but user not found. Please sign in again.',
          code: 'USER_NOT_FOUND'
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = userData.user.id;

    // Get user profile and check access
    const { data: profile, error: profileError } = await dataClient
      .from('profiles')
      .select('monthly_ai_requests, access_level, premium_expires_at')
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
    const { data: settings } = await dataClient
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
        throw new Error(`You've used all ${currentLimit} trial AI requests. Upgrade to premium for ${premiumLimit} monthly requests.`);
      } else {
        throw new Error(`You've used all ${currentLimit} premium AI requests this month. Your limit will reset on ${resetDateString}.`);
      }
    }

    // 🔑 Get OpenAI API key from shared settings or environment
    console.log('🔑 Resolving OpenAI API key for food analysis...');
    let openaiApiKey: string;
    
    try {
      const { data: sharedKey } = await dataClient
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      
      if (sharedKey?.setting_value) {
        openaiApiKey = sharedKey.setting_value;
        console.log('✅ Found API key in shared settings');
      } else {
        const envKey = Deno.env.get('OPENAI_API_KEY');
        if (envKey) {
          openaiApiKey = envKey;
          console.warn('⚠️ Using environment variable API key (fallback mode)');
        } else {
          throw new Error('OpenAI API key not available. Please configure a shared API key in admin settings.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to resolve OpenAI API key:', error);
      throw new Error('OpenAI API key not available. Please configure a shared API key in admin settings.');
    }

    console.log('Analyzing food image(s) with OpenAI Vision API');

    // Prepare the image content for OpenAI - support multiple images
    let imageContents = [];
    
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`Processing ${images.length} images from images array`);
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        let processedImageUrl;
        
        if (image.startsWith('data:')) {
          processedImageUrl = image;
          console.log(`Image ${i + 1}: Data URL detected`);
        } else if (image.startsWith('http://') || image.startsWith('https://')) {
          processedImageUrl = image;
          console.log(`Image ${i + 1}: HTTP URL detected`);
        } else {
          // Raw base64 - add the data URL prefix
          processedImageUrl = `data:image/jpeg;base64,${image}`;
          console.log(`Image ${i + 1}: Added data URL prefix to base64 data`);
        }
        
        imageContents.push({ type: "image_url", image_url: { url: processedImageUrl } });
      }
    } else {
      // Fallback to single image processing (backward compatibility)
      let finalImageUrl;
      
      if (imageUrl) {
        console.log('Processing imageUrl:', imageUrl.substring(0, 50) + '...');
        
        if (imageUrl.startsWith('data:')) {
          finalImageUrl = imageUrl;
          console.log('Data URL detected in imageUrl parameter');
        } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          finalImageUrl = imageUrl;
          console.log('HTTP URL detected:', imageUrl);
        } else {
          finalImageUrl = `https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images${imageUrl}`;
          console.log('Relative path converted to Supabase storage URL:', finalImageUrl);
        }
      } else if (imageData) {
        console.log('Processing imageData:', imageData.substring(0, 50) + '...');
        
        if (imageData.startsWith('data:')) {
          finalImageUrl = imageData;
          console.log('Complete data URL detected in imageData');
        } else {
          finalImageUrl = `data:image/jpeg;base64,${imageData}`;
          console.log('Added data URL prefix to base64 data');
        }
      } else {
        throw new Error('No valid image data provided');
      }
      
      imageContents.push({ type: "image_url", image_url: { url: finalImageUrl } });
    }

    // Use hardcoded model configuration
    const modelName = 'gpt-4o';
    const modelConfig = {
      model: 'gpt-4o',
      supportsTemperature: true,
      tokenParam: 'max_tokens',
      maxTokens: 4000
    };
    
    console.log(`🤖 Using model: ${modelName} for image analysis`);

    // Call OpenAI Vision API with function calling (unified with voice)
    const requestBody: any = {
      model: modelConfig.model,
      messages: [
        {
          role: 'system',
          content: await buildImageAnalysisPrompt(dataClient)
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: imageContents.length > 1 
                ? `Analyze these ${imageContents.length} food images and identify ALL food items visible across all images. The images may show the same food from different angles (like front and back of packaging) or different foods. Create entries for each separate food item you can identify.`
                : 'Analyze this food image and identify ALL food items visible. Create entries for each separate food item you can identify.'
            },
            ...imageContents
          ]
        },
        tools: [
          {
            type: "function",
            function: {
              name: "add_multiple_foods",
              description: "Add multiple food entries identified from the image",
              parameters: {
                type: "object",
                properties: {
                  foods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description: "Name of the food item (include brand/type if visible)"
                        },
                        serving_size: {
                          type: "number",
                          description: "Estimated serving size in grams"
                        },
                        calories: {
                          type: "number",
                          description: "Total calories for this serving"
                        },
                        carbs: {
                          type: "number",
                          description: "Total carbs in grams for this serving"
                        },
                        calories_per_100g: {
                          type: "number",
                          description: "Calories per 100g (for recalculation)"
                        },
                        carbs_per_100g: {
                          type: "number",
                          description: "Carbs per 100g (for recalculation)"
                        },
                        protein_per_100g: {
                          type: "number",
                          description: "Protein per 100g (optional)"
                        },
                        fat_per_100g: {
                          type: "number",
                          description: "Fat per 100g (optional)"
                        },
                        confidence: {
                          type: "number",
                          description: "Confidence score 0-1 for this identification"
                        },
                        description: {
                          type: "string",
                          description: "Brief rationale for identification"
                        }
                      },
                      required: ["name", "serving_size", "calories", "carbs", "calories_per_100g", "carbs_per_100g", "confidence"]
                    }
                  },
                  destination: {
                    type: "string",
                    enum: ["today", "template"],
                    description: "Where to add the foods - 'today' for today's entries"
                  }
                },
                required: ["foods", "destination"]
              }
            }
          }
        ],
        tool_choice: "auto"
      };

      // Add model-specific parameters
      if (modelConfig.supportsTemperature) {
        requestBody.temperature = 0.1;
      }
      
      requestBody[modelConfig.tokenParam] = Math.min(1000, modelConfig.maxTokens);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

    // Calculate actual costs from usage data
    const usage = data.usage;
    const model = data.model;
    let estimatedCost = 0;
    
    if (usage && usage.prompt_tokens && usage.completion_tokens) {
      // OpenAI pricing per 1K tokens (as of current rates)
      const pricing: Record<string, { input: number; output: number }> = {
        'gpt-4o': { input: 0.0025, output: 0.01 },
        'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
        'gpt-5-mini-2025-08-07': { input: 0.00035, output: 0.0014 },
        'gpt-5-2025-08-07': { input: 0.005, output: 0.02 }
      };
      
      const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
      estimatedCost = (usage.prompt_tokens / 1000) * modelPricing.input + 
                      (usage.completion_tokens / 1000) * modelPricing.output;
    }

    let completion = data.choices[0].message.content || '';
    let functionCall = null;

    // Extract function call (unified with voice analysis)
    if (data.choices[0].message.tool_calls && data.choices[0].message.tool_calls.length > 0) {
      const toolCall = data.choices[0].message.tool_calls[0];
      if (toolCall.type === 'function' && toolCall.function.name === 'add_multiple_foods') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          
          // Capitalize food names for consistent formatting
          if (args.foods && Array.isArray(args.foods)) {
            args.foods = args.foods.map((food: any) => ({
              ...food,
              name: capitalizeFoodName(food.name)
            }));
          }
          
          functionCall = {
            name: 'add_multiple_foods',
            arguments: args
          };

          // Log successful function call extraction
          console.log('Function call extracted:', functionCall);
        } catch (e) {
          console.error('Error parsing function arguments:', e);
          functionCall = null;
        }
      }
    }

    // If no function call was extracted, provide fallback response
    if (!functionCall) {
      console.log('No function call found, providing fallback response');
      return new Response(
        JSON.stringify({
          completion: completion || "I could not identify any food items in this image. Please try a clearer photo or add the food manually.",
          functionCall: null,
          errorType: 'no_foods_found',
          originalTranscription: 'Photo analysis'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Increment usage counter (all users count against limits now)
    try {
      await dataClient
        .from('profiles')
        .update({ 
          monthly_ai_requests: profile.monthly_ai_requests + 1 
        })
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Non-blocking: failed to increment monthly_ai_requests', e);
    }

    try {
      await dataClient.rpc('track_usage_event', {
        _user_id: userId,
        _event_type: 'food_image_analysis',
        _requests_count: 1
      });
    } catch (e) {
      console.warn('Non-blocking: failed to log usage analytics', e);
    }

    // Log detailed usage to ai_usage_logs
    try {
      await dataClient
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          request_type: 'food_image_analysis',
          model_used: model,
          tokens_used: usage?.total_tokens || 0,
          prompt_tokens: usage?.prompt_tokens || 0,
          completion_tokens: usage?.completion_tokens || 0,
          estimated_cost: estimatedCost,
          success: true,
          response_time_ms: Date.now() - new Date().getTime()
        });
    } catch (e) {
      console.warn('Non-blocking: failed to log detailed AI usage', e);
    }

    return new Response(
      JSON.stringify({
        completion: completion,
        functionCall: functionCall,
        originalTranscription: 'Photo analysis'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
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

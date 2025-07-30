import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get OpenAI API key from environment or user profile
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      // Try to get from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key, use_own_api_key')
        .eq('user_id', userData.user.id)
        .single();
      
      if (profile?.use_own_api_key && profile?.openai_api_key) {
        openaiApiKey = profile.openai_api_key;
      }
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not available');
    }

    console.log('Analyzing food image with OpenAI Vision API');

    // Prepare the image content for OpenAI
    let imageContent;
    if (imageUrl) {
      // Handle different URL types properly
      let finalImageUrl;
      if (imageUrl.startsWith('data:')) {
        // Data URL - use as is
        finalImageUrl = imageUrl;
      } else if (imageUrl.startsWith('http')) {
        // Already absolute URL - use as is
        finalImageUrl = imageUrl;
      } else {
        // Relative path - make it absolute
        finalImageUrl = `https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com${imageUrl}`;
      }
      imageContent = { type: "image_url", image_url: { url: finalImageUrl } };
    } else {
      // Handle imageData - check if it's already a complete data URL
      let finalImageData;
      if (imageData.startsWith('data:')) {
        // Already a complete data URL - use as is
        finalImageData = imageData;
        console.log('Using existing data URL format');
      } else {
        // Raw base64 - add the data URL prefix
        finalImageData = `data:image/jpeg;base64,${imageData}`;
        console.log('Added data URL prefix to base64 data');
      }
      imageContent = { type: "image_url", image_url: { url: finalImageData } };
    }

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert analyzing food images. Extract nutritional information and return it as a JSON object with the following structure:
            {
              "name": "Food name",
              "calories_per_100g": number,
              "carbs_per_100g": number,
              "estimated_serving_size": number (in grams),
              "confidence": number (0-1),
              "description": "Brief description of what you see"
            }
            
            If you can see a nutrition label, extract the exact values. If not, provide your best estimates based on typical nutritional values for the food you identify. Always return valid JSON only, no other text.`
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
      // Fallback: extract JSON from the response if it contains other text
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to extract valid JSON from OpenAI response');
      }
    }

    // Validate the required fields
    if (!nutritionData.name || typeof nutritionData.calories_per_100g !== 'number' || typeof nutritionData.carbs_per_100g !== 'number') {
      throw new Error('Invalid nutrition data format from OpenAI');
    }

    console.log('Successfully analyzed food image:', nutritionData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        nutritionData: {
          name: nutritionData.name,
          calories_per_100g: Math.round(nutritionData.calories_per_100g * 100) / 100,
          carbs_per_100g: Math.round(nutritionData.carbs_per_100g * 100) / 100,
          estimated_serving_size: nutritionData.estimated_serving_size || 100,
          confidence: nutritionData.confidence || 0.8,
          description: nutritionData.description || ''
        }
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
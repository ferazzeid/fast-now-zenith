import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('[INFO] Add food entry request received');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    const { name, serving_size, calories, carbs, consumed = false } = await req.json();

    if (!name || !serving_size) {
      throw new Error('Food name and serving size are required');
    }

    console.log(`[INFO] Adding food entry for user ${userId}:`, { name, serving_size, calories, carbs });

    // If no calories or carbs provided, try to use AI to estimate
    let finalCalories = calories || 0;
    let finalCarbs = carbs || 0;

    if (!calories || !carbs) {
      try {
        console.log('[INFO] Attempting AI nutrition estimation');
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        
        if (OPENAI_API_KEY) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a nutrition expert. Provide accurate calorie and carb estimates for foods. Return only a JSON object with "calories" and "carbs" fields as numbers.'
                },
                {
                  role: 'user',
                  content: `Estimate calories and carbs for ${serving_size}g of ${name}. Return JSON only.`
                }
              ],
              max_tokens: 100,
              temperature: 0.1
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            const content = aiData.choices[0]?.message?.content;
            
            try {
              const nutrition = JSON.parse(content);
              if (nutrition.calories && !calories) finalCalories = nutrition.calories;
              if (nutrition.carbs && !carbs) finalCarbs = nutrition.carbs;
              console.log('[INFO] AI nutrition estimate:', nutrition);
            } catch (parseError) {
              console.log('[WARN] Could not parse AI nutrition response');
            }
          }
        }
      } catch (aiError) {
        console.log('[WARN] AI nutrition estimation failed, using defaults');
      }
    }

    // Create food entry
    const { data: foodEntry, error } = await supabase
      .from('food_entries')
      .insert([
        {
          user_id: userId,
          name: name,
          serving_size: parseFloat(serving_size),
          calories: finalCalories,
          carbs: finalCarbs,
          consumed: consumed
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('[ERROR] Failed to create food entry:', error);
      throw error;
    }

    console.log('[INFO] Food entry created successfully:', foodEntry);

    return new Response(JSON.stringify({ 
      success: true,
      food_entry: foodEntry,
      ai_enhanced: finalCalories !== calories || finalCarbs !== carbs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ERROR] Add food entry failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
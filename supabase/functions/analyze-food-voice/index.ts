import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { 
  PROTECTED_CORS_HEADERS, 
  PROTECTED_OPENAI_CONFIG, 
  resolveOpenAIApiKey
} from '../_shared/protected-config.ts';

const corsHeaders = PROTECTED_CORS_HEADERS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      throw new Error('Invalid user token');
    }

    const userId = user.user.id;

    // Get user profile for access control
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Check access permissions
    const isExpired = profile.premium_expires_at ? 
      new Date(profile.premium_expires_at) < new Date() : false;
    const effectiveLevel = isExpired && profile.access_level !== 'admin' ? 
      'trial' : profile.access_level;

    if (effectiveLevel === 'free') {
      return new Response(
        JSON.stringify({ 
          error: 'AI features are only available to premium users. Start your free trial or upgrade to continue.',
          limit_reached: true,
          current_tier: 'free'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OpenAI API key
    const openAIApiKey = await resolveOpenAIApiKey(supabase);

    // Build food context for better recognition
    const today = new Date().toISOString().split('T')[0];
    
    // Get user's food library
    const { data: userFoods } = await supabase
      .from('user_foods')
      .select('name, calories_per_100g, carbs_per_100g')
      .eq('user_id', userId);

    // Get recent foods (last 30 days)
    const { data: recentEntries } = await supabase
      .from('food_entries')
      .select('name, calories, carbs, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Process recent foods (group by name, get most recent)
    const recentFoodsMap = new Map();
    recentEntries?.forEach(entry => {
      const key = entry.name.toLowerCase();
      if (!recentFoodsMap.has(key) || new Date(entry.created_at) > new Date(recentFoodsMap.get(key).created_at)) {
        recentFoodsMap.set(key, entry);
      }
    });
    const recentFoodsArray = Array.from(recentFoodsMap.values()).slice(0, 20);

    // Build food context for better recognition
    const foodLibraryContext = userFoods && userFoods.length > 0 
      ? `\n\nUser's Personal Food Library: ${userFoods.map(f => `${f.name}: ${f.calories_per_100g} cal/100g, ${f.carbs_per_100g}g carbs/100g`).join('; ')}`
      : '';

    const recentFoodsContext = recentFoodsArray.length > 0
      ? `\n\nRecent Foods (last 30 days): ${recentFoodsArray.map(f => `${f.name}: ${f.calories} cal, ${f.carbs}g carbs`).join('; ')}`
      : '';

    // Create focused system message for food parsing
    const systemMessage = `You are a focused food tracking assistant. Extract ONLY the food items mentioned by the user and return them with accurate nutrition data.

MANDATORY FUNCTION CALLING: You MUST use the add_multiple_foods function for ANY food request.

CRITICAL QUANTITY RULES:
- COUNT + FOOD = MULTIPLE ENTRIES: "3 yogurts", "5 eggs" → Create EXACTLY that number of separate entries
- WEIGHT + FOOD = SINGLE ENTRY: "1kg cucumbers", "500g chicken" → Create ONE entry with that serving size
- MIXED REQUESTS: "3 yogurts, 1kg cucumbers, 5 apples" → 3 yogurt entries + 1 cucumber entry (1000g) + 5 apple entries = 9 total entries

NUTRITION ACCURACY: Provide realistic, non-zero calories and carbs using USDA database knowledge:
- 100g apple = ~52 cal, 14g carbs
- 100g chicken breast = ~165 cal, 0g carbs  
- 100g Greek yogurt = ~100 cal, 6g carbs
Scale proportionally by serving size.

USER FOOD CONTEXT:${foodLibraryContext}${recentFoodsContext}

Parse the food items from: "${message}"`;

    // OpenAI API call with function calling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PROTECTED_OPENAI_CONFIG.MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "add_multiple_foods",
              description: "Add food entries to the user's food log with accurate nutrition estimation",
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
                          description: "Name of the food item"
                        },
                        serving_size: {
                          type: "number",
                          description: "Serving size in grams"
                        },
                        calories: {
                          type: "number",
                          description: "Total calories for this serving"
                        },
                        carbs: {
                          type: "number",
                          description: "Total carbs in grams for this serving"
                        }
                      },
                      required: ["name", "serving_size", "calories", "carbs"]
                    }
                  },
                  destination: {
                    type: "string",
                    enum: ["today", "template"],
                    description: "Where to add the foods - 'today' for today's entries or 'template' for daily template"
                  }
                },
                required: ["foods", "destination"]
              }
            }
          }
        ],
        tool_choice: "auto",
        max_completion_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const result = await response.json();
    console.log('OpenAI Response:', JSON.stringify(result, null, 2));

    let completion = result.choices[0].message.content || '';
    let functionCall = null;

    // Extract function call
    if (result.choices[0].message.tool_calls && result.choices[0].message.tool_calls.length > 0) {
      const toolCall = result.choices[0].message.tool_calls[0];
      if (toolCall.type === 'function' && toolCall.function.name === 'add_multiple_foods') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          functionCall = {
            name: 'add_multiple_foods',
            arguments: args
          };

          // Validate nutrition data
          let nutritionValid = true;
          const invalidFoods: string[] = [];

          if (args.foods && Array.isArray(args.foods)) {
            for (const food of args.foods) {
              if (!food.calories || food.calories <= 0 || !food.carbs || food.carbs < 0) {
                nutritionValid = false;
                invalidFoods.push(food.name);
              }
            }
          }

          if (!nutritionValid) {
            return new Response(
              JSON.stringify({
                completion: `I need more details about these foods to provide accurate nutrition information: ${invalidFoods.join(', ')}. Could you be more specific?`,
                functionCall: null,
                validation_error: true,
                invalid_foods: invalidFoods
              }),
              { 
                headers: { 
                  ...corsHeaders, 
                  'Content-Type': 'application/json' 
                } 
              }
            );
          }
        } catch (e) {
          console.error('Error parsing function arguments:', e);
          functionCall = null;
        }
      }
    }

    return new Response(
      JSON.stringify({
        completion: completion,
        functionCall: functionCall
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-food-voice function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        completion: "I'm having trouble processing your food request. Please try again."
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
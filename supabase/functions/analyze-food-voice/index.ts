import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let userId: string | null = null;
  let message: string | null = null;

  try {
    const requestData = await req.json();
    message = requestData.message;
    
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

    // Get OpenAI API key from shared settings or environment
    let openAIApiKey: string;
    try {
      const { data: sharedKey } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      
      if (sharedKey?.setting_value) {
        openAIApiKey = sharedKey.setting_value;
      } else {
        const envKey = Deno.env.get('OPENAI_API_KEY');
        if (envKey) {
          openAIApiKey = envKey;
        } else {
          throw new Error('OpenAI API key not available');
        }
      }
    } catch (error) {
      throw new Error('OpenAI API key not available');
    }

    // No food context - keep it simple

    // Load prompts from database with fallbacks
    const { data: promptsData } = await supabase
      .from('ai_function_prompts')
      .select('prompt_section, prompt_content')
      .eq('function_name', 'analyze-food-voice');

    // Build system message from database prompts with fallbacks
    const prompts = {
      base_prompt: promptsData?.find(p => p.prompt_section === 'base_prompt')?.prompt_content || 
        'You are a food nutrition analyzer. Your job is to analyze user food input and create appropriate food entries with accurate nutritional information.',
      
      partial_recognition_rules: promptsData?.find(p => p.prompt_section === 'partial_recognition_rules')?.prompt_content ||
        'PARTIAL RECOGNITION HANDLING:\n- Process ALL recognizable foods normally with full nutrition data\n- For unrecognized items, create individual entries with needsManualInput: true\n- NEVER treat an entire food list as one item due to partial recognition failure',
      
      composite_rules: promptsData?.find(p => p.prompt_section === 'composite_rules')?.prompt_content || 
        'COMPOSITE FOOD INTELLIGENCE:\n- "Omelette from X, Y, Z" = ONE omelette entry (combine all ingredients nutritionally)\n- "Sandwich with X" = ONE sandwich entry (bread + filling combined)\n- "Salad with X, Y" = ONE salad entry (all components combined)\n- "Pancakes with syrup" = ONE pancake entry (including syrup)',
      
      portion_estimation: promptsData?.find(p => p.prompt_section === 'portion_estimation')?.prompt_content ||
        'PORTION ESTIMATION (convert to grams):\n- "handful of cheese/nuts" = 30g\n- "handful of mushrooms/vegetables" = 40g\n- "handful of berries" = 80g\n- "slice of bread" = 25g\n- "slice of cheese" = 20g\n- "piece of chicken breast" = 120g\n- "egg" = 50g each\n- When amount unclear, use realistic portion sizes',
      
      nutrition_calculation: promptsData?.find(p => p.prompt_section === 'nutrition_calculation')?.prompt_content ||
        'NUTRITION CALCULATION:\n- For composite dishes, calculate combined nutrition of all ingredients\n- Account for cooking methods (oil absorption, water loss, etc.)\n- Use realistic calorie densities per 100g',
      
      deduplication_logic: promptsData?.find(p => p.prompt_section === 'deduplication_logic')?.prompt_content ||
        'SMART DEDUPLICATION:\n- NEVER create separate entries for ingredients of a composite dish\n- If user mentions multiple similar items, create appropriate separate entries\n- Combine obviously related ingredients into finished dishes',
      
      contextual_understanding: promptsData?.find(p => p.prompt_section === 'contextual_understanding')?.prompt_content ||
        'CONTEXTUAL UNDERSTANDING:\n- "from" indicates ingredients of a dish → combine into one entry\n- "and" between separate foods → create separate entries\n- "with" usually indicates accompaniments → combine or separate based on context'
    };

    const systemMessage = `${prompts.base_prompt}

${prompts.partial_recognition_rules}

${prompts.composite_rules}

${prompts.portion_estimation}

${prompts.nutrition_calculation}

${prompts.deduplication_logic}

${prompts.contextual_understanding}

INTERNATIONAL FOOD RECOGNITION:
- Recognize foods in ANY language (English, German, Spanish, Chinese, Arabic, etc.)
- Common international foods you should recognize:
  * German: Bratwurst (sausage ~300 cal/100g), Sauerkraut (~19 cal/100g), Schnitzel (~250 cal/100g), Strudel (~250 cal/100g)
  * Italian: Risotto (~130 cal/100g), Prosciutto (~250 cal/100g), Gelato (~200 cal/100g)
  * Asian: Kimchi (~15 cal/100g), Miso (~200 cal/100g), Tempura (~300 cal/100g)
  * Mexican: Tamales (~150 cal/100g), Churros (~400 cal/100g)
- If you recognize the food type but are unsure about the exact name, create the entry with the recognized nutritional profile
- When portion sizes are specified (e.g., "500g", "2 pieces"), use those exact amounts
- For cultural foods, provide typical nutritional values for that cuisine

LANGUAGE PROCESSING GUIDELINES:
- Process food names in their original language when possible
- If a food name contains clear portion indicators (numbers + units), extract and use them
- Common portion patterns: "500g", "2 Stück", "una porción", "一碗" (one bowl)
- When unsure about a foreign food name, use context clues and typical nutritional profiles

USER INPUT: "${message}"

ANALYZE THIS INPUT AND CREATE APPROPRIATE FOOD ENTRIES WITH PROPER INTERNATIONAL FOOD RECOGNITION.`;

    // Use hardcoded model configuration
    const modelName = 'gpt-4o-mini';
    const modelConfig = {
      model: 'gpt-4o-mini',
      supportsTemperature: true,
      tokenParam: 'max_tokens',
      maxTokens: 4000
    };
    
    console.log(`🤖 Using model: ${modelName} with config:`, modelConfig);

    // OpenAI API call with function calling
    const openaiRequestBody: any = {
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "add_multiple_foods",
            description: "Add multiple food items with their nutritional information",
            parameters: {
              type: "object",
              properties: {
                foods: {
                  type: "array",
                  items: {
                    type: "object", 
                    properties: {
                      name: { type: "string" },
                      calories: { type: "number" },
                      carbs: { type: "number" },
                      serving_size: { type: "number" }
                    },
                    required: ["name", "calories", "carbs", "serving_size"]
                  }
                }
              },
              required: ["foods"]
            }
          }
        }
      ],
      tool_choice: "auto"
    };

    // Add model-specific parameters
    if (modelConfig.supportsTemperature) {
      openaiRequestBody.temperature = 0.3;
    }
    
    openaiRequestBody[modelConfig.tokenParam] = Math.min(4000, modelConfig.maxTokens);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const result = await response.json();
    console.log('OpenAI Response:', JSON.stringify(result, null, 2));

    // Extract token usage and calculate cost
    const tokenUsage = {
      inputTokens: result.usage?.prompt_tokens || 0,
      outputTokens: result.usage?.completion_tokens || 0,
      totalTokens: result.usage?.total_tokens || 0
    };
    const estimatedCost = tokenUsage.totalTokens * 0.000015; // Approximate cost

    let completion = result.choices[0].message.content || '';
    let functionCall = null;

    // Extract and merge function calls - process ALL calls to get best data
    if (result.choices[0].message.tool_calls && result.choices[0].message.tool_calls.length > 0) {
      const toolCalls = result.choices[0].message.tool_calls.filter(
        call => call.type === 'function' && call.function.name === 'add_multiple_foods'
      );

      if (toolCalls.length > 0) {
        try {
          let bestFunctionCall = null;
          let bestScore = -1;

          // Process all tool calls to find the best one
          for (const toolCall of toolCalls) {
            const args = JSON.parse(toolCall.function.arguments);
            
            if (args.foods && Array.isArray(args.foods)) {
              // Score this call based on data completeness and user-specified portions
              let score = 0;
              let hasUserPortions = false;
              let hasValidNutrition = true;

              for (const food of args.foods) {
                // Check if serving size appears to be user-specified (not default 100g)
                if (food.serving_size && food.serving_size !== 100) {
                  hasUserPortions = true;
                  score += 10; // High priority for user portions
                }
                
                // Check nutrition validity
                if (food.calories > 0 && food.carbs >= 0) {
                  score += 5; // Points for valid nutrition
                } else {
                  hasValidNutrition = false;
                }

                // Bonus for per-100g data
                if (food.calories_per_100g > 0 && food.carbs_per_100g >= 0) {
                  score += 3;
                }
              }

              // If this call has better data, use it
              if (score > bestScore || (hasUserPortions && !bestFunctionCall)) {
                bestScore = score;
                bestFunctionCall = {
                  name: 'add_multiple_foods',
                  arguments: args
                };
              }
            }
          }

          if (bestFunctionCall) {
            // Capitalize food names for consistent formatting
            if (bestFunctionCall.arguments.foods && Array.isArray(bestFunctionCall.arguments.foods)) {
              bestFunctionCall.arguments.foods = bestFunctionCall.arguments.foods.map((food: any) => ({
                ...food,
                name: capitalizeFoodName(food.name)
              }));
            }
            
            functionCall = bestFunctionCall;

            // Validate nutrition data
            let nutritionValid = true;
            const invalidFoods: string[] = [];

            if (bestFunctionCall.arguments.foods && Array.isArray(bestFunctionCall.arguments.foods)) {
              for (const food of bestFunctionCall.arguments.foods) {
                if (!food.needsManualInput && (!food.calories || food.calories <= 0 || !food.carbs || food.carbs < 0)) {
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
          }
        } catch (e) {
          console.error('Error parsing function arguments:', e);
          functionCall = null;
        }
      }
    }

    // Enhanced fallback logic for individual food parsing
    if (!functionCall && completion && !completion.includes('validation_error')) {
      // Attempt to parse individual foods from the input
      const possibleFoods = message.split(/[,;]|and(?:\s|$)/).map(food => food.trim()).filter(food => food.length > 0);
      
      if (possibleFoods.length > 1) {
        // Multiple potential foods detected - create individual manual entries
        const fallbackFoods = possibleFoods.map(foodName => ({
          name: capitalizeFoodName(foodName),
          serving_size: 100, // Default serving size
          calories: 0, // User will need to estimate
          carbs: 0, // User will need to estimate
          calories_per_100g: 0,
          carbs_per_100g: 0,
          needsManualInput: true
        }));

        return new Response(
          JSON.stringify({
            completion: `I recognized ${possibleFoods.length} food items but need your help with nutritional information. Please review and adjust as needed.`,
            functionCall: {
              name: 'add_multiple_foods',
              arguments: {
                foods: fallbackFoods,
                destination: 'today'
              }
            },
            originalTranscription: message,
            fallbackCreated: true
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      } else {
        // Single unrecognized food - use original fallback
        return new Response(
          JSON.stringify({
            completion: completion,
            functionCall: null,
            errorType: 'no_foods_found',
            originalTranscription: message,
            fallbackSuggestion: {
              name: capitalizeFoodName(message.trim()),
              serving_size: 100, // Default serving size
              calories: 0, // User will need to estimate
              carbs: 0, // User will need to estimate
              needsManualInput: true
            }
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        completion: completion,
        functionCall: functionCall,
        originalTranscription: message,
        model_used: modelConfig.model,
        tokens_used: tokenUsage,
        estimated_cost: estimatedCost
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
    
    // Log error for debugging
    console.error('Failed to process voice input:', {
      userId: userId,
      messageLength: message?.length || 0,
      error: (error as Error).message
    });
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        errorType: 'analysis_failed',
        completion: "I'm having trouble processing your food request. Please try again.",
        originalTranscription: message // Include original text for fallback
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
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { 
  PROTECTED_CORS_HEADERS, 
  resolveOpenAIApiKey,
  resolveOpenAIModel,
  getModelConfig
} from '../_shared/protected-config.ts';
import { AIUsageTracker, extractTokenUsage } from '../_shared/ai-usage-tracker.ts';

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

USER INPUT: "${message}"

ANALYZE THIS INPUT AND CREATE APPROPRIATE FOOD ENTRIES.`;

    // Get OpenAI configuration
    const modelName = await resolveOpenAIModel(supabase);
    const modelConfig = getModelConfig(modelName);
    
    console.log(`🤖 Using model: ${modelName} with config:`, modelConfig);

    // OpenAI API call with function calling
    const requestBody: any = {
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
      requestBody.temperature = 0.3;
    }
    
    requestBody[modelConfig.tokenParam] = Math.min(4000, modelConfig.maxTokens);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    
    // Try to log the error if we have user context
    try {
      if (userId) {
        const usageTracker = new AIUsageTracker(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await usageTracker.logChatCompletion({
          userId: userId,
          featureType: 'voice_analysis',
          modelName: 'unknown',
          inputTokens: 0,
          outputTokens: 0,
          success: false,
          errorMessage: (error as Error).message,
          metadata: { message_length: message?.length || 0 }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
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
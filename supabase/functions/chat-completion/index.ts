import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('No messages provided');
    }

    // Initialize Supabase client
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

    // Get user profile and check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, use_own_api_key, openai_api_key, subscription_status')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    // Get user's food library for context
    const { data: userFoods } = await supabase
      .from('user_foods')
      .select('name, calories_per_100g, carbs_per_100g')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('name');

    // Get global settings for limits and chat behavior
    const { data: settings } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['free_request_limit', 'monthly_request_limit', 'food_chat_strict_mode', 'food_chat_redirect_message', 'food_chat_allowed_topics']);

    const freeLimit = parseInt(settings?.find(s => s.setting_key === 'free_request_limit')?.setting_value || '50');
    const monthlyLimit = parseInt(settings?.find(s => s.setting_key === 'monthly_request_limit')?.setting_value || '1000');
    
    // Chat behavior settings
    const strictMode = settings?.find(s => s.setting_key === 'food_chat_strict_mode')?.setting_value === 'true';
    const redirectMessage = settings?.find(s => s.setting_key === 'food_chat_redirect_message')?.setting_value || 'I\'m your food tracking assistant. Let\'s focus on food and nutrition topics!';
    const allowedTopics = settings?.find(s => s.setting_key === 'food_chat_allowed_topics')?.setting_value?.split(',') || [];

    // Check if user has reached their limit (unless using own API key)
    if (!profile.use_own_api_key) {
      const userLimit = profile.subscription_status === 'active' ? monthlyLimit : freeLimit;
      if (profile.monthly_ai_requests >= userLimit) {
        throw new Error(`Monthly request limit of ${userLimit} reached. Please upgrade your subscription or use your own API key.`);
      }
    }

    // Get API key - either from user's own key or from headers
    const clientApiKey = req.headers.get('X-OpenAI-API-Key');
    const OPENAI_API_KEY = profile.use_own_api_key ? profile.openai_api_key : clientApiKey;

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build enhanced system prompt with user's food library and chat guardrails
    let systemPrompt = `You are a food tracking assistant. Help users log their meals, analyze nutrition, and manage their food library.`;
    
    // Add user's food library context
    if (userFoods && userFoods.length > 0) {
      const foodLibraryContext = userFoods.map(food => 
        `${food.name}: ${food.calories_per_100g} cal, ${food.carbs_per_100g}g carbs per 100g`
      ).join(', ');
      systemPrompt += `\n\nUser's saved food library: ${foodLibraryContext}. When the user mentions these foods, use the exact nutritional values from their library.`;
    }
    
    // Add chat guardrails
    if (strictMode) {
      systemPrompt += `\n\nIMPORTANT: Keep all conversations focused on food, nutrition, meals, calories, carbs, diet, health, cooking, ingredients, and recipes. If the user asks about unrelated topics, politely redirect them with: "${redirectMessage}"`;
    }
    
    // Enhance messages with system prompt
    const enhancedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Send to OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: enhancedMessages,
        stream: stream,
        temperature: 0.7,
        max_tokens: 1000,
        tools: [
          {
            type: "function",
            function: {
              name: "create_motivator",
              description: "Create a new motivational message for the user",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "A short, inspiring title for the motivator (max 50 characters)"
                  },
                  content: {
                    type: "string", 
                    description: "The main motivational content or message (max 200 characters)"
                  },
                  category: {
                    type: "string",
                    enum: ["personal", "health", "achievement", "mindset"],
                    description: "The category that best fits this motivator"
                  }
                },
                required: ["title", "content"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "add_multiple_foods",
              description: "Add multiple food entries to the user's food log at once",
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
                          description: "Number of calories in this serving"
                        },
                        carbs: {
                          type: "number",
                          description: "Number of carbs in grams in this serving"
                        },
                        consumed: {
                          type: "boolean",
                          description: "Whether this food was actually consumed"
                        }
                      },
                      required: ["name", "serving_size", "calories", "carbs"]
                    },
                    description: "Array of food items to add"
                  }
                },
                required: ["foods"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "add_food_entry",
              description: "Add a single food entry to the user's food log",
              parameters: {
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
                    description: "Number of calories in this serving"
                  },
                  carbs: {
                    type: "number",
                    description: "Number of carbs in grams in this serving"
                  },
                  consumed: {
                    type: "boolean",
                    description: "Whether this food was actually consumed"
                  }
                },
                required: ["name", "serving_size", "calories", "carbs"]
              }
            }
          }
        ],
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Increment usage counter (only if not using own API key)
    if (!profile.use_own_api_key) {
      await supabase
        .from('profiles')
        .update({ 
          monthly_ai_requests: profile.monthly_ai_requests + 1 
        })
        .eq('user_id', userId);

      // Log usage analytics
      await supabase.rpc('track_usage_event', {
        _user_id: userId,
        _event_type: 'chat_completion',
        _requests_count: 1,
        _subscription_status: profile.subscription_status
      });
    }

    if (stream) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Return non-streaming response
      const result = await response.json();
      
      // Check if there's a function call in the response
      let functionCall = null;
      if (result.choices?.[0]?.message?.tool_calls?.[0]) {
        const toolCall = result.choices[0].message.tool_calls[0];
        if (toolCall.type === 'function') {
          functionCall = {
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          };
        }
      }
      
      // Format response to match expected structure
      let completion = result.choices?.[0]?.message?.content || '';
      
      // Round decimal numbers for calories and carbs to whole numbers
      completion = completion.replace(/(\d+)\.(\d+)\s*(calories?|cal|carbs?|grams?)/gi, (match, whole, decimal, unit) => {
        return `${Math.round(parseFloat(whole + '.' + decimal))} ${unit}`;
      });
      
      const formattedResult = {
        completion: completion,
        functionCall: functionCall
      };
      
      return new Response(
        JSON.stringify(formattedResult),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
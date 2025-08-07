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
    const { messages, stream = false } = await req.json();
    
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

    // Get user profile and food library for enhanced context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Check request limits for non-API key users
    if (!profile.use_own_api_key) {
      const requestLimit = profile.user_tier === 'paid_user' ? 500 : 15;
      if (profile.monthly_ai_requests >= requestLimit) {
        return new Response(
          JSON.stringify({ error: `Request limit reached (${requestLimit}/month)` }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Get API key
    const openaiApiKey = profile.openai_api_key || Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Get user's food library for enhanced context
    const { data: userFoods } = await supabase
      .from('user_foods')
      .select('name, calories_per_100g, carbs_per_100g')
      .eq('user_id', userId);

    // Get global settings for chat guardrails
    const { data: globalSettings } = await supabase
      .from('general_settings')
      .select('setting_value')
      .eq('setting_key', 'food_chat_guardrails')
      .single();

    const foodLibraryContext = userFoods && userFoods.length > 0 
      ? `\n\nUser's Food Library (for reference): ${userFoods.map(f => `${f.name}: ${f.calories_per_100g} cal/100g, ${f.carbs_per_100g}g carbs/100g`).join('; ')}`
      : '';

    const guardrailsContext = globalSettings?.setting_value?.guardrails 
      ? `\n\nChat Guardrails: ${globalSettings.setting_value.guardrails}`
      : '';

    // Enhanced system message
    const enhancedSystemMessage = `${messages[0]?.content || ''}${foodLibraryContext}${guardrailsContext}`;
    
    const systemMessages = [
      { role: 'system', content: enhancedSystemMessage },
      ...messages.slice(1)
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: systemMessages,
        tools: [
          {
            type: "function",
            function: {
              name: "add_multiple_foods",
              description: "Add multiple food entries to the user's food log",
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
                        }
                      },
                      required: ["name", "serving_size", "calories", "carbs"]
                    }
                  }
                },
                required: ["foods"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "create_motivator",
              description: "Create a personalized motivator for the user",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Short, punchy title for the motivator (3-8 words)"
                  },
                  content: {
                    type: "string", 
                    description: "Compelling motivational content that addresses the user's specific situation"
                  },
                  category: {
                    type: "string",
                    description: "Category of motivation (health, appearance, confidence, performance, etc.)"
                  }
                },
                required: ["title", "content"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "create_multiple_motivators",
              description: "Create multiple motivators from user's goals and aspirations",
              parameters: {
                type: "object",
                properties: {
                  motivators: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "Short, punchy title for the motivator (3-8 words)"
                        },
                        content: {
                          type: "string",
                          description: "Compelling motivational content that addresses the user's specific situation"
                        },
                        category: {
                          type: "string",
                          description: "Category of motivation (health, appearance, confidence, performance, etc.)"
                        }
                      },
                      required: ["title", "content"]
                    }
                  }
                },
                required: ["motivators"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "search_foods_for_edit",
              description: "Search for foods in today's entries, library, or templates to propose edits",
              parameters: {
                type: "object",
                properties: {
                  search_term: {
                    type: "string",
                    description: "Name or description of food to search for"
                  },
                  context: {
                    type: "string",
                    enum: ["today", "library", "templates"],
                    description: "Where to search for foods"
                  }
                },
                required: ["search_term", "context"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "edit_food_entry",
              description: "Edit an existing food entry from today's log with new values",
              parameters: {
                type: "object",
                properties: {
                  entry_id: {
                    type: "string",
                    description: "ID of the food entry to edit"
                  },
                  updates: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "New name for the food item"
                      },
                      serving_size: {
                        type: "number",
                        description: "New serving size in grams"
                      },
                      calories: {
                        type: "number",
                        description: "New calories for this serving"
                      },
                      carbs: {
                        type: "number",
                        description: "New carbs in grams for this serving"
                      }
                    }
                  }
                },
                required: ["entry_id", "updates"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "edit_library_food",
              description: "Edit a food item in the user's personal food library",
              parameters: {
                type: "object",
                properties: {
                  food_id: {
                    type: "string",
                    description: "ID of the library food to edit"
                  },
                  updates: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "New name for the food item"
                      },
                      calories_per_100g: {
                        type: "number",
                        description: "New calories per 100g"
                      },
                      carbs_per_100g: {
                        type: "number",
                        description: "New carbs per 100g"
                      }
                    }
                  }
                },
                required: ["food_id", "updates"]
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
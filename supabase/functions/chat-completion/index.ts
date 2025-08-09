import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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

// Simple in-memory burst limiter per user/function
const burstTracker = new Map<string, number[]>();
function checkBurstLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (burstTracker.get(key) || []).filter(ts => ts > windowStart);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  burstTracker.set(key, timestamps);
  return true;
}

const ENV = Deno.env.get('ENV') || Deno.env.get('NODE_ENV') || 'development';
const isProd = ENV === 'production';

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

    // 🔒 PROTECTED: Enforce burst limit using protected config
    if (!checkBurstLimit(`${userId}:chat-completion`, PROTECTED_OPENAI_CONFIG.BURST_LIMIT, PROTECTED_OPENAI_CONFIG.BURST_WINDOW_MS)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile and food library for enhanced context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // 🔒 PROTECTED: Check request limits using protected config
    const requestLimit = profile.user_tier === 'paid_user' ? PROTECTED_OPENAI_CONFIG.PAID_REQUEST_LIMIT : PROTECTED_OPENAI_CONFIG.FREE_REQUEST_LIMIT;
    if (profile.monthly_ai_requests >= requestLimit) {
      return new Response(
        JSON.stringify({ error: `Request limit reached (${requestLimit}/month)` }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 🔒 PROTECTED: Use standardized API key resolution
    const openaiApiKey = await resolveOpenAIApiKey(
      supabase,
      profile,
      undefined,
      req.headers.get('X-OpenAI-API-Key')
    );

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
        model: PROTECTED_OPENAI_CONFIG.CHAT_MODEL,
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
      try {
        const errorData = await response.json();
        if (!isProd) console.error('OpenAI API error:', errorData);
      } catch (_) {
        if (!isProd) console.error('OpenAI API error: non-JSON body');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

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
        _event_type: 'chat_completion',
        _requests_count: 1,
        _subscription_status: profile.subscription_status
      });
    } catch (e) {
      console.warn('Non-blocking: failed to log usage analytics', e);
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
    if (!isProd) console.error('Error in chat-completion function:', error);
    const message = isProd ? 'Internal server error' : (error as Error).message;
    return new Response(
      JSON.stringify({ error: message }),
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
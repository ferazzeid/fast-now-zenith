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

    // 🔒 Get monthly request limit from settings
    const { data: settings } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'monthly_request_limit')
      .maybeSingle();

    const monthlyLimit = parseInt(settings?.setting_value || '1000');
    
    // Free users get 0 requests (only trial users get requests)
    const userLimit = profile.user_tier === 'paid_user' ? monthlyLimit : 0;
    
    if (profile.monthly_ai_requests >= userLimit) {
      return new Response(
        JSON.stringify({ 
          error: `Monthly request limit of ${userLimit} reached. ${profile.user_tier === 'free_user' ? 'Please upgrade to continue using AI features.' : ''}`,
          limit_reached: true,
          current_tier: profile.user_tier
        }),
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

    // Get comprehensive food context for the user
    const today = new Date().toISOString().split('T')[0];
    
    // Get user's food library
    const { data: userFoods } = await supabase
      .from('user_foods')
      .select('name, calories_per_100g, carbs_per_100g')
      .eq('user_id', userId);

    // Get today's food entries
    const { data: todayEntries } = await supabase
      .from('food_entries')
      .select('id, name, calories, carbs, serving_size, consumed')
      .eq('user_id', userId)
      .eq('source_date', today);

    // Get recent foods (last 30 days, grouped by name)
    const { data: recentEntries } = await supabase
      .from('food_entries')
      .select('name, calories, carbs, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Get daily food templates
    const { data: dailyTemplates } = await supabase
      .from('daily_food_templates')
      .select('id, name, calories, carbs, serving_size')
      .eq('user_id', userId)
      .order('sort_order');

    // Get global settings for chat guardrails
    const { data: globalSettings } = await supabase
      .from('general_settings')
      .select('setting_value')
      .eq('setting_key', 'food_chat_guardrails')
      .single();

    // Process recent foods (group by name, get most recent)
    const recentFoodsMap = new Map();
    recentEntries?.forEach(entry => {
      const key = entry.name.toLowerCase();
      if (!recentFoodsMap.has(key) || new Date(entry.created_at) > new Date(recentFoodsMap.get(key).created_at)) {
        recentFoodsMap.set(key, entry);
      }
    });
    const recentFoodsArray = Array.from(recentFoodsMap.values()).slice(0, 20);

    // Build comprehensive food context
    const foodLibraryContext = userFoods && userFoods.length > 0 
      ? `\n\nUser's Personal Food Library: ${userFoods.map(f => `${f.name}: ${f.calories_per_100g} cal/100g, ${f.carbs_per_100g}g carbs/100g`).join('; ')}`
      : '';

    const todayFoodsContext = todayEntries && todayEntries.length > 0
      ? `\n\nToday's Food Entries (ID | Name | Serving | Calories | Carbs | Status): ${todayEntries.map(f => `${f.id} | ${f.name} | ${f.serving_size}g | ${f.calories} cal | ${f.carbs}g carbs | ${f.consumed ? 'consumed' : 'planned'}`).join('; ')}`
      : '';

    const recentFoodsContext = recentFoodsArray.length > 0
      ? `\n\nRecent Foods (last 30 days): ${recentFoodsArray.map(f => `${f.name}: ${f.calories} cal, ${f.carbs}g carbs`).join('; ')}`
      : '';

    const templatesContext = dailyTemplates && dailyTemplates.length > 0
      ? `\n\nDaily Food Templates (ID | Name | Serving | Calories | Carbs): ${dailyTemplates.map(t => `${t.id} | ${t.name} | ${t.serving_size}g | ${t.calories} cal | ${t.carbs}g carbs`).join('; ')}`
      : '';

    const guardrailsContext = globalSettings?.setting_value?.guardrails 
      ? `\n\nChat Guardrails: ${globalSettings.setting_value.guardrails}`
      : '';

    // Enhanced system message with comprehensive app knowledge and food access
    const appKnowledgeContext = `

APP CALCULATIONS & CONSTANTS:
- Walking speeds: Normal = 5 km/h (3.1 mph), Fast = 7 km/h (4.3 mph)
- Step estimation formula: stride = height_inches * 0.414 * speed_factor
- Calorie calculation: METs (Normal: 3.5, Fast: 4.3) * weight_kg * time_hours
- Speed factors: ≤2.5mph=0.9, ≤3.5mph=1.0, ≤4.5mph=1.1, >4.5mph=1.2

UNIT CONVERSIONS:
- Weight: 1 kg = 2.204 lbs
- Height: 1 cm = 0.393 inches, 1 inch = 2.54 cm
- Distance: 1 km = 0.621 miles, 1 mile = 1.609 km
- Volume: 1 ml = 0.034 fl oz, 1 cup = 240 ml, 1 tbsp = 15 ml

FASTING TIMELINE:
- 0-4h: Glucose depletion, digestion complete
- 4-8h: Glycogen stores depleting, insulin dropping
- 8-12h: Entering ketosis, fat oxidation increases
- 12-16h: Ketosis established, mental clarity improves
- 16-24h: Autophagy begins, cellular cleanup starts
- 24h+: Deep autophagy, growth hormone peaks

USER PROFILE:
- Weight: ${profile.weight || 'Not set'} kg
- Height: ${profile.height || 'Not set'} cm
- Daily calorie goal: ${profile.daily_calorie_goal || 'Not set'}
- Daily carb goal: ${profile.daily_carb_goal || 'Not set'}g
- Activity level: ${profile.activity_level || 'sedentary'}
- Default walking speed: ${profile.default_walking_speed || 3} mph`;

    const enhancedSystemMessage = `You are a helpful AI assistant for a fasting and health tracking app. Respond in a natural, conversational way without bullet points or numbered lists. Keep your responses concise and friendly.

CRITICAL FOOD PROCESSING RULES:
- When users mention specific food items with quantities (like "333 milliliters of Diet Pepsi", "two apples", "100g chicken"), IMMEDIATELY call add_multiple_foods function
- Do NOT ask for confirmation or engage in discussion about adding food
- Process the food information directly and call the function right away
- Only engage in conversation if the user asks questions or needs clarification after processing

${messages[0]?.content || ''}${appKnowledgeContext}${foodLibraryContext}${todayFoodsContext}${recentFoodsContext}${templatesContext}${guardrailsContext}

RESPONSE STYLE: 
- Use natural, flowing conversation 
- Avoid numbered lists, bullet points, or structured formatting
- Be conversational and helpful
- Keep responses brief but informative
- When describing multiple features, weave them into natural sentences

IMPORTANT: When users ask to edit/change/modify foods, you can find them in:
1. Today's Food Entries (with specific IDs for editing)
2. Personal Food Library (per 100g values)
3. Recent Foods (from last 30 days)
4. Daily Food Templates (with specific IDs)

For editing foods, always search across ALL these sources to find matches by name.

When explaining app calculations, use the exact formulas and constants above. Help users understand unit conversions by showing the specific numbers they need to enter in the app.`;
    
    const systemMessages = [
      { role: 'system', content: enhancedSystemMessage },
      ...messages.slice(1)
    ];

    console.log('🤖 Calling OpenAI with messages:', messages.slice(-2)); // Log last 2 messages for debugging
    
    // Prepare OpenAI request payload
    const requestPayload = {
      model: PROTECTED_OPENAI_CONFIG.CHAT_MODEL,
      messages: systemMessages,
      stream: stream,
      tools: [
          // === SESSION MANAGEMENT ===
          {
            type: "function",
            function: {
              name: "start_fasting_session",
              description: "Start a new fasting session for the user",
              parameters: {
                type: "object",
                properties: {
                  goal_hours: {
                    type: "number",
                    description: "Goal duration in hours (optional, defaults to 16)"
                  }
                },
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "stop_fasting_session",
              description: "End the current fasting session",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["complete", "cancel"],
                    description: "Whether to complete or cancel the session"
                  }
                },
                required: ["action"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "start_walking_session",
              description: "Start a new walking session",
              parameters: {
                type: "object",
                properties: {
                  speed_mph: {
                    type: "number",
                    description: "Walking speed in miles per hour (defaults to user's default speed)"
                  }
                },
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "stop_walking_session",
              description: "End the current walking session",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          // === STATUS QUERIES ===
          {
            type: "function",
            function: {
              name: "get_current_session_status",
              description: "Get status of active fasting and walking sessions",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_current_fast_duration",
              description: "Get current fasting duration if active",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_current_walk_duration",
              description: "Get current walking duration if active",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_today_deficit",
              description: "Get today's calorie deficit and progress",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          // === ADMIN FUNCTIONS ===
          {
            type: "function",
            function: {
              name: "add_admin_personal_log",
              description: "Add admin personal log entry for a specific fasting hour (admin only)",
              parameters: {
                type: "object",
                properties: {
                  hour: {
                    type: "number",
                    description: "Fasting hour to log about (1-168)"
                  },
                  log_entry: {
                    type: "string",
                    description: "Personal experience log for this hour"
                  }
                },
                required: ["hour", "log_entry"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_admin_personal_log",
              description: "Get admin personal log for specific fasting hours (admin only)",
              parameters: {
                type: "object",
                properties: {
                  hour: {
                    type: "number",
                    description: "Specific hour to get log for (optional)"
                  }
                },
                required: []
              }
            }
          },
          // === PROFILE UPDATES ===
          {
            type: "function",
            function: {
              name: "update_weight",
              description: "Update user's current weight",
              parameters: {
                type: "object",
                properties: {
                  weight_kg: {
                    type: "number",
                    description: "New weight in kilograms"
                  }
                },
                required: ["weight_kg"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "update_goal_weight",
              description: "Update user's goal weight",
              parameters: {
                type: "object",
                properties: {
                  goal_weight_kg: {
                    type: "number",
                    description: "Goal weight in kilograms"
                  }
                },
                required: ["goal_weight_kg"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "update_daily_goals",
              description: "Update user's daily calorie and carb goals",
              parameters: {
                type: "object",
                properties: {
                  daily_calorie_goal: {
                    type: "number",
                    description: "Daily calorie goal"
                  },
                  daily_carb_goal: {
                    type: "number",
                    description: "Daily carb goal in grams"
                  }
                },
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_weight_loss_projection",
              description: "Get current fat mass and 30-day weight loss projection",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          // === FOOD FUNCTIONS ===
          {
            type: "function",
            function: {
              name: "add_multiple_foods",
              description: "Add food entries to the user's food log. Create one entry per food item mentioned. Only create multiple entries when user explicitly mentions multiple items (e.g., 'two apples', 'three bananas'). For singular requests like 'a cucumber' or 'add Greek yogurt', create only ONE entry.",
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
          },
          // === FUNDAMENTAL DATA ACCESS FUNCTIONS ===
          {
            type: "function",
            function: {
              name: "get_recent_foods",
              description: "Get user's recent foods from the last 30 days",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_favorite_default_foods",
              description: "Get user's favorite default foods",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "copy_yesterday_foods",
              description: "Copy all food entries from yesterday to today",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_today_food_totals",
              description: "Get today's total calories and carbs from food entries",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_manual_calorie_burns",
              description: "Get today's manual calorie burns",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "add_manual_calorie_burn",
              description: "Add a manual calorie burn activity",
              parameters: {
                type: "object",
                properties: {
                  activity_name: {
                    type: "string",
                    description: "Name of the activity"
                  },
                  calories_burned: {
                    type: "number",
                    description: "Number of calories burned"
                  }
                },
                required: ["activity_name", "calories_burned"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_walking_sessions_today",
              description: "Get today's walking sessions",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_fasting_sessions_recent",
              description: "Get recent fasting sessions",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_daily_food_templates",
              description: "Get user's daily food templates",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          },
          // === MOTIVATOR FUNCTIONS ===
          {
            type: "function",
            function: {
              name: "edit_motivator",
              description: "Edit an existing motivator's title, content, or category",
              parameters: {
                type: "object",
                properties: {
                  motivator_id: {
                    type: "string",
                    description: "ID of the motivator to edit"
                  },
                  updates: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "New title for the motivator"
                      },
                      content: {
                        type: "string",
                        description: "New content for the motivator"
                      },
                      category: {
                        type: "string",
                        description: "New category for the motivator"
                      }
                    }
                  }
                },
                required: ["motivator_id", "updates"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "delete_motivator",
              description: "Delete a motivator by ID",
              parameters: {
                type: "object",
                properties: {
                  motivator_id: {
                    type: "string",
                    description: "ID of the motivator to delete"
                  }
                },
                required: ["motivator_id"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_user_motivators",
              description: "Get all motivators for the current user",
              parameters: {
                type: "object",
                properties: {},
                required: []
              }
            }
          }
        ],
        tool_choice: "auto"
      };

    // Log request payload for debugging
    console.log('🚀 OpenAI Request Payload:', JSON.stringify({
      model: requestPayload.model,
      messages: requestPayload.messages.map(m => ({ role: m.role, content: m.content.length > 200 ? m.content.substring(0, 200) + '...' : m.content })),
      stream: requestPayload.stream,
      tool_count: requestPayload.tools.length,
      tool_choice: requestPayload.tool_choice
    }, null, 2));

    // Validate request payload before sending
    if (!requestPayload.model) {
      throw new Error('OpenAI model not specified');
    }
    if (!requestPayload.messages || requestPayload.messages.length === 0) {
      throw new Error('No messages provided for OpenAI request');
    }
    if (!requestPayload.tools || requestPayload.tools.length === 0) {
      console.warn('⚠️ No tools provided in request - function calls will not be available');
    }

    // Validate function schemas
    for (const tool of requestPayload.tools) {
      if (tool.type === 'function') {
        const func = tool.function;
        if (!func.name || !func.parameters) {
          console.error('❌ Invalid function schema:', func);
          throw new Error(`Invalid function schema for ${func.name || 'unnamed function'}`);
        }
        
        // Validate JSON Schema structure
        if (func.parameters.type !== 'object' || !func.parameters.properties) {
          console.error('❌ Invalid function parameters schema:', func.parameters);
          throw new Error(`Invalid parameters schema for function ${func.name}`);
        }
      }
    }

    console.log('✅ Request payload validation passed');

    // Make request to OpenAI
    console.log('🤖 Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('🚨 OpenAI API error details:', JSON.stringify(errorData, null, 2));
        
        // More specific error handling for common issues
        if (errorData.error?.code === 'invalid_request_error') {
          throw new Error(`OpenAI request error: ${errorData.error.message}`);
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      } catch (parseError) {
        console.error('🚨 Failed to parse OpenAI error response:', parseError);
        const responseText = await response.text();
        console.error('🚨 Raw error response:', responseText);
        throw new Error(`OpenAI API error: ${response.status} - Unable to parse error details`);
      }
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
      console.log('🔍 OpenAI Response:', JSON.stringify(result, null, 2));
      
      // Enhanced function call detection with multiple parsing methods
      let functionCall = null;
      let completion = '';
      
      // Method 1: Standard tool_calls format (GPT-4+ with tools)
      if (result.choices?.[0]?.message?.tool_calls?.[0]) {
        console.log('📞 Processing tool_calls format...');
        const toolCall = result.choices[0].message.tool_calls[0];
        if (toolCall.type === 'function') {
          try {
            const parsedArgs = JSON.parse(toolCall.function.arguments);
            functionCall = {
              name: toolCall.function.name,
              arguments: parsedArgs
            };
            console.log('✅ Successfully parsed tool_calls function:', functionCall);
          } catch (parseError) {
            console.error('❌ Failed to parse tool_calls arguments:', parseError);
            console.error('❌ Raw arguments string:', toolCall.function.arguments);
          }
        }
      }
      
      // Method 2: Legacy function_call format (older models)
      else if (result.choices?.[0]?.message?.function_call) {
        console.log('📞 Processing legacy function_call format...');
        const funcCall = result.choices[0].message.function_call;
        try {
          const parsedArgs = JSON.parse(funcCall.arguments);
          functionCall = {
            name: funcCall.name,
            arguments: parsedArgs
          };
          console.log('✅ Successfully parsed legacy function_call:', functionCall);
        } catch (parseError) {
          console.error('❌ Failed to parse legacy function_call arguments:', parseError);
          console.error('❌ Raw arguments string:', funcCall.arguments);
        }
      }
      
      // Method 3: Content parsing fallback (if function call is in text)
      else if (result.choices?.[0]?.message?.content) {
        const content = result.choices[0].message.content;
        console.log('📞 Checking content for embedded function calls...');
        
        // Look for JSON function call patterns in content
        const functionPattern = /```json\s*{\s*"name":\s*"([^"]+)"\s*,\s*"arguments":\s*({[^}]+})\s*}\s*```/;
        const match = content.match(functionPattern);
        
        if (match) {
          try {
            const parsedArgs = JSON.parse(match[2]);
            functionCall = {
              name: match[1],
              arguments: parsedArgs
            };
            console.log('✅ Successfully parsed embedded function call:', functionCall);
          } catch (parseError) {
            console.error('❌ Failed to parse embedded function call:', parseError);
          }
        }
      }
      
      // Extract completion text
      completion = result.choices?.[0]?.message?.content || '';
      
      // Log results
      console.log('🎯 Extracted completion:', completion);
      console.log('🔧 Function call detected:', functionCall ? JSON.stringify(functionCall, null, 2) : 'None');
      
      // Validate function call if detected
      if (functionCall) {
        console.log('🔍 Validating function call...');
        
        if (!functionCall.name) {
          console.error('❌ Function call missing name');
          functionCall = null;
        } else if (!functionCall.arguments) {
          console.error('❌ Function call missing arguments');
          functionCall = null;
        } else if (typeof functionCall.arguments !== 'object') {
          console.error('❌ Function call arguments not an object');
          functionCall = null;
        } else {
          console.log('✅ Function call validation passed');
          
          // Special validation for add_multiple_foods
          if (functionCall.name === 'add_multiple_foods') {
            if (!functionCall.arguments.foods || !Array.isArray(functionCall.arguments.foods)) {
              console.error('❌ add_multiple_foods missing foods array');
              functionCall = null;
            } else if (functionCall.arguments.foods.length === 0) {
              console.error('❌ add_multiple_foods has empty foods array');
              functionCall = null;
            } else {
              console.log(`✅ add_multiple_foods has ${functionCall.arguments.foods.length} food items`);
            }
          }
        }
      }
      
      // Round decimal numbers for calories and carbs to whole numbers
      completion = completion.replace(/(\d+)\.(\d+)\s*(calories?|cal|carbs?|grams?)/gi, (match, whole, decimal, unit) => {
        return `${Math.round(parseFloat(whole + '.' + decimal))} ${unit}`;
      });
      
      const formattedResult = {
        completion: completion,
        functionCall: functionCall
      };
      
      console.log('📦 Final formatted result:', formattedResult);
      
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
    console.error('💥 Error in chat-completion function:', error);
    console.error('💥 Error stack:', (error as Error).stack);
    
    // Return user-friendly error message for function call issues
    let userMessage = "I'm having trouble processing your request. Please try again.";
    
    if ((error as Error).message.includes('OpenAI')) {
      userMessage = "I'm experiencing difficulties with AI processing. Please try your request again.";
    }
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        completion: userMessage
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
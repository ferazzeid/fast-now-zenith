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

    // Get global settings for limits
    const { data: settings } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['free_request_limit', 'monthly_request_limit']);

    const freeLimit = parseInt(settings?.find(s => s.setting_key === 'free_request_limit')?.setting_value || '50');
    const monthlyLimit = parseInt(settings?.find(s => s.setting_key === 'monthly_request_limit')?.setting_value || '1000');

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

    // Send to OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
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
              name: "add_food_entry",
              description: "Add a food entry to the user's food log",
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
      const formattedResult = {
        completion: result.choices?.[0]?.message?.content || '',
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
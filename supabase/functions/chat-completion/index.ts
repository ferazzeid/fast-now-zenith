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
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    // Get API key from request headers (client-side localStorage)
    const clientApiKey = req.headers.get('X-OpenAI-API-Key');
    
    const OPENAI_API_KEY = clientApiKey;

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client to fetch AI settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch AI configuration from database
    const { data: aiSettingsData } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'ai_system_prompt',
        'ai_model_name', 
        'ai_temperature',
        'ai_max_tokens',
        'ai_include_user_context'
      ]);

    // Parse AI settings with fallbacks
    const aiSettings = (aiSettingsData || []).reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, string>);

    const systemPrompt = aiSettings.ai_system_prompt || 'You are a helpful fasting companion AI assistant. You help users with their fasting journey by providing motivation, answering questions about fasting, and offering supportive guidance. Be encouraging, knowledgeable about fasting science, and personally supportive. Keep responses concise but warm and conversational.';
    const modelName = aiSettings.ai_model_name || 'gpt-4o-mini';
    const temperature = parseFloat(aiSettings.ai_temperature || '0.8');
    const maxTokens = parseInt(aiSettings.ai_max_tokens || '500');
    const includeUserContext = aiSettings.ai_include_user_context === 'true';

    // Build enhanced system prompt with optional user context
    let enhancedSystemPrompt = systemPrompt;
    
    if (includeUserContext) {
      const currentTime = new Date().toLocaleTimeString();
      const currentDate = new Date().toLocaleDateString();
      enhancedSystemPrompt += `\n\nCurrent context: It's ${currentTime} on ${currentDate}. Consider this timing when giving fasting advice (e.g., breaking fast times, meal planning, etc.).`;
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Define function tools for motivator management
    const tools = [
      {
        type: "function",
        function: {
          name: "create_motivator",
          description: "Create a new motivator for the user's fasting journey",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "A short, powerful title for the motivator"
              },
              content: {
                type: "string", 
                description: "The main motivational content or message"
              },
              category: {
                type: "string",
                enum: ["health", "appearance", "personal", "achievement", "relationship"],
                description: "Category that best fits this motivator"
              },
              image_suggestion: {
                type: "string",
                description: "A specific suggestion for what image would make this motivator more powerful"
              }
            },
            required: ["title", "content", "category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "suggest_motivator_ideas",
          description: "Suggest motivator ideas based on user's goals or conversation context",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    reason: { type: "string", description: "Why this motivator would be effective" },
                    category: { type: "string" }
                  }
                }
              }
            },
            required: ["suggestions"]
          }
        }
      }
    ];

    // Send to OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        tools: tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Chat completion result:', result.usage);

    const choice = result.choices[0];
    const message = choice.message;

    // Handle function calls if present
    if (message.tool_calls) {
      const functionCalls = [];
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        if (functionName === 'create_motivator') {
          // Handle motivator creation
          functionCalls.push({
            type: 'create_motivator',
            data: functionArgs
          });
        } else if (functionName === 'suggest_motivator_ideas') {
          // Handle motivator suggestions
          functionCalls.push({
            type: 'suggest_motivator_ideas',
            data: functionArgs
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          response: message.content,
          function_calls: functionCalls,
          usage: result.usage 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: message.content,
        usage: result.usage 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

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
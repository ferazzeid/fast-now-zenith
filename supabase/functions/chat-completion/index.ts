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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Chat completion result:', result.usage);

    return new Response(
      JSON.stringify({ 
        response: result.choices[0].message.content,
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
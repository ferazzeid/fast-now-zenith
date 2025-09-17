import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { 
  PROTECTED_CORS_HEADERS, 
  PROTECTED_OPENAI_CONFIG, 
  resolveOpenAIApiKey,
  logConfigurationState
} from '../_shared/protected-config.ts';

// 🔒 PROTECTED: Use standardized CORS headers  
const corsHeaders = PROTECTED_CORS_HEADERS;

// 📊 Log configuration state for debugging
logConfigurationState();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { messages, message, conversationHistory } = requestBody;
    
    // Handle both formats for future flexibility
    let processedMessages;
    if (messages) {
      processedMessages = messages;
    } else if (message && conversationHistory) {
      processedMessages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
    } else {
      throw new Error('Invalid request format: expected either messages array or message + conversationHistory');
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

    // Get user profile
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

    // Simple system message for general chat
    const systemMessage = `You are a helpful AI assistant for a fasting and health tracking app. 
    
Keep responses concise and friendly. Help users with general questions about fasting, health, and the app.
    
Note: For food tracking, users should use the dedicated food input features in the app.`;

    // OpenAI API call
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
          ...processedMessages
        ],
        max_completion_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const result = await response.json();
    const completion = result.choices[0].message.content || '';

    return new Response(
      JSON.stringify({
        completion: completion,
        functionCall: null
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
      JSON.stringify({ 
        error: (error as Error).message,
        completion: "I'm having trouble processing your request. Please try again."
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
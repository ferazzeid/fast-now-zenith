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
    console.log('Chat completion request received');
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://texnkijwcygodtywgedm.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not available');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    console.log('User authentication result:', { success: !!userData.user, error: userError?.message });
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Get user profile
    console.log('Fetching user profile for user:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, use_own_api_key, openai_api_key, subscription_status')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Profile fetch result:', { found: !!profile, error: profileError?.message });
    if (profileError) {
      console.error('Profile error details:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Get API key - either from user's own key or from headers
    const clientApiKey = req.headers.get('X-OpenAI-API-Key');
    const OPENAI_API_KEY = profile?.use_own_api_key ? profile.openai_api_key : clientApiKey;
    
    console.log('API key configuration:', { 
      useOwnKey: profile?.use_own_api_key, 
      hasClientKey: !!clientApiKey, 
      hasProfileKey: !!profile?.openai_api_key,
      finalKeyPresent: !!OPENAI_API_KEY 
    });

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare messages for OpenAI
    const systemPrompt = 'You are a helpful fasting companion AI assistant. You help users with their fasting journey by providing motivation, answering questions about fasting, and offering supportive guidance. Be encouraging, knowledgeable about fasting science, and personally supportive. Keep responses concise but warm and conversational.';
    
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Send to OpenAI Chat Completions API
    console.log('Sending request to OpenAI');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.8
      }),
    });

    console.log('OpenAI response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Chat completion successful');

    const choice = result.choices[0];
    const responseMessage = choice.message.content;

    // Track usage for non-own-API-key users
    if (profile && !profile.use_own_api_key) {
      console.log('Updating usage counter');
      try {
        await supabase
          .from('profiles')
          .update({ 
            monthly_ai_requests: (profile.monthly_ai_requests || 0) + 1 
          })
          .eq('user_id', userId);
      } catch (usageError) {
        console.error('Failed to update usage:', usageError);
        // Don't fail the request for usage tracking errors
      }
    }

    return new Response(
      JSON.stringify({ 
        response: responseMessage,
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
    console.error('Error in chat-completion function:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Return user-friendly error message
    const isAuthError = error.message.includes('authentication') || error.message.includes('authorization');
    const isRateLimitError = error.message.includes('limit');
    
    let publicMessage = 'An unexpected error occurred. Please try again later.';
    if (isAuthError) {
      publicMessage = 'Authentication required. Please sign in and try again.';
    } else if (isRateLimitError) {
      publicMessage = error.message; // Rate limit messages are safe to show
    }
    
    return new Response(
      JSON.stringify({ error: publicMessage }),
      {
        status: isAuthError ? 401 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
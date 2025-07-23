import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { audio } = await req.json();
    console.log('Received transcription request, audio data length:', audio?.length || 0);
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Get user's API key preference
    const authHeader = req.headers.get('Authorization');
    let OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    console.log('Default API key available:', !!OPENAI_API_KEY);
    
    if (authHeader) {
      console.log('Authorization header found, checking user preferences');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User lookup result:', { hasUser: !!user, userId: user?.id, userError });
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('use_own_api_key, openai_api_key')
          .eq('user_id', user.id)
          .single();

        console.log('Profile query result:', { 
          hasProfile: !!profile, 
          useOwnKey: profile?.use_own_api_key,
          hasApiKey: !!profile?.openai_api_key,
          apiKeyLength: profile?.openai_api_key?.length || 0,
          profileError 
        });

        if (profile?.use_own_api_key && profile?.openai_api_key) {
          OPENAI_API_KEY = profile.openai_api_key;
          console.log('Using user API key, length:', OPENAI_API_KEY.length);
        } else {
          console.log('Using default API key - user conditions not met');
        }
      }
    }

    if (!OPENAI_API_KEY) {
      console.error('No OpenAI API key available');
      throw new Error('OpenAI API key not configured');
    }

    // Convert base64 to binary
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Transcription result:', result);

    return new Response(
      JSON.stringify({ text: result.text }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in transcribe function:', error);
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173,https://fastnow.app,https://www.fastnow.app')
  .split(',')
  .map(o => o.trim());

const ENV = Deno.env.get('ENV') || Deno.env.get('NODE_ENV') || 'development';
const isProd = ENV === 'production';

function buildCorsHeaders(origin: string | null) {
  const allowOrigin = isProd
    ? (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
    : (origin || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
    'Access-Control-Allow-Credentials': 'true',
  } as const;
}

// isProd already defined above
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

serve(async (req) => {
  // Handle CORS preflight requests
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = 'alloy' } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
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

    // Enforce soft burst limit: 5 requests / 10 seconds per user
    if (!checkBurstLimit(`${userId}:text-to-speech`, 5, 10_000)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile and check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, subscription_status, user_tier')
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

    // Check if user has reached their limit (all users count against limits now)
    const userLimit = profile.user_tier === 'paid_user' ? monthlyLimit : freeLimit;
    if (profile.monthly_ai_requests >= userLimit) {
      throw new Error(`Monthly request limit of ${userLimit} reached. Please upgrade your subscription.`);
    }

    // Resolve API key (shared key only)
    const clientApiKey = req.headers.get('X-OpenAI-API-Key');
    let OPENAI_API_KEY = clientApiKey;
    
    if (!OPENAI_API_KEY) {
      const { data: sharedKey } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      OPENAI_API_KEY = sharedKey?.setting_value || Deno.env.get('OPENAI_API_KEY') || '';
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please contact support.');
    }

    // Send to OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (!isProd) console.error('OpenAI TTS API error:', errorData);
      } catch (_) {
        if (!isProd) console.error('OpenAI TTS API error: non-JSON body');
      }
      throw new Error(`OpenAI TTS API error: ${response.status}`);
    }

    // Convert audio buffer to base64 (process in chunks to avoid stack overflow)
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let binary = '';
    const chunkSize = 8192; // Process in chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);

    // Increment usage counter (all users count against limits now)
    try {
      await supabase
        .from('profiles')
        .update({ 
          monthly_ai_requests: profile.monthly_ai_requests + 1 
        })
        .eq('user_id', userId);

      // Log usage analytics
      await supabase.rpc('track_usage_event', {
        _user_id: userId,
        _event_type: 'text_to_speech',
        _requests_count: 1,
        _subscription_status: profile.subscription_status
      });
    } catch (e) {
      console.warn('Non-blocking: failed to increment usage tracking', e);
    }

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    if (!isProd) console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ error: isProd ? 'Internal server error' : (error as Error).message }),
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
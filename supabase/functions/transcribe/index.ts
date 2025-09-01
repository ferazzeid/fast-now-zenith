import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173,https://fastnow.app,https://www.fastnow.app')
  .split(',')
  .map(o => o.trim());

const ENV = Deno.env.get('ENV') || Deno.env.get('NODE_ENV') || 'development';
const isProd = ENV === 'production';

function buildCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
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
    console.log('Transcribe function called, method:', req.method);
    console.log('Content-Type:', req.headers.get('content-type'));
    
    // Parse request body directly
    const requestData = await req.json();
    console.log('Request data keys:', Object.keys(requestData || {}));
    
    const { audio } = requestData;
    console.log('Audio data present:', !!audio);
    console.log('Audio data length:', audio?.length || 0);
    console.log('Received transcription request, audio data length:', audio?.length || 0);
    
    if (!audio) {
      throw new Error('No audio data provided');
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
    if (!checkBurstLimit(`${userId}:transcribe`, 5, 10_000)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile and check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, subscription_status, access_level, premium_expires_at')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    console.log('User access level:', profile.access_level, 'AI requests:', profile.monthly_ai_requests);

    // Check if premium access is expired (except for admins)
    const isExpired = profile.premium_expires_at ? 
      new Date(profile.premium_expires_at) < new Date() : false;
    const effectiveLevel = isExpired && profile.access_level !== 'admin' ? 
      'free' : profile.access_level;

    // Get both trial and premium limits from settings
    const { data: settings } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['trial_request_limit', 'monthly_request_limit']);

    const trialLimit = parseInt(settings?.find(s => s.setting_key === 'trial_request_limit')?.setting_value || '50');
    const premiumLimit = parseInt(settings?.find(s => s.setting_key === 'monthly_request_limit')?.setting_value || '1000');
    
    // Determine appropriate limit based on user tier
    let currentLimit: number;
    let limitType: string;

    if (effectiveLevel === 'admin') {
      console.log('Admin user - unlimited AI access');
      currentLimit = Infinity;
      limitType = 'unlimited';
    } else if (effectiveLevel === 'premium') {
      currentLimit = premiumLimit;
      limitType = 'premium';
    } else {
      // Trial users (includes expired premium users)
      currentLimit = trialLimit;
      limitType = 'trial';
    }

    // Check access permissions and limits
    if (effectiveLevel === 'free') {
      throw new Error('AI features are only available to premium users. Start your free trial or upgrade to continue.');
    }

    // Check limits (skip for admin)
    if (effectiveLevel !== 'admin' && profile.monthly_ai_requests >= currentLimit) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      const resetDateString = resetDate.toLocaleDateString();
      
      if (limitType === 'trial') {
        throw new Error(`You've used all ${currentLimit} trial AI requests this month. Upgrade to premium for ${premiumLimit} monthly requests. Your trial limit will reset on ${resetDateString}.`);
      } else {
        throw new Error(`You've used all ${currentLimit} premium AI requests this month. Your limit will reset on ${resetDateString}.`);
      }
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
      try {
        const errorData = await response.json();
        if (!isProd) console.error('OpenAI API error:', errorData);
      } catch (_) {
        if (!isProd) console.error('OpenAI API error: non-JSON body');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    if (!isProd) console.log('Transcription result:', result);

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
        _event_type: 'transcription',
        _requests_count: 1,
        _subscription_status: profile.subscription_status
      });
    } catch (e) {
      console.warn('Non-blocking: failed to log usage analytics', e);
    }

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
    if (!isProd) console.error('Error in transcribe function:', error);
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
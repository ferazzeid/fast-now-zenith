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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  console.log('🚨 TRANSCRIBE FUNCTION CALLED - TIMESTAMP:', new Date().toISOString());
  console.log('🚨 Request method:', req.method);
  console.log('🚨 Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    console.log('🚨 Returning CORS preflight response');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Transcribe function called, method:', req.method);
    console.log('Content-Type:', req.headers.get('content-type'));
    
    // Get raw body first to debug empty requests
    const bodyText = await req.text();
    console.log('Raw body length:', bodyText.length);
    console.log('Request content-length header:', req.headers.get('content-length'));
    console.log('Request size info - URL length:', req.url.length);
    
    if (!bodyText || bodyText.trim() === '') {
      console.error('Empty request body received');
      console.error('Headers received:', Object.fromEntries(req.headers.entries()));
      return new Response(
        JSON.stringify({ 
          error: 'Empty request body', 
          details: 'No audio data received' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
      console.log('Request data parsed successfully, keys:', Object.keys(requestData || {}));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Body preview:', bodyText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON', 
          details: 'Request body is not valid JSON' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { audio } = requestData;
    console.log('Audio data present:', !!audio);
    console.log('Audio data type:', typeof audio);
    console.log('Audio data length:', audio?.length || 0);
    
    if (audio && typeof audio === 'string') {
      console.log('Audio data sample (first 50 chars):', audio.substring(0, 50));
      console.log('Audio data size in KB:', Math.round(audio.length / 1024));
    }
    
    // Validate audio data
    if (!audio) {
      console.error('No audio data provided');
      return new Response(
        JSON.stringify({ 
          error: 'No audio data provided', 
          details: 'The audio field is missing from the request' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (typeof audio !== 'string') {
      console.error('Invalid audio data type:', typeof audio);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid audio data type', 
          details: `Expected string, got ${typeof audio}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (audio.length === 0) {
      console.error('Empty audio data');
      return new Response(
        JSON.stringify({ 
          error: 'Empty audio data', 
          details: 'The audio data string is empty' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (audio.length < 1000) {
      console.error('Audio data too short:', audio.length);
      return new Response(
        JSON.stringify({ 
          error: 'Audio data too short', 
          details: `Received ${audio.length} chars, need at least 1000` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ 
          error: 'No authorization header provided', 
          details: 'Authentication required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'User not authenticated', 
          details: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = userData.user.id;

      // Enforce soft burst limit: 5 requests / 10 seconds per user
      const burstKey = `${userId}:transcribe`;
      if (!checkBurstLimit(burstKey, 5, 10_000)) {
        console.error(`🚫 Transcribe burst limit exceeded for user ${userId}. Key: ${burstKey}`);
        return new Response(JSON.stringify({ 
          error: 'Too many transcription requests. Please slow down.',
          details: 'Maximum 5 requests per 10 seconds',
          retry_after: 10
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    // Get user profile and check access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, access_level, premium_expires_at')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user profile', 
          details: 'Database error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
      console.error('User access denied - free tier');
      return new Response(
        JSON.stringify({ 
          error: 'AI features are only available to premium users', 
          details: 'Start your free trial or upgrade to continue' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check limits (skip for admin)
    if (effectiveLevel !== 'admin' && profile.monthly_ai_requests >= currentLimit) {
      console.error('User request limit exceeded:', profile.monthly_ai_requests, '>=', currentLimit);
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      const resetDateString = resetDate.toLocaleDateString();
      
      let errorMessage;
      if (limitType === 'trial') {
        errorMessage = `You've used all ${currentLimit} trial AI requests. Upgrade to premium for ${premiumLimit} monthly requests.`;
      } else {
        errorMessage = `You've used all ${currentLimit} premium AI requests this month. Your limit will reset on ${resetDateString}.`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Request limit exceeded', 
          details: errorMessage 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 🔑 Get OpenAI API key from shared settings or environment
    console.log('🔑 Resolving OpenAI API key for transcription...');
    let OPENAI_API_KEY: string;
    
    try {
      const { data: sharedKey } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      
      if (sharedKey?.setting_value) {
        OPENAI_API_KEY = sharedKey.setting_value;
        console.log('✅ Found API key in shared settings');
      } else {
        const envKey = Deno.env.get('OPENAI_API_KEY');
        if (envKey) {
          OPENAI_API_KEY = envKey;
          console.warn('⚠️ Using environment variable API key (fallback mode)');
        } else {
          throw new Error('OpenAI API key not available. Please configure a shared API key in admin settings.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to resolve OpenAI API key:', error);
      throw new Error('OpenAI API key not available. Please configure a shared API key in admin settings.');
    }

    // Convert base64 to binary with validation
    let binaryString;
    let bytes;
    try {
      console.log('Converting base64 to binary...');
      binaryString = atob(audio);
      console.log('Binary string length:', binaryString.length, 'bytes');
      
      if (binaryString.length === 0) {
        throw new Error('Decoded audio data is empty');
      }
      
      if (binaryString.length < 100) {
        throw new Error(`Decoded audio data too small: ${binaryString.length} bytes`);
      }
      
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('Audio conversion successful, final size:', bytes.length, 'bytes');
      
    } catch (decodeError) {
      console.error('Base64 decode error:', decodeError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid base64 audio data', 
          details: `Failed to decode: ${decodeError.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Send to OpenAI Whisper API
    console.log('🎤 Sending to OpenAI Whisper API...');
    const whisperStartTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const whisperEndTime = Date.now();
    console.log(`🎤 Whisper API took ${whisperEndTime - whisperStartTime}ms`);

    if (!response.ok) {
      console.error('OpenAI API error. Status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      let errorDetails;
      try {
        errorDetails = await response.json();
        console.error('OpenAI API error details:', errorDetails);
      } catch (_) {
        const errorText = await response.text();
        console.error('OpenAI API error text:', errorText);
        errorDetails = { error: errorText };
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Transcription service error', 
          details: `OpenAI API returned status ${response.status}`,
          whisper_error: errorDetails,
          processing_time_ms: whisperEndTime - whisperStartTime
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.json();
    if (!isProd) console.log('Transcription result:', result);
    
    // Check for empty or very short transcription (poor audio quality)
    const transcribedText = result.text?.trim();
    if (!transcribedText || transcribedText.length < 2) {
      console.warn('Empty or very short transcription received:', transcribedText);
      return new Response(
        JSON.stringify({ 
          error: 'Audio unclear or too quiet', 
          details: 'Please speak clearly and closer to the microphone, then try again.',
          transcription: transcribedText || ''
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate estimated cost for Whisper API
    // Whisper pricing is $0.006 per minute of audio
    const audioSizeBytes = bytes.length;
    const estimatedMinutes = audioSizeBytes / (44100 * 2 * 60); // Rough estimation based on 16-bit 44.1kHz
    const estimatedCost = Math.max(0.006 * estimatedMinutes, 0.001); // Minimum $0.001

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
        _requests_count: 1
      });
    } catch (e) {
      console.warn('Non-blocking: failed to log usage analytics', e);
    }

    // Log detailed usage to ai_usage_logs
    try {
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          request_type: 'transcription',
          model_used: 'whisper-1',
          tokens_used: 0, // Whisper doesn't use tokens
          prompt_tokens: 0,
          completion_tokens: 0,
          estimated_cost: estimatedCost,
          success: true,
          response_time_ms: Date.now() - new Date().getTime()
        });
    } catch (e) {
      console.warn('Non-blocking: failed to log detailed AI usage', e);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173,https://fastnow.app,https://www.fastnow.app')
  .split(',')
  .map(o => o.trim());

function buildCorsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  } as const;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Generate a short-lived connection token (valid for 60 seconds)
    const connectionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds from now

    // Store the connection token in the database
    const { error: insertError } = await supabase
      .from('connection_tokens')
      .insert({
        token: connectionToken,
        user_id: user.id,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error storing connection token:', insertError);
      return new Response("Internal server error", { status: 500 });
    }

    // Clean up expired tokens (optional cleanup)
    await supabase
      .from('connection_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(JSON.stringify({ 
      connection_token: connectionToken,
      expires_at: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in connection-token function:', error);
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(`Error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('[INFO] Start walking session request received');
    
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
    const { speed_mph = 3 } = await req.json();

    console.log(`[INFO] Starting walking session for user ${userId} at ${speed_mph} mph`);

    // End any existing active sessions first
    const { error: endError } = await supabase
      .from('walking_sessions')
      .update({ 
        status: 'completed',
        end_time: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (endError) {
      console.error('[ERROR] Failed to end existing sessions:', endError);
    }

    // Create new walking session
    const { data: newSession, error } = await supabase
      .from('walking_sessions')
      .insert([
        {
          user_id: userId,
          start_time: new Date().toISOString(),
          speed_mph: speed_mph,
          status: 'active',
          session_state: 'active',
          total_pause_duration: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('[ERROR] Failed to create walking session:', error);
      throw error;
    }

    console.log('[INFO] Walking session started successfully:', newSession.id);

    return new Response(JSON.stringify({ 
      success: true,
      walking_session: newSession 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ERROR] Start walking session failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
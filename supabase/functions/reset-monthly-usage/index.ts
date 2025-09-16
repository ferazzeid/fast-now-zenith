import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting monthly usage reset...');

    // Get current date for next reset
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Reset monthly usage only for active premium users who have passed their reset date
    const { data, error } = await supabase
      .from('profiles')
      .update({
        monthly_ai_requests: 0,
        ai_requests_reset_date: nextMonth.toISOString()
      })
      .eq('access_level', 'premium')
      .gt('premium_expires_at', now.toISOString())
      .lte('ai_requests_reset_date', now.toISOString());

    if (error) {
      console.error('Error resetting monthly usage:', error);
      throw error;
    }

    console.log('Monthly usage reset completed');

    // Log the reset event
    await supabase.rpc('track_usage_event', {
      _user_id: null,
      _event_type: 'monthly_reset',
      _requests_count: null,
      _subscription_status: 'system'
    });

    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(
      JSON.stringify({ 
        message: 'Monthly usage reset completed',
        resetCount: data?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in reset-monthly-usage function:', error);
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
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
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
    console.log('[INFO] End walking session request received');
    
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
    const { session_id } = await req.json();

    console.log(`[INFO] Ending walking session ${session_id} for user ${userId}`);

    // Get the session to calculate calories and distance
    const { data: session, error: fetchError } = await supabase
      .from('walking_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !session) {
      throw new Error('Walking session not found');
    }

    // Calculate session duration and calories
    const endTime = new Date();
    const startTime = new Date(session.start_time);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60) - (session.total_pause_duration || 0);
    const durationHours = durationMinutes / 60;
    
    // Simple calorie calculation (can be enhanced later)
    const caloriesPerHour = session.speed_mph * 50; // Rough estimate
    const caloriesBurned = Math.round(durationHours * caloriesPerHour);
    
    // Distance calculation
    const distance = durationHours * session.speed_mph;

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from('walking_sessions')
      .update({
        status: 'completed',
        end_time: endTime.toISOString(),
        calories_burned: caloriesBurned,
        distance: distance,
        session_state: 'completed'
      })
      .eq('id', session_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[ERROR] Failed to update walking session:', updateError);
      throw updateError;
    }

    console.log('[INFO] Walking session ended successfully:', updatedSession);

    return new Response(JSON.stringify({ 
      success: true,
      walking_session: updatedSession 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ERROR] End walking session failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
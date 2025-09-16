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
    const { timeframe = 'last_hour' } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
      case 'last_10_minutes':
        startTime = new Date(now.getTime() - 10 * 60 * 1000);
        break;
      case 'last_hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'last_24_hours':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }
    
    // Get AI usage logs for the user
    const { data: aiUsage, error: aiError } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (aiError) {
      console.error('Error fetching AI usage logs:', aiError);
    }

    // Get recent food entries 
    const { data: foodEntries, error: foodError } = await supabase
      .from('food_entries')
      .select('id, name, calories, carbs, serving_size, created_at')
      .eq('user_id', userId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (foodError) {
      console.error('Error fetching food entries:', foodError);
    }

    // Get user profile for context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_ai_requests, access_level, premium_expires_at')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Analyze patterns
    const transcriptionRequests = aiUsage?.filter(log => log.request_type === 'transcription') || [];
    const chatRequests = aiUsage?.filter(log => log.request_type === 'chat_completion') || [];
    
    const analysis = {
      timeframe,
      user_id: userId,
      profile: {
        access_level: profile?.access_level,
        monthly_requests: profile?.monthly_ai_requests,
        premium_expires_at: profile?.premium_expires_at
      },
      activity_summary: {
        transcription_requests: transcriptionRequests.length,
        chat_requests: chatRequests.length,
        food_entries_created: foodEntries?.length || 0,
        total_ai_requests: aiUsage?.length || 0
      },
      recent_transcriptions: transcriptionRequests.slice(0, 10).map(log => ({
        timestamp: log.created_at,
        model: log.model_used,
        success: log.success,
        response_time_ms: log.response_time_ms,
        estimated_cost: log.estimated_cost
      })),
      recent_chat_completions: chatRequests.slice(0, 10).map(log => ({
        timestamp: log.created_at,
        model: log.model_used,
        tokens_used: log.tokens_used,
        success: log.success,
        response_time_ms: log.response_time_ms,
        estimated_cost: log.estimated_cost
      })),
      recent_food_entries: foodEntries?.slice(0, 20).map(entry => ({
        id: entry.id,
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        serving_size: entry.serving_size,
        created_at: entry.created_at
      })) || [],
      patterns: {
        avg_transcription_time: transcriptionRequests.length > 0 
          ? Math.round(transcriptionRequests.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / transcriptionRequests.length)
          : 0,
        avg_chat_time: chatRequests.length > 0
          ? Math.round(chatRequests.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / chatRequests.length)
          : 0,
        failed_requests: aiUsage?.filter(log => !log.success).length || 0,
        total_cost: aiUsage?.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) || 0
      }
    };

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in voice-diagnostics function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate diagnostics',
        details: (error as Error).message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
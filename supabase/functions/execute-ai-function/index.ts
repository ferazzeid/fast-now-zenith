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
    const { functionName, arguments: functionArgs } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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
    const today = new Date().toISOString().split('T')[0];

    console.log(`🔧 Executing function: ${functionName}`, functionArgs);

    let result;

    switch (functionName) {
      case 'get_recent_foods': {
        // Get recent foods (last 30 days, grouped by name)
        const { data: recentEntries } = await supabase
          .from('food_entries')
          .select('name, calories, carbs, created_at')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        // Process recent foods (group by name, get most recent)
        const recentFoodsMap = new Map();
        recentEntries?.forEach(entry => {
          const key = entry.name.toLowerCase();
          if (!recentFoodsMap.has(key) || new Date(entry.created_at) > new Date(recentFoodsMap.get(key).created_at)) {
            recentFoodsMap.set(key, entry);
          }
        });
        const recentFoods = Array.from(recentFoodsMap.values()).slice(0, 20);

        result = {
          success: true,
          data: recentFoods,
          message: `Found ${recentFoods.length} recent foods from the last 30 days`
        };
        break;
      }

      case 'get_favorite_default_foods': {
        // Get user's favorite default foods
        const { data: favorites } = await supabase
          .from('default_food_favorites')
          .select(`
            default_food_id,
            default_foods (
              id,
              name,
              calories_per_100g,
              carbs_per_100g,
              image_url
            )
          `)
          .eq('user_id', userId);

        const favoriteFoods = favorites?.map(fav => fav.default_foods).filter(Boolean) || [];

        result = {
          success: true,
          data: favoriteFoods,
          message: `Found ${favoriteFoods.length} favorite foods`
        };
        break;
      }

      case 'copy_yesterday_foods': {
        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Get yesterday's food entries
        const { data: yesterdayEntries } = await supabase
          .from('food_entries')
          .select('name, calories, carbs, serving_size, image_url')
          .eq('user_id', userId)
          .eq('source_date', yesterdayStr);

        if (!yesterdayEntries || yesterdayEntries.length === 0) {
          result = {
            success: false,
            message: "No food entries found for yesterday"
          };
          break;
        }

        // Insert entries for today
        const todayEntries = yesterdayEntries.map(entry => ({
          user_id: userId,
          name: entry.name,
          calories: entry.calories,
          carbs: entry.carbs,
          serving_size: entry.serving_size,
          image_url: entry.image_url,
          consumed: false,
          source_date: today
        }));

        const { error: insertError } = await supabase
          .from('food_entries')
          .insert(todayEntries);

        if (insertError) throw insertError;

        result = {
          success: true,
          data: todayEntries,
          message: `Copied ${yesterdayEntries.length} food entries from yesterday to today`
        };
        break;
      }

      case 'get_today_food_totals': {
        // Get today's food entries
        const { data: todayEntries } = await supabase
          .from('food_entries')
          .select('calories, carbs, consumed')
          .eq('user_id', userId)
          .eq('source_date', today);

        const totals = todayEntries?.reduce((acc, entry) => ({
          totalCalories: acc.totalCalories + (entry.calories || 0),
          totalCarbs: acc.totalCarbs + (entry.carbs || 0),
          consumedCalories: acc.consumedCalories + (entry.consumed ? (entry.calories || 0) : 0),
          consumedCarbs: acc.consumedCarbs + (entry.consumed ? (entry.carbs || 0) : 0)
        }), {
          totalCalories: 0,
          totalCarbs: 0,
          consumedCalories: 0,
          consumedCarbs: 0
        }) || { totalCalories: 0, totalCarbs: 0, consumedCalories: 0, consumedCarbs: 0 };

        result = {
          success: true,
          data: {
            ...totals,
            entryCount: todayEntries?.length || 0
          },
          message: `Today's totals: ${totals.totalCalories} calories, ${totals.totalCarbs}g carbs (${totals.consumedCalories} consumed)`
        };
        break;
      }

      case 'get_manual_calorie_burns': {
        // Get today's manual calorie burns
        const { data: manualBurns } = await supabase
          .from('manual_calorie_burns')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false });

        const totalBurned = manualBurns?.reduce((sum, burn) => sum + burn.calories_burned, 0) || 0;

        result = {
          success: true,
          data: {
            burns: manualBurns || [],
            totalBurned
          },
          message: `Today's manual calorie burns: ${totalBurned} calories from ${manualBurns?.length || 0} activities`
        };
        break;
      }

      case 'add_manual_calorie_burn': {
        const { activity_name, calories_burned } = functionArgs;
        
        if (!activity_name || !calories_burned) {
          throw new Error('Missing required parameters: activity_name and calories_burned');
        }

        const { data: newBurn, error: insertError } = await supabase
          .from('manual_calorie_burns')
          .insert({
            user_id: userId,
            activity_name,
            calories_burned: Math.round(calories_burned)
          })
          .select()
          .single();

        if (insertError) throw insertError;

        result = {
          success: true,
          data: newBurn,
          message: `Added ${activity_name}: ${calories_burned} calories burned`
        };
        break;
      }

      case 'get_walking_sessions_today': {
        // Get today's walking sessions
        const { data: walkingSessions } = await supabase
          .from('walking_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', `${today}T00:00:00`)
          .lt('start_time', `${today}T23:59:59`)
          .order('start_time', { ascending: false });

        const totalCaloriesBurned = walkingSessions?.reduce((sum, session) => sum + (session.calories_burned || 0), 0) || 0;
        const totalDistance = walkingSessions?.reduce((sum, session) => sum + (session.distance || 0), 0) || 0;

        result = {
          success: true,
          data: {
            sessions: walkingSessions || [],
            totalCaloriesBurned,
            totalDistance,
            sessionCount: walkingSessions?.length || 0
          },
          message: `Today's walking: ${walkingSessions?.length || 0} sessions, ${totalCaloriesBurned} calories, ${totalDistance.toFixed(2)} km`
        };
        break;
      }

      case 'get_fasting_sessions_recent': {
        // Get recent fasting sessions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: fastingSessions } = await supabase
          .from('fasting_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', thirtyDaysAgo.toISOString())
          .order('start_time', { ascending: false })
          .limit(20);

        const completedSessions = fastingSessions?.filter(s => s.status === 'completed') || [];
        const avgDuration = completedSessions.length > 0 
          ? completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / completedSessions.length / 3600
          : 0;

        result = {
          success: true,
          data: {
            sessions: fastingSessions || [],
            completedCount: completedSessions.length,
            averageDurationHours: avgDuration
          },
          message: `Recent fasting: ${fastingSessions?.length || 0} sessions, ${completedSessions.length} completed`
        };
        break;
      }

      case 'get_daily_food_templates': {
        // Get user's daily food templates
        const { data: templates } = await supabase
          .from('daily_food_templates')
          .select('*')
          .eq('user_id', userId)
          .order('sort_order');

        result = {
          success: true,
          data: templates || [],
          message: `Found ${templates?.length || 0} daily food templates`
        };
        break;
      }

      default: {
        throw new Error(`Unknown function: ${functionName}`);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in execute-ai-function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
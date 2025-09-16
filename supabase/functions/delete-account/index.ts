import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Account deletion request started");

    // Use service role key for admin operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        }
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    
    // Verify the JWT token and get user info using service role
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id || !user?.email) throw new Error("User not authenticated or missing user data");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has an active subscription  
    const { data: profile } = await supabaseService
      .from('profiles')
      .select('access_level, premium_expires_at, subscription_end_date')
      .eq('user_id', user.id)
      .single();

    const now = new Date();
    const isExpired = profile?.premium_expires_at ? new Date(profile.premium_expires_at) < now : false;
    const hasActiveSubscription = profile?.access_level === 'premium' && !isExpired;
    logStep("Subscription check", { hasActiveSubscription, access_level: profile?.access_level });

    if (hasActiveSubscription) {
      // Schedule deletion for subscription end date
      const subscriptionEndDate = profile.subscription_end_date;
      const scheduledDeletionDate = subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days if no end date
      
      logStep("Scheduling deletion for premium user", { scheduledDate: scheduledDeletionDate });

      // Update profile to schedule deletion
      await supabaseService
        .from('profiles')
        .update({
          deletion_scheduled_at: scheduledDeletionDate,
          deletion_reason: 'User requested account deletion - subscription active'
        })
        .eq('user_id', user.id);

      // Cancel subscription immediately but let them use until expiry
      await supabaseService
        .from('profiles')
        .update({
          access_level: 'free'
        })
        .eq('user_id', user.id);

      const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
      return new Response(JSON.stringify({
        success: true,
        scheduled: true,
        deletionDate: scheduledDeletionDate,
        message: "Account deletion scheduled for when your subscription expires. Your subscription has been canceled but you can continue using premium features until it expires."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Immediate deletion for free users
      logStep("Immediate deletion for free user");

      // Delete all user data
      const deleteOperations = [
        supabaseService.from('chat_conversations').delete().eq('user_id', user.id),
        supabaseService.from('motivators').delete().eq('user_id', user.id),
        supabaseService.from('food_entries').delete().eq('user_id', user.id),
        supabaseService.from('user_foods').delete().eq('user_id', user.id),
        supabaseService.from('fasting_sessions').delete().eq('user_id', user.id),
        supabaseService.from('walking_sessions').delete().eq('user_id', user.id),
        supabaseService.from('manual_calorie_burns').delete().eq('user_id', user.id),
        supabaseService.from('ai_usage_logs').delete().eq('user_id', user.id),
        supabaseService.from('daily_activity_overrides').delete().eq('user_id', user.id)
      ];

      await Promise.all(deleteOperations);
      logStep("User data deleted");

      // Delete profile last
      await supabaseService.from('profiles').delete().eq('user_id', user.id);
      logStep("Profile deleted");

      // Delete the actual auth user
      await supabaseService.auth.admin.deleteUser(user.id);
      logStep("Auth user deleted");

      const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
      return new Response(JSON.stringify({
        success: true,
        scheduled: false,
        message: "Account successfully deleted. You will be logged out shortly."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in delete-account", { message: errorMessage });
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get Stripe key from shared settings or environment variables
    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    try {
      const { data: stripeKeyData } = await supabaseClient
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'stripe_secret_key')
        .single();
      
      if (stripeKeyData?.setting_value) {
        stripeKey = stripeKeyData.setting_value;
        logStep("Using Stripe key from admin dashboard");
      } else {
        logStep("Using Stripe key from environment variables");
      }
    } catch (error) {
      logStep("Could not fetch Stripe key from shared settings, using environment", { error: error.message });
    }

    if (!stripeKey) {
      throw new Error("No Stripe secret key configured");
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating free status");
      await supabaseClient.from("profiles").upsert({
        user_id: user.id,
        subscription_status: "free",
        subscription_tier: "free",
        stripe_customer_id: null,
        subscription_end_date: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_status: "free",
        subscription_tier: "free" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEndDate = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEndDate 
      });
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("profiles").upsert({
      user_id: user.id,
      subscription_status: hasActiveSub ? "active" : "free",
      subscription_tier: hasActiveSub ? "premium" : "free",
      stripe_customer_id: customerId,
      subscription_end_date: subscriptionEndDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier: hasActiveSub ? "premium" : "free" 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_status: hasActiveSub ? "active" : "free",
      subscription_tier: hasActiveSub ? "premium" : "free",
      subscription_end_date: subscriptionEndDate
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
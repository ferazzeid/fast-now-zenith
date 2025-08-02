import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UNIFIED-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { action, platform, ...params } = await req.json();

    // Detect platform if not provided
    const detectedPlatform = platform || detectPlatform(req);
    logStep("Platform detected", { platform: detectedPlatform });

    // Get appropriate payment provider
    const { data: providerData } = await supabaseClient.rpc('get_payment_provider_for_platform', {
      _platform: detectedPlatform
    });
    
    const paymentProvider = providerData || 'stripe';
    logStep("Payment provider selected", { provider: paymentProvider });

    switch (action) {
      case 'create_subscription':
        return await handleCreateSubscription(supabaseClient, user, paymentProvider, params, req);
      
      case 'check_subscription':
        return await handleCheckSubscription(supabaseClient, user, paymentProvider);
      
      case 'cancel_subscription':
        return await handleCancelSubscription(supabaseClient, user, paymentProvider, params);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in unified-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function detectPlatform(req: Request): string {
  const userAgent = req.headers.get("user-agent") || "";
  const origin = req.headers.get("origin") || "";
  
  // Check for Capacitor app indicators
  if (userAgent.includes("CapacitorApp")) {
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      return "ios";
    } else if (userAgent.includes("Android")) {
      return "android";
    }
  }
  
  // Check origin for mobile detection
  if (origin.includes("ionic://") || origin.includes("capacitor://")) {
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      return "ios";
    } else {
      return "android";
    }
  }
  
  return "web";
}

async function handleCreateSubscription(
  supabaseClient: any,
  user: any,
  provider: string,
  params: any,
  req: Request
) {
  logStep("Creating subscription", { provider });

  switch (provider) {
    case 'stripe':
      // Call existing Stripe function
      const { data: stripeData } = await supabaseClient.functions.invoke('create-subscription', {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
          origin: req.headers.get("origin") || ""
        }
      });
      return new Response(JSON.stringify(stripeData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    case 'google_play':
      // Return product ID for Google Play Billing
      return new Response(JSON.stringify({
        provider: 'google_play',
        product_id: 'premium_subscription_monthly',
        package_name: 'app.lovable.de91d618edcf40eb8e117c45904095be',
        instruction: 'Use Google Play Billing API to purchase this product'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    case 'apple_app_store':
      // Return product ID for Apple StoreKit
      return new Response(JSON.stringify({
        provider: 'apple_app_store',
        product_id: 'premium_subscription_monthly',
        bundle_id: 'app.lovable.de91d618edcf40eb8e117c45904095be',
        instruction: 'Use StoreKit to purchase this product'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

async function handleCheckSubscription(
  supabaseClient: any,
  user: any,
  provider: string
) {
  logStep("Checking subscription", { provider });

  switch (provider) {
    case 'stripe':
      // Call existing Stripe check function
      const { data: stripeData } = await supabaseClient.functions.invoke('check-subscription');
      return new Response(JSON.stringify(stripeData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    case 'google_play':
    case 'apple_app_store':
      // For native apps, just return current subscription status from database
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('subscription_status, subscription_tier, payment_provider, subscription_end_date')
        .eq('user_id', user.id)
        .single();

      return new Response(JSON.stringify({
        subscribed: profile?.subscription_status === 'active',
        subscription_tier: profile?.subscription_tier || 'free',
        payment_provider: profile?.payment_provider || provider,
        subscription_end_date: profile?.subscription_end_date
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

async function handleCancelSubscription(
  supabaseClient: any,
  user: any,
  provider: string,
  params: any
) {
  logStep("Cancelling subscription", { provider });

  switch (provider) {
    case 'stripe':
      // For Stripe, redirect to customer portal
      const { data: portalData } = await supabaseClient.functions.invoke('customer-portal');
      return new Response(JSON.stringify(portalData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    case 'google_play':
    case 'apple_app_store':
      // For native apps, users need to cancel through platform settings
      return new Response(JSON.stringify({
        message: `Please cancel your subscription through ${provider === 'google_play' ? 'Google Play Store' : 'Apple App Store'} settings`,
        provider: provider,
        cancel_url: provider === 'google_play' 
          ? 'https://play.google.com/store/account/subscriptions'
          : 'https://apps.apple.com/account/subscriptions'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
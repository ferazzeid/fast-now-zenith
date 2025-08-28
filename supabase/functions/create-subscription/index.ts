import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get Stripe configuration from payment provider configs
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { data: stripeConfig, error: configError } = await supabaseService
      .from('payment_provider_configs')
      .select('config_data, is_active')
      .eq('provider', 'stripe')
      .single();

    if (configError || !stripeConfig?.is_active) {
      throw new Error("Stripe payment provider is not configured or active");
    }

    const config = stripeConfig.config_data;
    const stripeKey = config.secret_key || Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeKey) {
      throw new Error("No Stripe secret key configured");
    }

    logStep("Using Stripe configuration from admin panel", { 
      testMode: config.test_mode,
      hasConfig: !!config
    });

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Get pricing and URL configuration
    const premiumProduct = config.products?.premium;
    const successUrl = config.success_url || '/settings?success=true';
    const cancelUrl = config.cancel_url || '/settings?cancelled=true';
    const origin = req.headers.get("origin") || 'https://fastnow.app';

    if (!premiumProduct?.price_id) {
      throw new Error("Premium subscription product is not configured");
    }

    // Create checkout session using configured premium product
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: premiumProduct.price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}${successUrl}`,
      cancel_url: `${origin}${cancelUrl}`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
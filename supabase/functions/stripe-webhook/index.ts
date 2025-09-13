import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    logStep("Webhook received");

    // Get Stripe configuration
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: stripeConfig, error: configError } = await supabaseService
      .from('payment_provider_configs')
      .select('config_data')
      .eq('provider', 'stripe')
      .single();

    if (configError || !stripeConfig) {
      throw new Error("Stripe configuration not found");
    }

    const config = stripeConfig.config_data;
    const stripeKey = config.secret_key || Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = config.webhook_secret;

    if (!stripeKey || !webhookSecret) {
      throw new Error("Stripe keys not configured");
    }

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No signature provided");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, supabaseService);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseService);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseService);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionEvent(subscription: Stripe.Subscription, supabase: any) {
  try {
    const customerId = subscription.customer as string;
    
    // Get customer email from Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted || !customer.email) {
      throw new Error("Customer not found or no email");
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const subscriptionEnd = new Date(subscription.current_period_end * 1000);

    logStep("Updating subscription status", {
      email: customer.email,
      status: subscription.status,
      isActive,
      subscriptionEnd
    });

    // Update user profile based on subscription status
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_tier: isActive ? 'premium' : 'free',
        user_tier: isActive ? 'paid_user' : 'free_user',
        stripe_customer_id: customerId,
        subscription_end_date: subscriptionEnd.toISOString(),
        payment_provider: 'stripe',
        platform_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', (await supabase.auth.admin.getUserByEmail(customer.email)).data.user?.id);

    if (error) {
      throw error;
    }

    logStep("Subscription updated successfully");
  } catch (error) {
    logStep("Error handling subscription event", { error: error.message });
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  try {
    const customerId = subscription.customer as string;
    
    // Get customer email from Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted || !customer.email) {
      throw new Error("Customer not found or no email");
    }

    logStep("Handling subscription deletion", { email: customer.email });

    // Update user profile to free tier
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_tier: 'free',
        user_tier: 'free_user',
        subscription_end_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', (await supabase.auth.admin.getUserByEmail(customer.email)).data.user?.id);

    if (error) {
      throw error;
    }

    logStep("Subscription cancelled successfully");
  } catch (error) {
    logStep("Error handling subscription deletion", { error: error.message });
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  try {
    const customerId = invoice.customer as string;
    
    logStep("Payment succeeded", { 
      customerId, 
      amount: invoice.amount_paid,
      subscriptionId: invoice.subscription 
    });

    // Payment succeeded events are typically handled by subscription events
    // This is mainly for logging and potential future functionality
    
  } catch (error) {
    logStep("Error handling payment succeeded", { error: error.message });
    throw error;
  }
}
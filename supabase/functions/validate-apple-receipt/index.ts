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
  console.log(`[APPLE-RECEIPT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
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

    const { receipt_data, transaction_id, product_id } = await req.json();
    if (!receipt_data || !transaction_id || !product_id) {
      throw new Error("Missing required fields: receipt_data, transaction_id, product_id");
    }

    // Get Apple App Store shared secret from config
    const { data: configData } = await supabaseClient
      .from('payment_provider_configs')
      .select('config_data')
      .eq('provider', 'apple_app_store')
      .single();

    if (!configData?.config_data?.shared_secret) {
      throw new Error("Apple App Store shared secret not configured");
    }

    const sharedSecret = configData.config_data.shared_secret;
    
    // Log receipt for validation tracking
    const { data: receiptLog } = await supabaseClient
      .from('payment_receipts')
      .insert({
        user_id: user.id,
        provider: 'apple_app_store',
        receipt_data: { receipt_data },
        validation_status: 'pending',
        transaction_id: transaction_id,
        product_id: product_id
      })
      .select()
      .single();

    logStep("Receipt logged", { receiptId: receiptLog?.id });

    // Validate with Apple App Store
    const validationResult = await validateAppleReceipt(receipt_data, sharedSecret);

    logStep("Validation result", { isValid: validationResult.isValid, status: validationResult.status });

    // Update receipt log with validation result
    await supabaseClient
      .from('payment_receipts')
      .update({
        validation_status: validationResult.isValid ? 'valid' : 'invalid',
        validation_response: validationResult,
        subscription_id: validationResult.subscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptLog?.id);

    if (validationResult.isValid) {
      // Update user subscription
      await supabaseClient.rpc('update_subscription_from_receipt', {
        _user_id: user.id,
        _provider: 'apple_app_store',
        _subscription_id: validationResult.subscriptionId,
        _product_id: product_id,
        _status: validationResult.status,
        _expires_at: validationResult.expiresAt
      });

      // Update user's Apple transaction ID
      await supabaseClient
        .from('profiles')
        .update({
          apple_transaction_id: transaction_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      logStep("Subscription updated successfully");
    }

    return new Response(JSON.stringify({
      success: validationResult.isValid,
      status: validationResult.status,
      expires_at: validationResult.expiresAt
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-apple-receipt", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function validateAppleReceipt(receiptData: string, sharedSecret: string) {
  try {
    // Try production server first
    let validationResponse = await callAppleServer(receiptData, sharedSecret, false);
    
    // If production fails with sandbox receipt, try sandbox server
    if (validationResponse.status === 21007) {
      logStep("Production validation failed, trying sandbox");
      validationResponse = await callAppleServer(receiptData, sharedSecret, true);
    }

    if (validationResponse.status !== 0) {
      throw new Error(`Apple validation failed with status: ${validationResponse.status}`);
    }

    // Parse latest receipt info for subscription
    const latestReceiptInfo = validationResponse.latest_receipt_info || [];
    const pendingRenewalInfo = validationResponse.pending_renewal_info || [];
    
    if (latestReceiptInfo.length === 0) {
      throw new Error("No subscription found in receipt");
    }

    // Get the most recent subscription
    const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1];
    const pendingRenewal = pendingRenewalInfo[0] || {};
    
    const expiresDateMs = parseInt(latestTransaction.expires_date_ms || '0');
    const isActive = expiresDateMs > Date.now();
    
    // Determine subscription status
    let status = 'expired';
    if (isActive) {
      status = 'active';
    } else if (pendingRenewal.auto_renew_status === '1') {
      status = 'active'; // Will renew
    }

    return {
      isValid: true,
      status: status,
      subscriptionId: latestTransaction.original_transaction_id,
      expiresAt: new Date(expiresDateMs).toISOString(),
      rawResponse: validationResponse
    };
  } catch (error) {
    return {
      isValid: false,
      status: 'invalid',
      error: error.message
    };
  }
}

async function callAppleServer(receiptData: string, sharedSecret: string, sandbox: boolean) {
  const url = sandbox 
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': sharedSecret,
      'exclude-old-transactions': true
    })
  });

  if (!response.ok) {
    throw new Error(`Apple server error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
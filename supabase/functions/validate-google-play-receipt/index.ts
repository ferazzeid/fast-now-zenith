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
  console.log(`[GOOGLE-PLAY-RECEIPT] ${step}${detailsStr}`);
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

    const { receipt_data, product_id, purchase_token } = await req.json();
    if (!receipt_data || !product_id || !purchase_token) {
      throw new Error("Missing required fields: receipt_data, product_id, purchase_token");
    }

    // Get Google Play service account key from config
    const { data: configData } = await supabaseClient
      .from('payment_provider_configs')
      .select('config_data')
      .eq('provider', 'google_play')
      .single();

    if (!configData?.config_data?.service_account_key) {
      throw new Error("Google Play service account key not configured");
    }

    const serviceAccountKey = JSON.parse(configData.config_data.service_account_key);
    
    // Log receipt for validation tracking
    const { data: receiptLog } = await supabaseClient
      .from('payment_receipts')
      .insert({
        user_id: user.id,
        provider: 'google_play',
        receipt_data: receipt_data,
        validation_status: 'pending',
        transaction_id: purchase_token,
        product_id: product_id
      })
      .select()
      .single();

    logStep("Receipt logged", { receiptId: receiptLog?.id });

    // Validate with Google Play Billing API
    const validationResult = await validateGooglePlayReceipt(
      serviceAccountKey,
      configData.config_data.package_name,
      product_id,
      purchase_token
    );

    logStep("Validation result", validationResult);

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
        _provider: 'google_play',
        _subscription_id: validationResult.subscriptionId,
        _product_id: product_id,
        _status: validationResult.status,
        _expires_at: validationResult.expiresAt
      });

      // Update user's Google Play purchase token
      await supabaseClient
        .from('profiles')
        .update({
          google_play_purchase_token: purchase_token,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      logStep("Subscription updated successfully");
    }

    return new Response(JSON.stringify({
      success: validationResult.isValid,
      subscription_status: validationResult.status,
      expires_at: validationResult.expiresAt
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-google-play-receipt", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function validateGooglePlayReceipt(
  serviceAccountKey: any,
  packageName: string,
  productId: string,
  purchaseToken: string
) {
  try {
    // Get OAuth2 access token
    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    
    // Make request to Google Play Developer API
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Play API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse subscription data
    const expiryTimeMillis = parseInt(data.expiryTimeMillis || '0');
    const isActive = expiryTimeMillis > Date.now();
    
    return {
      isValid: true,
      status: isActive ? 'active' : 'expired',
      subscriptionId: data.orderId || purchaseToken,
      expiresAt: new Date(expiryTimeMillis).toISOString(),
      rawResponse: data
    };
  } catch (error) {
    return {
      isValid: false,
      status: 'invalid',
      error: error.message
    };
  }
}

async function getGoogleAccessToken(serviceAccountKey: any) {
  const jwt = await createJWT(serviceAccountKey);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`OAuth2 error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createJWT(serviceAccountKey: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signingInput = `${headerB64}.${payloadB64}`;
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(atob(serviceAccountKey.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')).split('').map(c => c.charCodeAt(0))),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(signingInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${signingInput}.${signatureB64}`;
}
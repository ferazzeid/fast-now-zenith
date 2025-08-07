import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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

interface GoogleAnalyticsCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
}

interface AnalyticsData {
  activeUsers: number;
  todayUsers: number;
  yesterdayUsers: number;
}

async function getGoogleAnalyticsData(credentials: GoogleAnalyticsCredentials, propertyId: string): Promise<AnalyticsData> {
  try {
    // Create JWT for Google API authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    // Import the private key for signing
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(credentials.private_key.replace(/\\n/g, '\n')),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Create JWT token
    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const toSign = `${headerB64}.${payloadB64}`;
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(toSign)
    );
    
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${toSign}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get analytics data using Google Analytics Data API
    const analyticsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [
            { name: 'activeUsers' }
          ],
          dimensions: [
            { name: 'country' }
          ]
        }),
      }
    );

    const analyticsData = await analyticsResponse.json();
    console.log('Analytics API Response:', JSON.stringify(analyticsData));

    // Extract active users count
    const activeUsers = analyticsData.totals?.[0]?.metricValues?.[0]?.value || 0;

    // Get historical data for today and yesterday
    const historicalResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [
            { startDate: 'today', endDate: 'today' },
            { startDate: 'yesterday', endDate: 'yesterday' }
          ],
          metrics: [
            { name: 'activeUsers' }
          ],
          dimensions: [
            { name: 'date' }
          ]
        }),
      }
    );

    const historicalData = await historicalResponse.json();
    console.log('Historical API Response:', JSON.stringify(historicalData));

    // Extract today and yesterday users
    const todayUsers = historicalData.rows?.[0]?.metricValues?.[0]?.value || 0;
    const yesterdayUsers = historicalData.rows?.[1]?.metricValues?.[0]?.value || 0;

    return {
      activeUsers: parseInt(activeUsers.toString()),
      todayUsers: parseInt(todayUsers.toString()),
      yesterdayUsers: parseInt(yesterdayUsers.toString()),
    };

  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[GOOGLE-ANALYTICS-DATA] Function started');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Google Analytics configuration from shared_settings
    const { data: gaSettings, error: gaError } = await supabaseClient
      .from('shared_settings')
      .select('setting_value')
      .in('setting_key', ['google_analytics_service_account', 'google_analytics_property_id']);

    if (gaError) {
      console.error('[GOOGLE-ANALYTICS-DATA] Error fetching GA settings:', gaError);
      throw new Error('Failed to fetch Google Analytics configuration');
    }

    const serviceAccountSetting = gaSettings.find(s => s.setting_key === 'google_analytics_service_account');
    const propertyIdSetting = gaSettings.find(s => s.setting_key === 'google_analytics_property_id');

    if (!serviceAccountSetting?.setting_value || !propertyIdSetting?.setting_value) {
      console.log('[GOOGLE-ANALYTICS-DATA] Google Analytics not configured');
      const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
      return new Response(
        JSON.stringify({ 
          error: 'Google Analytics not configured',
          activeUsers: 0,
          todayUsers: 0,
          yesterdayUsers: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    let credentials: GoogleAnalyticsCredentials;
    try {
      credentials = JSON.parse(serviceAccountSetting.setting_value);
    } catch (parseError) {
      console.error('[GOOGLE-ANALYTICS-DATA] Error parsing service account credentials:', parseError);
      throw new Error('Invalid service account credentials format');
    }

    const propertyId = propertyIdSetting.setting_value;

    console.log('[GOOGLE-ANALYTICS-DATA] Fetching analytics data for property:', propertyId);

    const analyticsData = await getGoogleAnalyticsData(credentials, propertyId);

    console.log('[GOOGLE-ANALYTICS-DATA] Analytics data fetched successfully:', analyticsData);

    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(
      JSON.stringify(analyticsData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[GOOGLE-ANALYTICS-DATA] Error:', error);
    
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(
      JSON.stringify({ 
        error: error.message,
        activeUsers: 0,
        todayUsers: 0,
        yesterdayUsers: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
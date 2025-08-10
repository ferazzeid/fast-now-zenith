import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get app logo and PWA settings from shared_settings
    const { data: settingsData } = await supabaseClient
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['app_logo', 'app_icon_url', 'pwa_app_name', 'pwa_short_name', 'pwa_description']);

    const settings: Record<string, string> = {};
    settingsData?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    // Use app_icon_url for PWA icons, fallback to app_logo if not available
    const appIcon = settings.app_icon_url || settings.app_logo;
    const appName = settings.pwa_app_name || 'fast now - The No-BS Fat Loss Protocol';
    const shortName = settings.pwa_short_name || 'fast now';
    const description = settings.pwa_description || 'Your mindful app with AI-powered motivation';

    // Create dynamic manifest
    const manifest = {
      name: appName,
      short_name: shortName,
      description: description,
      start_url: "/",
      display: "standalone",
      background_color: "#F5F2EA",
      theme_color: "#8B7355",
      orientation: "portrait-primary",
      categories: ["health", "wellness", "lifestyle"],
      lang: "en",
      icons: [] as ManifestIcon[]
    };

    // Add icons based on available app icon
    if (appIcon) {
      manifest.icons = [
        {
          src: appIcon,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: appIcon,
          sizes: "512x512", 
          type: "image/png",
          purpose: "maskable any"
        }
      ];
    } else {
      // Fallback to default icons
      manifest.icons = [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png", 
          purpose: "maskable any"
        }
      ];
    }

    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(JSON.stringify(manifest, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    })

  } catch (error) {
    console.error('Error generating manifest:', error);
    
    // Return fallback manifest on error
    const fallbackManifest = {
      name: "FastNow - Mindful App",
      short_name: "FastNow",
      description: "Your mindful app with AI-powered motivation",
      start_url: "/",
      display: "standalone",
      background_color: "#F5F2EA",
      theme_color: "#8B7355",
      orientation: "portrait-primary",
      categories: ["health", "wellness", "lifestyle"],
      lang: "en",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any"
        }
      ]
    };

    const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
    return new Response(JSON.stringify(fallbackManifest, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      },
    })
  }
})
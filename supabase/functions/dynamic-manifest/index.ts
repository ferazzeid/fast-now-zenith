import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get app logo from shared_settings
    const { data: logoData } = await supabaseClient
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'app_logo')
      .maybeSingle();

    // Get app name and other settings if needed
    const { data: nameData } = await supabaseClient
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'app_name')
      .maybeSingle();

    const appLogo = logoData?.setting_value;
    const appName = nameData?.setting_value || 'FastNow - Mindful App';

    // Create dynamic manifest
    const manifest = {
      name: appName,
      short_name: appName.split(' - ')[0] || 'FastNow',
      description: "Your mindful app with AI-powered motivation",
      start_url: "/",
      display: "standalone",
      background_color: "#F5F2EA",
      theme_color: "#8B7355",
      orientation: "portrait-primary",
      categories: ["health", "wellness", "lifestyle"],
      lang: "en",
      icons: [] as ManifestIcon[]
    };

    // Add icons based on available logo
    if (appLogo) {
      manifest.icons = [
        {
          src: appLogo,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: appLogo,
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

    return new Response(JSON.stringify(fallbackManifest, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      },
    })
  }
})
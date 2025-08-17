import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AndroidColorsResponse {
  success: boolean;
  colors?: {
    primary: string;
    primaryDark: string;
    accent: string;
  };
  colorsXml?: string;
  colorsXmlPath?: string;
  message: string;
  error?: string;
}

interface ColorSettings {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  ai_color?: string;
}

function parseHSL(hslString: string) {
  // Parse "220 35% 45%" format
  const matches = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!matches) return null;
  
  return {
    h: parseInt(matches[1]),
    s: parseInt(matches[2]),
    l: parseInt(matches[3])
  };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function convertHslToHex(hslString: string): string {
  const hsl = parseHSL(hslString);
  if (!hsl) return '#6B7280'; // Fallback to neutral gray
  
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

function generateDarkerVariant(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken by 20%
  const darkenedR = Math.max(0, Math.round(r * 0.8));
  const darkenedG = Math.max(0, Math.round(g * 0.8));
  const darkenedB = Math.max(0, Math.round(b * 0.8));
  
  // Convert back to hex
  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
}

Deno.serve(async (req): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch color settings from database
    const { data, error } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['brand_primary_color', 'brand_primary_hover', 'brand_accent_color', 'brand_ai_color']);

    if (error) {
      console.error('Error loading color settings:', error);
      throw error;
    }

    // Map the database colors
    const settings: ColorSettings = {};
    data?.forEach(setting => {
      if (setting.setting_key === 'brand_primary_color') {
        settings.primary_color = setting.setting_value;
      } else if (setting.setting_key === 'brand_primary_hover') {
        settings.secondary_color = setting.setting_value;
      } else if (setting.setting_key === 'brand_accent_color') {
        settings.accent_color = setting.setting_value;
      } else if (setting.setting_key === 'brand_ai_color') {
        settings.ai_color = setting.setting_value;
      }
    });

    // Convert HSL colors to hex for Android
    const primaryHex = settings.primary_color ? convertHslToHex(settings.primary_color) : '#6B7280';
    const primaryDarkHex = generateDarkerVariant(primaryHex);
    const accentHex = settings.accent_color ? convertHslToHex(settings.accent_color) : primaryHex;

    // Generate colors.xml content
    const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${primaryHex}</color>
    <color name="colorPrimaryDark">${primaryDarkHex}</color>
    <color name="colorAccent">${accentHex}</color>
    <color name="backgroundLight">#F5F5F5</color>
    <color name="foregroundLight">#262626</color>
    <color name="cardLight">#FAFAFA</color>
    <color name="backgroundDark">#1C1C1C</color>
    <color name="foregroundDark">#E0E0E0</color>
    <color name="cardDark">#1A1A1A</color>
    <color name="ic_launcher_background">#FFFFFF</color>
    <color name="statusBarLight">#F5F5F5</color>
    <color name="statusBarDark">#1C1C1C</color>
</resources>`;

    // Write the colors.xml file to the expected Android path
    const androidColorsPath = './android/app/src/main/res/values/colors.xml';
    
    try {
      // Ensure directory exists
      await Deno.mkdir('./android/app/src/main/res/values', { recursive: true });
      // Write colors.xml file
      await Deno.writeTextFile(androidColorsPath, colorsXmlContent);
      console.log('✅ colors.xml written to:', androidColorsPath);
    } catch (fileError) {
      console.warn('⚠️ Could not write colors.xml file:', fileError.message);
      // Continue anyway - file writing is not critical
    }

    console.log('Generated Android colors:', {
      primary: primaryHex,
      primaryDark: primaryDarkHex,
      accent: accentHex
    });

    const response: AndroidColorsResponse = {
      success: true,
      colors: {
        primary: primaryHex,
        primaryDark: primaryDarkHex,
        accent: accentHex
      },
      colorsXml: colorsXmlContent,
      colorsXmlPath: androidColorsPath,
      message: 'Android colors generated successfully'
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );

  } catch (error) {
    console.error('Error generating Android colors:', error);
    
    // Determine error type and provide appropriate fallback
    let errorMessage = 'Failed to generate Android colors';
    let statusCode = 500;
    
    if (error.message?.includes('environment variables')) {
      errorMessage = 'Server configuration error';
      statusCode = 503;
    } else if (error.message?.includes('shared_settings')) {
      errorMessage = 'Database connection error';
      statusCode = 503;
    }
    
    const errorResponse: AndroidColorsResponse = {
      success: false,
      error: error.message,
      message: errorMessage,
      // Provide fallback colors even on error
      colors: {
        primary: '#6B7280',
        primaryDark: '#4B5563', 
        accent: '#6B7280'
      },
      colorsXml: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#6B7280</color>
    <color name="colorPrimaryDark">#4B5563</color>
    <color name="colorAccent">#6B7280</color>
    <color name="backgroundLight">#F5F5F5</color>
    <color name="foregroundLight">#262626</color>
    <color name="cardLight">#FAFAFA</color>
    <color name="backgroundDark">#1C1C1C</color>
    <color name="foregroundDark">#E0E0E0</color>
    <color name="cardDark">#1A1A1A</color>
    <color name="ic_launcher_background">#FFFFFF</color>
    <color name="statusBarLight">#F5F5F5</color>
    <color name="statusBarDark">#1C1C1C</color>
</resources>`
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );
  }
});
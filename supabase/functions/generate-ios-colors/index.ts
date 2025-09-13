import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting iOS color generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load brand colors from database
    const { data: colorSettings, error: colorError } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['brand_primary_color', 'brand_primary_hover', 'brand_accent_color', 'brand_ai_color']);

    if (colorError) {
      console.error('Error loading colors:', colorError);
      throw new Error(`Database error: ${colorError.message}`);
    }

    // Parse colors with fallbacks
    const colors = {
      primary: '220 35% 45%',
      primaryHover: '220 35% 40%', 
      accent: '250 35% 50%',
      ai: '45 95% 50%'
    };

    colorSettings?.forEach(setting => {
      if (setting.setting_key === 'brand_primary_color' && setting.setting_value) {
        colors.primary = setting.setting_value;
      } else if (setting.setting_key === 'brand_primary_hover' && setting.setting_value) {
        colors.primaryHover = setting.setting_value;
      } else if (setting.setting_key === 'brand_accent_color' && setting.setting_value) {
        colors.accent = setting.setting_value;
      } else if (setting.setting_key === 'brand_ai_color' && setting.setting_value) {
        colors.ai = setting.setting_value;
      }
    });

    console.log('Loaded colors:', colors);

    // Convert HSL to RGB for iOS
    const hslToRgb = (hslString: string) => {
      const [h, s, l] = hslString.split(' ').map((val, idx) => 
        idx === 0 ? parseInt(val) : parseInt(val.replace('%', ''))
      );
      
      const sNorm = s / 100;
      const lNorm = l / 100;
      
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = lNorm - c / 2;
      
      let r = 0, g = 0, b = 0;
      
      if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
      } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
      } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
      } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
      } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
      } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
      }
      
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      
      return { r: r / 255, g: g / 255, b: b / 255 };
    };

    // Generate iOS color asset files
    const generateColorAsset = (name: string, rgb: { r: number, g: number, b: number }) => {
      return {
        colors: [
          {
            color: {
              "color-space": "srgb",
              components: {
                red: rgb.r.toFixed(3),
                green: rgb.g.toFixed(3),
                blue: rgb.b.toFixed(3),
                alpha: "1.000"
              }
            },
            idiom: "universal"
          }
        ],
        info: {
          author: "xcode",
          version: 1
        }
      };
    };

    // Write iOS color files
    const iosColorFiles = {
      'ios/App/App/Colors.xcassets/Primary.colorset/Contents.json': generateColorAsset('Primary', hslToRgb(colors.primary)),
      'ios/App/App/Colors.xcassets/PrimaryHover.colorset/Contents.json': generateColorAsset('PrimaryHover', hslToRgb(colors.primaryHover)),
      'ios/App/App/Colors.xcassets/Accent.colorset/Contents.json': generateColorAsset('Accent', hslToRgb(colors.accent)),
      'ios/App/App/Colors.xcassets/AI.colorset/Contents.json': generateColorAsset('AI', hslToRgb(colors.ai)),
      'ios/App/App/Colors.xcassets/Contents.json': {
        info: {
          author: "xcode",
          version: 1
        }
      }
    };

    // Write color files
    for (const [filePath, content] of Object.entries(iosColorFiles)) {
      try {
        await Deno.writeTextFile(filePath, JSON.stringify(content, null, 2));
        console.log(`✓ Created iOS color file: ${filePath}`);
      } catch (error) {
        console.warn(`Warning: Could not write ${filePath}:`, error.message);
        // Continue with other files
      }
    }

    console.log('iOS colors generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'iOS colors generated successfully',
        colors: colors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-ios-colors:', error);
    
    // Generate fallback neutral iOS colors
    const fallbackColors = {
      primary: { r: 0.4, g: 0.4, b: 0.4 },
      primaryHover: { r: 0.35, g: 0.35, b: 0.35 },
      accent: { r: 0.45, g: 0.45, b: 0.45 },
      ai: { r: 0.5, g: 0.5, b: 0.5 }
    };

    try {
      const generateColorAsset = (name: string, rgb: { r: number, g: number, b: number }) => ({
        colors: [{
          color: {
            "color-space": "srgb",
            components: {
              red: rgb.r.toFixed(3),
              green: rgb.g.toFixed(3),
              blue: rgb.b.toFixed(3),
              alpha: "1.000"
            }
          },
          idiom: "universal"
        }],
        info: { author: "xcode", version: 1 }
      });

      const fallbackFiles = {
        'ios/App/App/Colors.xcassets/Primary.colorset/Contents.json': generateColorAsset('Primary', fallbackColors.primary),
        'ios/App/App/Colors.xcassets/PrimaryHover.colorset/Contents.json': generateColorAsset('PrimaryHover', fallbackColors.primaryHover),
        'ios/App/App/Colors.xcassets/Accent.colorset/Contents.json': generateColorAsset('Accent', fallbackColors.accent),
        'ios/App/App/Colors.xcassets/AI.colorset/Contents.json': generateColorAsset('AI', fallbackColors.ai)
      };

      for (const [filePath, content] of Object.entries(fallbackFiles)) {
        try {
          await Deno.writeTextFile(filePath, JSON.stringify(content, null, 2));
        } catch (writeError) {
          console.warn(`Could not write fallback file ${filePath}`);
        }
      }
    } catch (fallbackError) {
      console.error('Failed to write fallback colors:', fallbackError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'iOS color generation failed, fallback colors applied'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
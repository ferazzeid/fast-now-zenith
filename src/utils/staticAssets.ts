// Static asset URLs - no database dependencies
export const STATIC_ASSETS = {
  logo: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/logo-1755198305926.png",
  favicon: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/favicon-1754812729411.png",
  homeScreenIcon: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/homeScreenIcon-1757146073331.jpg"
} as const;

// Static color values - matches index.css
export const STATIC_COLORS = {
  primary: "220 85% 50%",
  secondary: "0 0% 90%",
  accent: "140 25% 85%"
} as const;
export const useStaticLogo = () => {
  // Static logo from database settings - no network requests needed
  const appLogo = "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/logo-1755198305926.png";
  
  return {
    appLogo,
    loading: false,
    refetch: () => {} // No-op for compatibility
  };
};
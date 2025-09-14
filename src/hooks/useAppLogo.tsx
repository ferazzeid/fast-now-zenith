import { useStaticLogo } from "@/hooks/useStaticLogo";

export const useAppLogo = () => {
  const { appLogo, loading } = useStaticLogo();
  return { 
    appLogo, 
    loading, 
    refetch: () => {} // Keep for compatibility
  };
};
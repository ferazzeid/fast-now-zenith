import { useUnifiedLogos } from './useUnifiedLogos';

export const useAppLogo = () => {
  const { appLogo, loading } = useUnifiedLogos();
  
  return {
    appLogo,
    loading,
    refetch: () => {} // Keep for compatibility
  };
};
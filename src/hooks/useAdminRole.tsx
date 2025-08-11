import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export const useAdminRole = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  // Check if user is admin based on email or profile settings
  const isAdmin = Boolean(
    user?.email === 'test@test.com' || // Admin email
    user?.email?.includes('admin') ||
    profile?.display_name?.toLowerCase().includes('admin')
  );

  // Debug logging to help troubleshoot admin detection
  console.log('🔧 Admin Check:', {
    userEmail: user?.email,
    displayName: profile?.display_name,
    isAdmin,
    loading
  });

  return {
    isAdmin,
    loading
  };
};
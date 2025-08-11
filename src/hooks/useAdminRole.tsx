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

  return {
    isAdmin,
    loading
  };
};
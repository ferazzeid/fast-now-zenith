import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  isAdmin: boolean;
  loading: boolean;
}

export const useAdminErrorFilter = (): AdminUser => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  // Check if user is admin based on email or profile settings
  const isAdmin = Boolean(
    user?.email === 'admin@example.com' || // Replace with your admin email
    user?.email?.includes('admin') ||
    profile?.display_name?.toLowerCase().includes('admin')
  );

  return {
    isAdmin,
    loading
  };
};

// Custom toast wrapper that filters errors for non-admin users
export const useAdminAwareToast = () => {
  const { isAdmin } = useAdminErrorFilter();
  const originalToast = useToast();
  
  const toast = (props: any) => {
    // For non-admin users, filter out ALL technical errors completely
    if (!isAdmin && props.variant === 'destructive') {
      // Filter out technical errors for regular users - expanded list
      if (props.description?.includes('subscription') || 
          props.description?.includes('API') ||
          props.description?.includes('database') ||
          props.description?.includes('server') ||
          props.description?.includes('connection') ||
          props.description?.includes('network') ||
          props.description?.includes('archived conversations') ||
          props.title?.includes('Error checking') ||
          props.title?.includes('Failed to') ||
          props.title?.includes('Subscription error') ||
          props.title?.includes('Connection error') ||
          props.title?.includes('Network error')) {
        // Silently return - no error shown to regular users
        return;
      }
    }
    
    // Show all messages to admin users, or user-friendly messages to regular users
    return originalToast.toast(props);
  };

  return { ...originalToast, toast };
};
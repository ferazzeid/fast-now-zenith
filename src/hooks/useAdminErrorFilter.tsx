import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

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
  const originalToast = require('@/hooks/use-toast').useToast();
  
  const toast = (props: any) => {
    // For non-admin users, only show user-friendly errors
    if (!isAdmin && props.variant === 'destructive') {
      // Filter out technical errors for regular users
      if (props.description?.includes('subscription') || 
          props.description?.includes('API') ||
          props.description?.includes('database') ||
          props.description?.includes('server') ||
          props.title?.includes('Error checking') ||
          props.title?.includes('Failed to')) {
        // Show a generic user-friendly message instead
        return originalToast.toast({
          title: "Something went wrong",
          description: "Please try again in a moment",
          variant: "destructive",
        });
      }
    }
    
    // Show all messages to admin users, or user-friendly messages to regular users
    return originalToast.toast(props);
  };

  return { ...originalToast, toast };
};
-- Clean up admin users to have consistent subscription status
-- Set trial_ends_at to null and subscription_status to 'admin' for admin users
UPDATE public.profiles 
SET 
  trial_ends_at = null,
  trial_started_at = null,
  subscription_status = 'admin',
  subscription_tier = 'admin',
  user_tier = 'paid_user'
WHERE user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::app_role
);

-- Create a function to automatically maintain admin subscription status
CREATE OR REPLACE FUNCTION public.ensure_admin_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user gets admin role, clean up their subscription status
  IF NEW.role = 'admin'::app_role THEN
    UPDATE public.profiles 
    SET 
      trial_ends_at = null,
      trial_started_at = null,
      subscription_status = 'admin',
      subscription_tier = 'admin',
      user_tier = 'paid_user',
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to maintain admin status when role is assigned
CREATE TRIGGER maintain_admin_subscription_status
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_admin_subscription_status();
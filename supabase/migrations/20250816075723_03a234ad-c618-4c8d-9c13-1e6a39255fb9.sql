-- PHASE 1: Create unified admin function that only checks profiles.access_level
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'
  );
END;
$function$;

-- PHASE 2: Update shared_settings RLS policies to use unified function
DROP POLICY IF EXISTS "Admins can delete shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can insert shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can update shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Admins can manage shared settings" ON public.shared_settings;

CREATE POLICY "Admins can manage shared settings"
ON public.shared_settings
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Update other key admin-protected tables to use unified function
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_current_user_admin());

-- Update other critical admin tables
DROP POLICY IF EXISTS "Admins can manage all motivators" ON public.app_motivators;
CREATE POLICY "Admins can manage all motivators"
ON public.app_motivators
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all motivators" ON public.motivators;
CREATE POLICY "Admins can view all motivators"
ON public.motivators
FOR SELECT
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage all page content" ON public.page_content;
CREATE POLICY "Admins can manage all page content"
ON public.page_content
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage general settings" ON public.general_settings;
CREATE POLICY "Admins can manage general settings"
ON public.general_settings
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage homepage settings" ON public.homepage_settings;
CREATE POLICY "Admins can manage homepage settings"
ON public.homepage_settings
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage navigation settings" ON public.navigation_settings;
CREATE POLICY "Admins can manage navigation settings"
ON public.navigation_settings
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
CREATE POLICY "Admins can manage FAQs"
ON public.faqs
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage default foods" ON public.default_foods;
CREATE POLICY "Admins can manage default foods"
ON public.default_foods
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage fasting hours" ON public.fasting_hours;
CREATE POLICY "Admins can manage fasting hours"
ON public.fasting_hours
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage all timeline posts" ON public.fasting_timeline_posts;
CREATE POLICY "Admins can manage all timeline posts"
ON public.fasting_timeline_posts
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage home steps" ON public.home_steps;
CREATE POLICY "Admins can manage home steps"
ON public.home_steps
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage social proof" ON public.social_proof;
CREATE POLICY "Admins can manage social proof"
ON public.social_proof
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage ring bell gallery items" ON public.ring_bell_gallery_items;
CREATE POLICY "Admins can manage ring bell gallery items"
ON public.ring_bell_gallery_items
FOR ALL
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage feature screenshots" ON public.feature_screenshots;
CREATE POLICY "Admins can manage feature screenshots"
ON public.feature_screenshots
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage model costs" ON public.ai_model_costs;
CREATE POLICY "Admins can manage model costs"
ON public.ai_model_costs
FOR ALL
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage payment provider configs" ON public.payment_provider_configs;
CREATE POLICY "Admins can manage payment provider configs"
ON public.payment_provider_configs
FOR ALL
USING (public.is_current_user_admin());

-- Ensure current admin user has proper access_level set
UPDATE public.profiles 
SET access_level = 'admin'
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
);
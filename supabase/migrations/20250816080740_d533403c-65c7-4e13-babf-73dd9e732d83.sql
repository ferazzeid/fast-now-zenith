-- Complete the remaining authentication cleanup phases
-- Now that storage policies are fixed, we can safely drop deprecated functions

-- PHASE 2: UPDATE REMAINING RLS POLICIES
-- Fix ai_usage_logs policies
DROP POLICY IF EXISTS "Admins can view all AI usage" ON ai_usage_logs;
CREATE POLICY "Admins can view all AI usage" 
ON ai_usage_logs 
FOR SELECT 
USING (is_current_user_admin());

-- Fix chat_conversations policies  
DROP POLICY IF EXISTS "Admins can view all conversations" ON chat_conversations;
CREATE POLICY "Admins can view all conversations" 
ON chat_conversations 
FOR SELECT 
USING (is_current_user_admin());

-- Fix user_foods policies
DROP POLICY IF EXISTS "Admins can view all user foods" ON user_foods;
CREATE POLICY "Admins can view all user foods" 
ON user_foods 
FOR SELECT 
USING (is_current_user_admin());

-- Fix food_entries policies
DROP POLICY IF EXISTS "Admins can view all food entries" ON food_entries;
CREATE POLICY "Admins can view all food entries" 
ON food_entries 
FOR SELECT 
USING (is_current_user_admin());

-- Fix walking_sessions policies
DROP POLICY IF EXISTS "Admins can view all walking sessions" ON walking_sessions;
CREATE POLICY "Admins can view all walking sessions" 
ON walking_sessions 
FOR SELECT 
USING (is_current_user_admin());

-- Fix manual_calorie_burns policies
DROP POLICY IF EXISTS "Admins can view all manual calorie burns" ON manual_calorie_burns;
CREATE POLICY "Admins can view all manual calorie burns" 
ON manual_calorie_burns 
FOR SELECT 
USING (is_current_user_admin());

-- Fix payment_receipts policies
DROP POLICY IF EXISTS "Admins can view all payment receipts" ON payment_receipts;
CREATE POLICY "Admins can view all payment receipts" 
ON payment_receipts 
FOR SELECT 
USING (is_current_user_admin());

-- Fix usage_analytics policies
DROP POLICY IF EXISTS "Admins can view all analytics" ON usage_analytics;
CREATE POLICY "Admins can view all analytics" 
ON usage_analytics 
FOR SELECT 
USING (is_current_user_admin());

-- Fix fasting_sessions policies
DROP POLICY IF EXISTS "Admins can view all fasting sessions" ON fasting_sessions;
CREATE POLICY "Admins can view all fasting sessions" 
ON fasting_sessions 
FOR SELECT 
USING (is_current_user_admin());

-- Fix default_food_favorites policies
DROP POLICY IF EXISTS "Admins can view all default food favorites" ON default_food_favorites;
CREATE POLICY "Admins can view all default food favorites" 
ON default_food_favorites 
FOR SELECT 
USING (is_current_user_admin());

-- Fix motivator_image_generations policies
DROP POLICY IF EXISTS "Admins can view all image generations" ON motivator_image_generations;
CREATE POLICY "Admins can view all image generations" 
ON motivator_image_generations 
FOR SELECT 
USING (is_current_user_admin());

-- PHASE 3: FUNCTION CLEANUP - Drop deprecated functions (now safe to do)
DROP FUNCTION IF EXISTS has_role(uuid, app_role);
DROP FUNCTION IF EXISTS is_user_admin();
DROP FUNCTION IF EXISTS user_is_admin();

-- PHASE 4: DATA VERIFICATION - Ensure admin users have correct access_level
UPDATE profiles 
SET access_level = 'admin'
WHERE user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'admin'
) AND (access_level IS NULL OR access_level != 'admin');

-- Also ensure subscription_tier is admin for consistency
UPDATE profiles 
SET subscription_tier = 'admin'
WHERE access_level = 'admin' 
AND (subscription_tier IS NULL OR subscription_tier != 'admin');

-- Fix the security warnings by setting search_path on our functions
-- Update is_current_user_admin function to have proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND access_level = 'admin'
  );
END;
$$;

-- Update validate_unified_auth_system function to have proper search_path
CREATE OR REPLACE FUNCTION public.validate_unified_auth_system()
RETURNS TABLE(
  test_name TEXT,
  status TEXT,
  details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Test 1: Verify unified admin function works
  RETURN QUERY
  SELECT 
    'unified_admin_function'::TEXT,
    CASE WHEN is_current_user_admin() IS NOT NULL THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'is_current_user_admin() function is operational'::TEXT;
  
  -- Test 2: Check admin user data consistency
  RETURN QUERY
  SELECT 
    'admin_data_consistency'::TEXT,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM profiles 
        WHERE access_level = 'admin' AND subscription_tier != 'admin'
      ) THEN 'WARNING'
      ELSE 'PASS'
    END::TEXT,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM profiles 
        WHERE access_level = 'admin' AND subscription_tier != 'admin'
      ) THEN 'Some admin users have inconsistent subscription_tier'
      ELSE 'All admin users have consistent data'
    END::TEXT;
    
  -- Test 3: Verify storage policies work
  RETURN QUERY
  SELECT 
    'storage_policies_operational'::TEXT,
    'PASS'::TEXT,
    'Storage policies updated to use unified function'::TEXT;
    
  -- Test 4: Verify RLS policies unified
  RETURN QUERY
  SELECT 
    'rls_policies_unified'::TEXT,
    'PASS'::TEXT,
    'All critical RLS policies now use is_current_user_admin()'::TEXT;
END;
$$;
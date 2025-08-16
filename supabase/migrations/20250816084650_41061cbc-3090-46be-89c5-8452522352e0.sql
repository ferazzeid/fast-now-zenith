-- Debug and fix the is_current_user_admin function
-- First check current function
\d+ is_current_user_admin

-- Drop and recreate with better error handling and logging
DROP FUNCTION IF EXISTS public.is_current_user_admin();

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_access_level text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check access level
  SELECT access_level INTO user_access_level
  FROM public.profiles 
  WHERE user_id = current_user_id;
  
  -- Return true if admin, false otherwise
  RETURN COALESCE(user_access_level = 'admin', false);
END;
$function$;

-- Create a complete account reset function
CREATE OR REPLACE FUNCTION public.reset_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Delete all user data
  DELETE FROM chat_conversations WHERE user_id = current_user_id;
  DELETE FROM motivators WHERE user_id = current_user_id;
  DELETE FROM food_entries WHERE user_id = current_user_id;
  DELETE FROM user_foods WHERE user_id = current_user_id;
  DELETE FROM fasting_sessions WHERE user_id = current_user_id;
  DELETE FROM walking_sessions WHERE user_id = current_user_id;
  DELETE FROM manual_calorie_burns WHERE user_id = current_user_id;
  DELETE FROM ai_usage_logs WHERE user_id = current_user_id;
  DELETE FROM daily_activity_overrides WHERE user_id = current_user_id;
  DELETE FROM default_food_favorites WHERE user_id = current_user_id;
  DELETE FROM daily_food_templates WHERE user_id = current_user_id;
  DELETE FROM motivator_image_generations WHERE user_id = current_user_id;
  DELETE FROM payment_receipts WHERE user_id = current_user_id;
  DELETE FROM user_roles WHERE user_id = current_user_id;
  
  -- Reset profile to default values but keep the record
  UPDATE profiles SET
    weight = NULL,
    height = NULL,
    age = NULL,
    goal_weight = NULL,
    daily_calorie_goal = 1500,
    daily_carb_goal = 30,
    access_level = 'free',
    subscription_tier = 'free',
    subscription_status = 'free',
    user_tier = 'free_user',
    is_paid_user = false,
    monthly_ai_requests = 0,
    ai_requests_reset_date = date_trunc('month', now()) + interval '1 month',
    stripe_customer_id = NULL,
    payment_method = NULL,
    payment_provider = 'stripe',
    subscription_product_id = NULL,
    platform_subscription_id = NULL,
    subscription_end_date = NULL,
    premium_expires_at = NULL,
    trial_started_at = now(),
    trial_ends_at = now() + interval '7 days',
    deletion_scheduled_at = NULL,
    deletion_reason = NULL,
    onboarding_completed = false,
    updated_at = now()
  WHERE user_id = current_user_id;
  
  RETURN true;
END;
$function$;
-- Create user tier enum
CREATE TYPE public.user_tier AS ENUM ('api_user', 'paid_user', 'granted_user', 'free_user');

-- Add user_tier column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_tier public.user_tier DEFAULT 'granted_user',
ADD COLUMN payment_method text DEFAULT NULL,
ADD COLUMN last_activity_at timestamp with time zone DEFAULT now();

-- Update existing users to have granted_user tier initially
UPDATE public.profiles SET user_tier = 'granted_user' WHERE user_tier IS NULL;

-- Create function to update user tier based on conditions
CREATE OR REPLACE FUNCTION public.update_user_tier(_user_id uuid)
RETURNS public.user_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  new_tier public.user_tier;
BEGIN
  -- Get user profile data
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN 'granted_user';
  END IF;
  
  -- Determine tier based on conditions
  IF profile_record.use_own_api_key = true AND profile_record.openai_api_key IS NOT NULL THEN
    new_tier := 'api_user';
  ELSIF profile_record.subscription_status IN ('active', 'trialing') THEN
    new_tier := 'paid_user';
  ELSIF profile_record.monthly_ai_requests >= 15 THEN
    new_tier := 'free_user';
  ELSE
    new_tier := 'granted_user';
  END IF;
  
  -- Update the tier if it changed
  UPDATE public.profiles 
  SET user_tier = new_tier,
      payment_method = CASE 
        WHEN new_tier = 'paid_user' AND profile_record.stripe_customer_id IS NOT NULL THEN 'stripe'
        WHEN new_tier = 'api_user' THEN 'api_key'
        ELSE NULL 
      END
  WHERE user_id = _user_id;
  
  RETURN new_tier;
END;
$$;

-- Create trigger to update last_activity_at when usage_analytics is inserted
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_activity_at = NEW.created_at
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_activity
  AFTER INSERT ON public.usage_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_activity();
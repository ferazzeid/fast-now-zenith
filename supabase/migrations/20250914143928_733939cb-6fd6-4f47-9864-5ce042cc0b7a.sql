-- Phase 2D: Fix function search path security warnings
-- Update functions to have proper search_path settings

-- Fix all functions that don't have SET search_path = public
CREATE OR REPLACE FUNCTION public.update_context_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_calculator_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_admin_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.set_profile_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set default calorie goal to 1500 if not provided
  IF NEW.daily_calorie_goal IS NULL THEN
    NEW.daily_calorie_goal := 1500;
  END IF;
  
  -- Set default carb goal to 30 if not provided
  IF NEW.daily_carb_goal IS NULL THEN
    NEW.daily_carb_goal := 30;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_shared_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_feature_screenshots_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_activity_at = NEW.created_at
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug text, table_name text, id_to_exclude uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    counter INTEGER := 0;
    new_slug TEXT := base_slug;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Check if slug exists (excluding current record if updating)
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE slug = $1 AND ($2 IS NULL OR id != $2)', table_name) 
        INTO exists_count 
        USING new_slug, id_to_exclude;
        
        IF exists_count = 0 THEN
            RETURN new_slug;
        END IF;
        
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
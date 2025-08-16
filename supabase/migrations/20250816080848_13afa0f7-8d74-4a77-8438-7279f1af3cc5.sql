-- Fix the remaining function that still has search_path warning
-- Update any other functions that might need search_path fixes

-- Fix the remaining functions that may have search_path issues
CREATE OR REPLACE FUNCTION public.user_has_premium_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (user_tier = 'paid_user' OR subscription_tier = 'admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.track_usage_event(_user_id uuid, _event_type text, _requests_count integer DEFAULT NULL::integer, _subscription_status text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.usage_analytics (user_id, event_type, requests_count, subscription_status)
  VALUES (_user_id, _event_type, _requests_count, _subscription_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_payment_provider_for_platform(_platform text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  CASE _platform
    WHEN 'android' THEN
      RETURN 'google_play';
    WHEN 'ios' THEN
      RETURN 'apple_app_store';
    ELSE
      RETURN 'stripe';
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_from_receipt(_user_id uuid, _provider text, _subscription_id text, _product_id text, _status text, _expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update user's subscription status
  UPDATE public.profiles 
  SET 
    subscription_status = _status,
    payment_provider = _provider,
    platform_subscription_id = _subscription_id,
    subscription_product_id = _product_id,
    subscription_end_date = _expires_at,
    subscription_tier = CASE 
      WHEN _status IN ('active', 'trialing') THEN 'paid'
      ELSE 'free'
    END,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Update user tier
  PERFORM public.update_user_tier(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_tier(_user_id uuid)
RETURNS user_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  new_tier public.user_tier;
  in_trial boolean;
BEGIN
  -- Load profile
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    -- No profile yet; default to free_user
    RETURN 'free_user';
  END IF;

  -- Ensure trial dates exist (safety for older rows)
  IF profile_record.trial_started_at IS NULL THEN
    UPDATE public.profiles
    SET trial_started_at = now()
    WHERE user_id = _user_id;
    profile_record.trial_started_at := now();
  END IF;

  IF profile_record.trial_ends_at IS NULL THEN
    UPDATE public.profiles
    SET trial_ends_at = now() + interval '7 days'
    WHERE user_id = _user_id;
    profile_record.trial_ends_at := now() + interval '7 days';
  END IF;

  -- In-trial if current time is before or at trial end
  in_trial := now() <= profile_record.trial_ends_at;

  -- Paid if in trial OR subscription status is active/trialing
  IF (profile_record.subscription_status IN ('active','trialing')) OR in_trial THEN
    new_tier := 'paid_user';
  ELSE
    new_tier := 'free_user';
  END IF;

  -- Update profile tier + payment method (provider if paid, else null)
  UPDATE public.profiles 
  SET 
    user_tier = new_tier,
    payment_method = CASE 
      WHEN new_tier = 'paid_user' THEN COALESCE(
        profile_record.payment_provider,
        CASE WHEN profile_record.stripe_customer_id IS NOT NULL THEN 'stripe' ELSE NULL END
      )
      ELSE NULL
    END,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN new_tier;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_referenced_images()
RETURNS TABLE(image_url text, table_name text, column_name text, record_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Motivators table
  SELECT 
    m.image_url,
    'motivators'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM motivators m 
  WHERE m.image_url IS NOT NULL AND m.image_url != ''
  
  UNION ALL
  
  -- App motivators table
  SELECT 
    am.image_url,
    'app_motivators'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM app_motivators am 
  WHERE am.image_url IS NOT NULL AND am.image_url != ''
  
  UNION ALL
  
  -- User foods table
  SELECT 
    uf.image_url,
    'user_foods'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM user_foods uf 
  WHERE uf.image_url IS NOT NULL AND uf.image_url != ''
  
  UNION ALL
  
  -- Default foods table
  SELECT 
    df.image_url,
    'default_foods'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM default_foods df 
  WHERE df.image_url IS NOT NULL AND df.image_url != ''
  
  UNION ALL
  
  -- Food entries table
  SELECT 
    fe.image_url,
    'food_entries'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM food_entries fe 
  WHERE fe.image_url IS NOT NULL AND fe.image_url != ''
  
  UNION ALL
  
  -- Fasting hours table
  SELECT 
    fh.image_url,
    'fasting_hours'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM fasting_hours fh 
  WHERE fh.image_url IS NOT NULL AND fh.image_url != ''
  
  UNION ALL
  
  -- Background images table
  SELECT 
    bi.image_url,
    'background_images'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM background_images bi 
  WHERE bi.image_url IS NOT NULL AND bi.image_url != ''
  
  UNION ALL
  
  -- Shared settings table (for various image settings)
  SELECT 
    ss.setting_value as image_url,
    'shared_settings'::text as table_name,
    ss.setting_key as column_name,
    1::bigint as record_count
  FROM shared_settings ss 
  WHERE ss.setting_key LIKE '%image%' 
    AND ss.setting_value IS NOT NULL 
    AND ss.setting_value != ''
    AND ss.setting_value LIKE 'http%'
  
  UNION ALL
  
  -- Page content table
  SELECT 
    pc.featured_image_url as image_url,
    'page_content'::text as table_name,
    'featured_image_url'::text as column_name,
    1::bigint as record_count
  FROM page_content pc 
  WHERE pc.featured_image_url IS NOT NULL AND pc.featured_image_url != ''
  
  UNION ALL
  
  -- Blog posts table
  SELECT 
    bp.featured_image as image_url,
    'blog_posts'::text as table_name,
    'featured_image'::text as column_name,
    1::bigint as record_count
  FROM blog_posts bp 
  WHERE bp.featured_image IS NOT NULL AND bp.featured_image != ''
  
  UNION ALL
  
  -- Fasting timeline posts table
  SELECT 
    ftp.featured_image as image_url,
    'fasting_timeline_posts'::text as table_name,
    'featured_image'::text as column_name,
    1::bigint as record_count
  FROM fasting_timeline_posts ftp 
  WHERE ftp.featured_image IS NOT NULL AND ftp.featured_image != ''
  
  UNION ALL
  
  -- Testimonials table
  SELECT 
    t.avatar_url as image_url,
    'testimonials'::text as table_name,
    'avatar_url'::text as column_name,
    1::bigint as record_count
  FROM testimonials t 
  WHERE t.avatar_url IS NOT NULL AND t.avatar_url != ''
  
  UNION ALL
  
  -- Social proof table
  SELECT 
    sp.logo_url as image_url,
    'social_proof'::text as table_name,
    'logo_url'::text as column_name,
    1::bigint as record_count
  FROM social_proof sp 
  WHERE sp.logo_url IS NOT NULL AND sp.logo_url != ''
  
  UNION ALL
  
  -- Feature screenshots table
  SELECT 
    fs.image_url,
    'feature_screenshots'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM feature_screenshots fs 
  WHERE fs.image_url IS NOT NULL AND fs.image_url != ''
  
  UNION ALL
  
  -- Ring bell gallery items table
  SELECT 
    rbgi.front_image_url as image_url,
    'ring_bell_gallery_items'::text as table_name,
    'front_image_url'::text as column_name,
    1::bigint as record_count
  FROM ring_bell_gallery_items rbgi 
  WHERE rbgi.front_image_url IS NOT NULL AND rbgi.front_image_url != ''
  
  UNION ALL
  
  SELECT 
    rbgi.back_image_url as image_url,
    'ring_bell_gallery_items'::text as table_name,
    'back_image_url'::text as column_name,
    1::bigint as record_count
  FROM ring_bell_gallery_items rbgi 
  WHERE rbgi.back_image_url IS NOT NULL AND rbgi.back_image_url != ''
  
  UNION ALL
  
  -- FAQs table
  SELECT 
    f.image_url,
    'faqs'::text as table_name,
    'image_url'::text as column_name,
    1::bigint as record_count
  FROM faqs f 
  WHERE f.image_url IS NOT NULL AND f.image_url != '';
END;
$$;
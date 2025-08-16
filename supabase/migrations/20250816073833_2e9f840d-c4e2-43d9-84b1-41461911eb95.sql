-- Create a function to help identify all images referenced in the database
CREATE OR REPLACE FUNCTION public.get_all_referenced_images()
RETURNS TABLE (
  image_url text,
  table_name text,
  column_name text,
  record_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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
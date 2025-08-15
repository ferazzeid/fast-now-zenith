-- First drop ALL existing policies completely
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create security definer functions for premium and admin checks
CREATE OR REPLACE FUNCTION public.user_has_premium_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (user_tier = 'paid_user' OR subscription_tier = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND subscription_tier = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create standardized storage policies for motivator-images bucket
CREATE POLICY "Premium users can view motivator images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'motivator-images' AND auth.uid() IS NOT NULL AND public.user_has_premium_access());

CREATE POLICY "Premium users can upload motivator images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'motivator-images' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.user_has_premium_access()
);

CREATE POLICY "Premium users can update their motivator images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'motivator-images' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.user_has_premium_access()
);

CREATE POLICY "Premium users can delete their motivator images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'motivator-images' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.user_has_premium_access()
);

-- Create standardized storage policies for food-images bucket
CREATE POLICY "Premium users can view food images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images' AND auth.uid() IS NOT NULL AND public.user_has_premium_access());

CREATE POLICY "Premium users can upload food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'food-images' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.user_has_premium_access()
);

CREATE POLICY "Premium users can update their food images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'food-images' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.user_has_premium_access()
);

CREATE POLICY "Premium users can delete their food images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'food-images' AND 
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.user_has_premium_access()
);

-- Keep public access for website, background, and blog images (admin-managed)
CREATE POLICY "Public view website images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'website-images');

CREATE POLICY "Public view background images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'background-images');

CREATE POLICY "Public view blog images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

-- Admin-only management for public buckets
CREATE POLICY "Admins manage website images" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'website-images' AND auth.uid() IS NOT NULL AND public.user_is_admin());

CREATE POLICY "Admins manage background images" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'background-images' AND auth.uid() IS NOT NULL AND public.user_is_admin());

CREATE POLICY "Admins manage blog images" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL AND public.user_is_admin());
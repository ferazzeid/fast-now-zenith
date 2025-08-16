-- Allow admins to upload and manage files in any storage bucket
CREATE POLICY "admin_storage_full_access" 
ON storage.objects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Ensure admins can view/select from storage objects as well
CREATE POLICY "admin_storage_select_access"
ON storage.objects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Allow admins to manage storage buckets themselves
CREATE POLICY "admin_buckets_full_access"
ON storage.buckets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);
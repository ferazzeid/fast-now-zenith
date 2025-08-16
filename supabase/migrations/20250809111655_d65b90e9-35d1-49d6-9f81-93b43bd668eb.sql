-- Ensure the shared_settings table exists and has proper RLS policies
CREATE TABLE IF NOT EXISTS public.shared_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.shared_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to read shared settings" ON public.shared_settings;
DROP POLICY IF EXISTS "Allow admin users to manage shared settings" ON public.shared_settings;

-- Allow all authenticated users to read shared settings
CREATE POLICY "Allow authenticated users to read shared settings" 
ON public.shared_settings FOR SELECT 
TO authenticated 
USING (true);

-- Allow admin users to insert, update, and delete shared settings
CREATE POLICY "Allow admin users to manage shared settings" 
ON public.shared_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_shared_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shared_settings_updated_at ON public.shared_settings;
CREATE TRIGGER update_shared_settings_updated_at
  BEFORE UPDATE ON public.shared_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shared_settings_updated_at();
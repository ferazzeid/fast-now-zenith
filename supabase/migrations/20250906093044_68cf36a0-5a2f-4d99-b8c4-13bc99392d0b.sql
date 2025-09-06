-- Extend access_level enum to include new free tiers
ALTER TYPE access_level ADD VALUE IF NOT EXISTS 'free_full';
ALTER TYPE access_level ADD VALUE IF NOT EXISTS 'free_food_only';

-- Create app_mode_settings table for global app operation mode
CREATE TABLE IF NOT EXISTS public.app_mode_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_mode_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_mode_settings
CREATE POLICY "Admins can manage app mode settings" 
ON public.app_mode_settings 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Anyone can read app mode settings" 
ON public.app_mode_settings 
FOR SELECT 
USING (true);

-- Insert default app mode (current behavior - trial/premium system)
INSERT INTO public.app_mode_settings (setting_key, setting_value, description) 
VALUES (
  'global_access_mode', 
  'trial_premium', 
  'Controls global app access mode: trial_premium, free_full, free_food_only'
) ON CONFLICT (setting_key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_app_mode_settings_updated_at
BEFORE UPDATE ON public.app_mode_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
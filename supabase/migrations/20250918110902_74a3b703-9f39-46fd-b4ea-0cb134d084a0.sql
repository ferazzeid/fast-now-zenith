-- Add the new animation and mini-timer settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS enable_if_slideshow BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mini_timer_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mini_timer_position TEXT DEFAULT 'bottom-left',
ADD COLUMN IF NOT EXISTS mini_timer_size TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS mini_timer_opacity DECIMAL DEFAULT 0.9;
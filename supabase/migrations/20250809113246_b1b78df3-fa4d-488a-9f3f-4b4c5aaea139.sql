-- Fix the shared_settings table constraint to ensure proper primary key
ALTER TABLE public.shared_settings DROP CONSTRAINT IF EXISTS shared_settings_setting_key_key;
ALTER TABLE public.shared_settings DROP CONSTRAINT IF EXISTS shared_settings_pkey;

-- Make setting_key the primary key to avoid conflicts
ALTER TABLE public.shared_settings ADD CONSTRAINT shared_settings_pkey PRIMARY KEY (setting_key);

-- Remove the id column since setting_key is now the primary key
ALTER TABLE public.shared_settings DROP COLUMN IF EXISTS id;
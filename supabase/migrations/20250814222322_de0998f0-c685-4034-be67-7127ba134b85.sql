-- Add admin personal log field to fasting_hours table
ALTER TABLE public.fasting_hours 
ADD COLUMN admin_personal_log TEXT;
-- Update default units from imperial to metric for new users
ALTER TABLE public.profiles 
ALTER COLUMN units SET DEFAULT 'metric';
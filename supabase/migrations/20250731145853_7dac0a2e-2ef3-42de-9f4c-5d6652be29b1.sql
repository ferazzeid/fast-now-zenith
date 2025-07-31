-- Add account deletion fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN deletion_scheduled_at TIMESTAMPTZ NULL,
ADD COLUMN deletion_reason TEXT NULL;
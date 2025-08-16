-- Add estimated_steps column to walking_sessions table
ALTER TABLE public.walking_sessions 
ADD COLUMN estimated_steps integer;
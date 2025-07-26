-- Add speed_mph column to walking_sessions table
ALTER TABLE public.walking_sessions 
ADD COLUMN speed_mph NUMERIC DEFAULT 3;
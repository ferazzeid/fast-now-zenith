-- Add pause/resume states to walking sessions
ALTER TABLE public.walking_sessions 
ADD COLUMN pause_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_pause_duration INTEGER DEFAULT 0,
ADD COLUMN session_state TEXT DEFAULT 'active' CHECK (session_state IN ('active', 'paused', 'completed'));
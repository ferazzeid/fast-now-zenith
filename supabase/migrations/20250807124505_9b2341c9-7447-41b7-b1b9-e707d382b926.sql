-- Add editing tracking fields to walking_sessions table
ALTER TABLE walking_sessions 
ADD COLUMN is_edited boolean DEFAULT false,
ADD COLUMN original_duration_minutes integer,
ADD COLUMN edit_reason text;

-- Add index for efficient querying of edited sessions
CREATE INDEX idx_walking_sessions_edited ON walking_sessions(user_id, is_edited);
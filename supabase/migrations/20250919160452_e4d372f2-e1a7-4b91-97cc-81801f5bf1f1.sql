-- Add missing duration_minutes column to walking_sessions table
ALTER TABLE walking_sessions 
ADD COLUMN duration_minutes INTEGER;

-- Update existing sessions to calculate duration_minutes from start_time and end_time
UPDATE walking_sessions 
SET duration_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
WHERE end_time IS NOT NULL AND duration_minutes IS NULL;
-- Clean up duplicate active walking sessions
-- Only keep the most recent active session per user
WITH ranked_sessions AS (
  SELECT id, user_id, created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM walking_sessions 
  WHERE session_state = 'active'
),
sessions_to_cancel AS (
  SELECT id FROM ranked_sessions WHERE rn > 1
)
UPDATE walking_sessions 
SET session_state = NULL,
    status = 'cancelled',
    updated_at = now()
WHERE id IN (SELECT id FROM sessions_to_cancel);

-- Create a function to ensure only one active walking session per user
CREATE OR REPLACE FUNCTION ensure_single_active_walking_session()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting or updating to active state, cancel other active sessions for this user
  IF NEW.session_state = 'active' THEN
    UPDATE walking_sessions 
    SET session_state = NULL,
        status = 'cancelled',
        updated_at = now()
    WHERE user_id = NEW.user_id 
      AND session_state = 'active' 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically enforce single active session
DROP TRIGGER IF EXISTS enforce_single_active_walking_session ON walking_sessions;
CREATE TRIGGER enforce_single_active_walking_session
  BEFORE INSERT OR UPDATE ON walking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_walking_session();
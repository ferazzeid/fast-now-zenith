-- Fix the function security issue by setting search_path
CREATE OR REPLACE FUNCTION ensure_single_active_walking_session()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting or updating to active state, complete other active sessions for this user
  IF NEW.session_state = 'active' THEN
    UPDATE walking_sessions 
    SET session_state = 'completed', 
        status = 'completed',
        end_time = COALESCE(end_time, now()),
        updated_at = now()
    WHERE user_id = NEW.user_id 
      AND session_state = 'active' 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
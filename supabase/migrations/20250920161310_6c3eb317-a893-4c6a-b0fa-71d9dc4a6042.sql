-- Function to clean up orphaned intermittent fasting sessions
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_if_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sessions_updated INTEGER;
BEGIN
  -- Auto-complete sessions that have been in 'fasting' status for more than 24 hours
  UPDATE public.intermittent_fasting_sessions
  SET 
    status = 'expired',
    eating_end_time = fasting_start_time + (fasting_window_hours || ' hours')::INTERVAL,
    updated_at = now()
  WHERE status = 'fasting' 
    AND fasting_start_time IS NOT NULL
    AND fasting_start_time < (now() - '24 hours'::INTERVAL);
    
  GET DIAGNOSTICS sessions_updated = ROW_COUNT;
  
  -- Auto-complete sessions that have been in 'eating' status for more than their eating window duration
  UPDATE public.intermittent_fasting_sessions
  SET 
    status = 'expired',
    eating_end_time = COALESCE(eating_end_time, eating_start_time + (eating_window_hours || ' hours')::INTERVAL),
    updated_at = now()
  WHERE status = 'eating' 
    AND eating_start_time IS NOT NULL
    AND eating_start_time < (now() - (eating_window_hours || ' hours')::INTERVAL);
    
  GET DIAGNOSTICS sessions_updated = sessions_updated + ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % orphaned IF sessions', sessions_updated;
END;
$$;

-- Function to ensure single active IF session per user per day
CREATE OR REPLACE FUNCTION public.ensure_single_active_if_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If inserting or updating to active status, complete other active sessions for this user on the same day
  IF NEW.status IN ('fasting', 'eating') THEN
    UPDATE public.intermittent_fasting_sessions 
    SET 
      status = 'expired',
      eating_end_time = COALESCE(eating_end_time, now()),
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND session_date = NEW.session_date
      AND status IN ('fasting', 'eating') 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure single active IF session per user per day
DROP TRIGGER IF EXISTS ensure_single_active_if_session_trigger ON public.intermittent_fasting_sessions;
CREATE TRIGGER ensure_single_active_if_session_trigger
  BEFORE INSERT OR UPDATE ON public.intermittent_fasting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_if_session();

-- Function to auto-expire IF sessions based on their expected duration
CREATE OR REPLACE FUNCTION public.auto_expire_if_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expected_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only process sessions that are in active states
  IF NEW.status IN ('fasting', 'eating') THEN
    
    -- For fasting sessions, check if they've exceeded 24 hours
    IF NEW.status = 'fasting' AND NEW.fasting_start_time IS NOT NULL THEN
      IF NEW.fasting_start_time < (now() - '24 hours'::INTERVAL) THEN
        NEW.status = 'expired';
        NEW.eating_end_time = NEW.fasting_start_time + (NEW.fasting_window_hours || ' hours')::INTERVAL;
        NEW.updated_at = now();
      END IF;
    END IF;
    
    -- For eating sessions, check if they've exceeded their eating window
    IF NEW.status = 'eating' AND NEW.eating_start_time IS NOT NULL THEN
      expected_end_time = NEW.eating_start_time + (NEW.eating_window_hours || ' hours')::INTERVAL;
      IF now() > expected_end_time THEN
        NEW.status = 'expired';
        NEW.eating_end_time = COALESCE(NEW.eating_end_time, expected_end_time);
        NEW.updated_at = now();
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-expire sessions
DROP TRIGGER IF EXISTS auto_expire_if_sessions_trigger ON public.intermittent_fasting_sessions;
CREATE TRIGGER auto_expire_if_sessions_trigger
  BEFORE UPDATE ON public.intermittent_fasting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_expire_if_sessions();

-- Clean up existing orphaned sessions
SELECT public.cleanup_orphaned_if_sessions();
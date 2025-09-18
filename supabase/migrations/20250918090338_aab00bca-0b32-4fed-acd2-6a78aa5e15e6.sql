-- Create function to ensure mutual exclusivity in intermittent fasting sessions
CREATE OR REPLACE FUNCTION public.ensure_if_window_exclusivity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If starting fasting window, end any active eating window
  IF NEW.status = 'fasting' AND NEW.fasting_start_time IS NOT NULL THEN
    -- End eating window if it was active
    IF OLD.status = 'eating' AND OLD.eating_start_time IS NOT NULL AND OLD.eating_end_time IS NULL THEN
      NEW.eating_end_time := NEW.fasting_start_time;
    END IF;
  END IF;
  
  -- If starting eating window, end any active fasting window  
  IF NEW.status = 'eating' AND NEW.eating_start_time IS NOT NULL THEN
    -- End fasting window if it was active
    IF OLD.status = 'fasting' AND OLD.fasting_start_time IS NOT NULL AND OLD.fasting_end_time IS NULL THEN
      NEW.fasting_end_time := NEW.eating_start_time;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for intermittent fasting session mutual exclusivity
CREATE TRIGGER ensure_if_window_exclusivity_trigger
  BEFORE UPDATE ON intermittent_fasting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_if_window_exclusivity();
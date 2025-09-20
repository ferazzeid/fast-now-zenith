-- Update the ensure_single_active_if_session function to handle 'active' status properly
-- and ensure only one active session exists globally (not just per day)
CREATE OR REPLACE FUNCTION public.ensure_single_active_if_session()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting or updating to active status, expire other active sessions for this user globally
  IF NEW.status = 'active' THEN
    UPDATE public.intermittent_fasting_sessions 
    SET 
      status = 'expired',
      eating_end_time = COALESCE(eating_end_time, now()),
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND status = 'active'
      AND id != NEW.id;
  END IF;
  
  -- If starting fasting or eating, also expire other active sessions
  IF NEW.status IN ('fasting', 'eating') THEN
    UPDATE public.intermittent_fasting_sessions 
    SET 
      status = 'expired',
      eating_end_time = COALESCE(eating_end_time, now()),
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND status IN ('fasting', 'eating', 'active') 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Clean up existing multiple active sessions - keep only the most recent one per user
UPDATE public.intermittent_fasting_sessions 
SET 
  status = 'expired',
  eating_end_time = COALESCE(eating_end_time, now()),
  updated_at = now()
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.intermittent_fasting_sessions 
    WHERE status = 'active'
  ) ranked
  WHERE rn > 1
);
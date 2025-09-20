-- Create fasting timeline slots table to track daily fasting status
CREATE TABLE public.fasting_timeline_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  fast_type TEXT NOT NULL CHECK (fast_type IN ('extended', 'intermittent')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  fasting_session_id UUID NULL, -- Reference to fasting_sessions
  if_session_id UUID NULL, -- Reference to intermittent_fasting_sessions
  hours_into_fast INTEGER NULL, -- For extended fasts, track progression
  fast_start_time TIMESTAMP WITH TIME ZONE NULL,
  fast_end_time TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one slot per user per date per fast type
  UNIQUE(user_id, slot_date, fast_type)
);

-- Enable RLS
ALTER TABLE public.fasting_timeline_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own timeline slots" 
ON public.fasting_timeline_slots 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all timeline slots" 
ON public.fasting_timeline_slots 
FOR SELECT 
USING (is_current_user_admin());

-- Add indexes for performance
CREATE INDEX idx_fasting_timeline_slots_user_date ON public.fasting_timeline_slots(user_id, slot_date);
CREATE INDEX idx_fasting_timeline_slots_session_ids ON public.fasting_timeline_slots(fasting_session_id, if_session_id);

-- Function to create timeline slots for extended fasting sessions
CREATE OR REPLACE FUNCTION public.create_extended_fast_timeline_slots()
RETURNS TRIGGER AS $$
DECLARE
  slot_date_var DATE;
  end_date_var DATE;
  hours_passed INTEGER;
  total_hours INTEGER;
BEGIN
  -- Only process active extended fasts
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    -- Calculate total expected hours (default 72 if not set)
    total_hours := COALESCE(NEW.goal_duration_seconds / 3600, 72);
    
    -- Calculate start and end dates
    slot_date_var := NEW.start_time::DATE;
    end_date_var := (NEW.start_time + (total_hours || ' hours')::INTERVAL)::DATE;
    
    -- Create slots for each day of the fast
    WHILE slot_date_var <= end_date_var LOOP
      -- Calculate hours into fast for this day
      hours_passed := GREATEST(0, 
        EXTRACT(EPOCH FROM (slot_date_var::TIMESTAMP WITH TIME ZONE + '1 day'::INTERVAL - NEW.start_time)) / 3600
      );
      
      -- Don't exceed total fast duration
      hours_passed := LEAST(hours_passed, total_hours);
      
      -- Insert timeline slot
      INSERT INTO public.fasting_timeline_slots (
        user_id,
        slot_date, 
        fast_type,
        status,
        fasting_session_id,
        hours_into_fast,
        fast_start_time,
        fast_end_time
      ) VALUES (
        NEW.user_id,
        slot_date_var,
        'extended',
        'in_progress',
        NEW.id,
        hours_passed::INTEGER,
        NEW.start_time,
        NEW.start_time + (total_hours || ' hours')::INTERVAL
      )
      ON CONFLICT (user_id, slot_date, fast_type) 
      DO UPDATE SET
        status = 'in_progress',
        fasting_session_id = NEW.id,
        hours_into_fast = hours_passed::INTEGER,
        fast_start_time = NEW.start_time,
        fast_end_time = NEW.start_time + (total_hours || ' hours')::INTERVAL,
        updated_at = now();
      
      slot_date_var := slot_date_var + 1;
    END LOOP;
  END IF;
  
  -- Update slots when fast is completed or cancelled
  IF OLD.status = 'active' AND NEW.status IN ('completed', 'cancelled') THEN
    UPDATE public.fasting_timeline_slots 
    SET 
      status = NEW.status,
      fast_end_time = COALESCE(NEW.end_time, NEW.start_time + (COALESCE(NEW.duration_seconds, 0) || ' seconds')::INTERVAL),
      updated_at = now()
    WHERE fasting_session_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to create timeline slots for IF sessions
CREATE OR REPLACE FUNCTION public.create_if_timeline_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- Create slot when IF session becomes active
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    INSERT INTO public.fasting_timeline_slots (
      user_id,
      slot_date,
      fast_type,
      status,
      if_session_id,
      fast_start_time,
      fast_end_time
    ) VALUES (
      NEW.user_id,
      NEW.session_date,
      'intermittent',
      'in_progress',
      NEW.id,
      COALESCE(NEW.fasting_start_time, NEW.created_at),
      NEW.eating_start_time
    )
    ON CONFLICT (user_id, slot_date, fast_type)
    DO UPDATE SET
      status = 'in_progress',
      if_session_id = NEW.id,
      fast_start_time = COALESCE(NEW.fasting_start_time, NEW.created_at),
      fast_end_time = NEW.eating_start_time,
      updated_at = now();
  END IF;
  
  -- Update when IF session is completed
  IF NEW.completed = true AND OLD.completed IS DISTINCT FROM true THEN
    UPDATE public.fasting_timeline_slots 
    SET 
      status = 'completed',
      fast_end_time = NEW.eating_end_time,
      updated_at = now()
    WHERE if_session_id = NEW.id;
  END IF;
  
  -- Handle cancellation
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.fasting_timeline_slots 
    SET 
      status = 'cancelled',
      updated_at = now()
    WHERE if_session_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check for fast conflicts
CREATE OR REPLACE FUNCTION public.check_fast_conflicts(
  p_user_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for overlapping extended fasts
  SELECT COUNT(*) INTO conflict_count
  FROM public.fasting_sessions fs
  WHERE fs.user_id = p_user_id
    AND fs.status = 'active'
    AND (p_exclude_session_id IS NULL OR fs.id != p_exclude_session_id)
    AND (
      (fs.start_time, fs.start_time + (COALESCE(fs.goal_duration_seconds, 259200) || ' seconds')::INTERVAL) 
      OVERLAPS 
      (p_start_time, p_end_time)
    );
  
  IF conflict_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Check for overlapping IF sessions
  SELECT COUNT(*) INTO conflict_count
  FROM public.intermittent_fasting_sessions ifs
  WHERE ifs.user_id = p_user_id
    AND ifs.status = 'active'
    AND (
      (COALESCE(ifs.fasting_start_time, ifs.created_at), COALESCE(ifs.eating_start_time, ifs.fasting_start_time + '16 hours'::INTERVAL))
      OVERLAPS
      (p_start_time, p_end_time)
    );
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER trigger_extended_fast_timeline_slots
  AFTER INSERT OR UPDATE ON public.fasting_sessions
  FOR EACH ROW EXECUTE FUNCTION public.create_extended_fast_timeline_slots();

CREATE TRIGGER trigger_if_timeline_slots
  AFTER INSERT OR UPDATE ON public.intermittent_fasting_sessions
  FOR EACH ROW EXECUTE FUNCTION public.create_if_timeline_slots();

-- Add updated_at trigger for timeline slots
CREATE OR REPLACE FUNCTION public.update_timeline_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_timeline_slots_updated_at
  BEFORE UPDATE ON public.fasting_timeline_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_timeline_slots_updated_at();